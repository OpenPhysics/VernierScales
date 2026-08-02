/**
 * CaliperNode.ts
 *
 * A vernier caliper drawn as the tool actually looks: graduated beam, tapered
 * jaws above and below it, and a sliding assembly carrying the vernier plate,
 * the clamp screw and the thumb tab. Drag the slider to measure.
 *
 * ── Drawn from the spec, not from imagination ─────────────────────────────────
 *
 * The beam's graduations and the vernier plate's are generated from the active
 * {@link VernierScaleSpec} at true spacing — one main division really is
 * `mainDivision × pixelsPerUnit` wide, and the plate really is as long as the
 * vernier scale it carries. A 0.02 mm caliper therefore gets a visibly longer
 * slider than a 0.1 mm one, exactly as in the catalogue.
 *
 * At this size the marks are far too fine to read — a 150 mm beam is under 400
 * pixels, so a millimetre is under two of them. That is not a defect to
 * apologise for: it is the reason a caliper needs a vernier at all, and the
 * reason the {@link ScaleViewsNode} below exists. This node shows the instrument
 * and *what is being measured*; the views below are the magnifier. Where the
 * graduations would collapse into a grey smear (a half-millimetre main scale, an
 * inch scale divided into fortieths) only every second or fifth is drawn, since
 * a smear says less about the tool than a legible engraving does.
 *
 * ── Geometry ──────────────────────────────────────────────────────────────────
 *
 * The origin sits at the measuring face of the fixed jaw, with the beam's top
 * edge at y = 0. Outside jaws hang below the beam, inside jaws rise above it, and
 * the jaw opening in view coordinates is exactly the measurement in model
 * coordinates times {@link pixelsPerUnit} — so the gap you see is the gap the
 * scales report, with no separate scaling to keep in sync. The sliding jaw's
 * measuring face and the vernier plate's zero line are the same plane, as they
 * are on the tool.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Multilink } from "scenerystack/axon";
import { toFixedNumber } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { optionize } from "scenerystack/phet-core";
import type { Color } from "scenerystack/scenery";
import {
  Circle,
  DragListener,
  InteractiveHighlighting,
  Node,
  type NodeOptions,
  Path,
  Rectangle,
  Text,
} from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import {
  canonicalRange,
  fromSpecUnits,
  fromTicks,
  type VernierScaleSpec,
  vernierSpan,
} from "../../common/model/VernierScaleSpec.js";
import { vernierDivisionTicks, vernierLabel } from "../../common/model/vernier.js";
import { createVernierKeyboardListener } from "../../common/view/createVernierKeyboardListener.js";
import { barFill, knurlShape, shade } from "../../common/view/metalFills.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import {
  CALIPER_BEAM_HEIGHT,
  CALIPER_BEAM_LENGTH,
  CALIPER_INSIDE_JAW_LENGTH,
  CALIPER_JAW_LENGTH,
  CALIPER_JAW_WIDTH,
} from "../../VernierScalesConstants.js";
import { MeasurementMode } from "../model/CaliperModel.js";

// ── Jaw profiles ─────────────────────────────────────────────────────────────

/** Width of an inside jaw at its tip, before it tapers out to the full width. */
const NIB_TIP_WIDTH = 6;

/** Width of an outside jaw at its tip. Real jaws thin to a near knife edge. */
const JAW_TIP_WIDTH = 4;

/** How far down the outside jaw stays at full width before it starts to taper. */
const JAW_SHOULDER = CALIPER_JAW_LENGTH * 0.34;

// ── Beam ─────────────────────────────────────────────────────────────────────

/** Kept clear at the tail of the beam so the slider never runs off the end. */
const BEAM_END_MARGIN = 10;

/**
 * The line the main scale is read against: main ticks rise from it, and the
 * vernier plate's top edge lies along it, which is what puts the two scales
 * within a hair of each other on the real instrument.
 */
const SCALE_BASELINE = 16;

const MAIN_TICK = 4;
const MAIN_TICK_MAJOR = 7;

/** Thickness of the depth rod. */
const DEPTH_ROD_HEIGHT = 7;

// ── Slider ───────────────────────────────────────────────────────────────────

/** How far the vernier plate hangs below the beam. */
const PLATE_BOTTOM = CALIPER_BEAM_HEIGHT + 10;

const VERNIER_TICK = 4;
const VERNIER_TICK_MAJOR = 7;

/** Length of the block at the plate's tail that carries the clamp and thumb tab. */
const BODY_LENGTH = 38;

/** How far the slider's block overhangs the beam, top and bottom. */
const BODY_TOP = -7;

/** Clear space between the last vernier mark and the block. */
const PLATE_PAD = 8;

/** Shortest plate worth drawing, for scales whose vernier is very short. */
const MIN_PLATE_LENGTH = 64;

/** Font for everything engraved on the instrument. */
const ENGRAVED_FONT_SIZE = 7;

/** Below this spacing a comb of ticks reads as a smear rather than a scale. */
const MIN_TICK_SPACING = 1.6;

/** Room a main-scale number needs before the next one, and a vernier number. */
const MIN_MAIN_LABEL_SPACING = 26;
const MIN_VERNIER_LABEL_SPACING = 13;

/**
 * Colour of everything engraved on the instrument's metal.
 *
 * The beam and the plate are instrument body, light in both colour profiles, so
 * their graduations must be dark in both — which is what the instrument stroke
 * colour is. `scaleTickColorProperty` inverts with the scale face and would
 * vanish here in the default profile.
 */
const engravedColorProperty = VernierScalesColors.instrumentStrokeColorProperty;

/** A Rectangle that highlights on hover and focus, for the draggable slider. */
class InteractiveSlider extends InteractiveHighlighting(Rectangle) {}

/**
 * Outline of one head: the inside jaw above the beam and the outside jaw below
 * it, both tapering away from a single flat measuring face on the plane x = 0.
 *
 * `sign` is −1 for the fixed head, whose body lies to the left of its face, and
 * +1 for the sliding head, which is the same casting mirrored.
 */
const headShape = (sign: number): Shape => {
  const w = sign * CALIPER_JAW_WIDTH;
  const nibTip = sign * NIB_TIP_WIDTH;
  const jawTip = sign * JAW_TIP_WIDTH;
  const top = -CALIPER_INSIDE_JAW_LENGTH;
  const bottom = CALIPER_BEAM_HEIGHT + CALIPER_JAW_LENGTH;

  // The flanks are curved rather than straight: a forged jaw keeps most of its
  // section well down its length and only then sweeps in to the edge, which is
  // what stops it reading as a flat blade.
  return new Shape()
    .moveTo(0, top)
    .lineTo(nibTip - sign * 2, top)
    .lineTo(nibTip, top + 3)
    .lineTo(w, top + 17)
    .lineTo(w, CALIPER_BEAM_HEIGHT + JAW_SHOULDER)
    .quadraticCurveTo(w, bottom - 18, jawTip, bottom - 4)
    .lineTo(jawTip - sign * 1.5, bottom)
    .lineTo(0, bottom)
    .close();
};

type SelfOptions = {
  /** Accessible name for the draggable slider. */
  sliderAccessibleName?: TReadOnlyProperty<string> | null;

  /** Accessible help text for the draggable slider. */
  sliderAccessibleHelpText?: TReadOnlyProperty<string> | null;
};

export type CaliperNodeOptions = SelfOptions & NodeOptions;

export class CaliperNode extends Node {
  private readonly sliderAssembly: Node;
  private readonly workpiecePath: Path;
  private readonly depthRod: Rectangle;

  /** The beam's engraved main scale, redrawn when the scale preset changes. */
  private readonly mainTicksPath: Path;
  private readonly mainLabelsLayer: Node;

  /** The vernier plate, as long as the vernier scale it carries. */
  private readonly vernierPlate: Rectangle;
  private readonly vernierTicksPath: Path;
  private readonly vernierLabelsLayer: Node;

  /** Clamp screw and thumb tab, which ride at the tail of the plate. */
  private readonly sliderTail: Node;

  private readonly sliderTargetRect: InteractiveSlider;

  /** The focusable slider, for a screen's pdomOrder. */
  public readonly sliderTarget: Node;

  /**
   * View pixels per canonical unit. Depends on the active scale through both its
   * range and the length of its vernier, since the plate has to fit on the beam
   * alongside the full travel.
   */
  private pixelsPerUnit = 1;

  /** Which spec the engraved scales were last drawn for. */
  private engravedSpec: VernierScaleSpec | null = null;

  public constructor(
    model: VernierScaleModel,
    measurementModeProperty: TReadOnlyProperty<MeasurementMode>,
    providedOptions?: CaliperNodeOptions,
  ) {
    const options = optionize<CaliperNodeOptions, SelfOptions, NodeOptions>()(
      { sliderAccessibleName: null, sliderAccessibleHelpText: null },
      providedOptions,
    );
    super(options);

    const bodyFill = VernierScalesColors.instrumentBodyColorProperty;
    const sliderFill = VernierScalesColors.instrumentSliderColorProperty;
    const stroke = VernierScalesColors.instrumentStrokeColorProperty;

    const headTop = -CALIPER_INSIDE_JAW_LENGTH;
    const headBottom = CALIPER_BEAM_HEIGHT + CALIPER_JAW_LENGTH;

    // ── Workpiece, behind the instrument so the jaws read as gripping it ──────
    this.workpiecePath = new Path(null, {
      fill: VernierScalesColors.workpieceColorProperty,
      stroke,
      lineWidth: 1,
    });
    this.addChild(this.workpiecePath);

    // ── Beam ──────────────────────────────────────────────────────────────────
    this.addChild(
      new Rectangle(-CALIPER_JAW_WIDTH, 0, CALIPER_BEAM_LENGTH + CALIPER_JAW_WIDTH, CALIPER_BEAM_HEIGHT, {
        fill: barFill(bodyFill, 0, CALIPER_BEAM_HEIGHT),
        stroke,
        cornerRadius: 2,
      }),
    );

    // The step in the beam's section that the graduated land is machined into.
    this.addChild(
      new Path(Shape.lineSegment(0, SCALE_BASELINE, CALIPER_BEAM_LENGTH, SCALE_BASELINE), {
        stroke: shade(bodyFill, -0.3),
        lineWidth: 0.6,
      }),
    );

    this.mainTicksPath = new Path(null, { stroke: engravedColorProperty, lineWidth: 0.7 });
    this.mainLabelsLayer = new Node();
    this.addChild(this.mainTicksPath);
    this.addChild(this.mainLabelsLayer);

    // ── Fixed head ────────────────────────────────────────────────────────────
    this.addChild(
      new Path(headShape(-1), {
        fill: barFill(bodyFill, headTop, headBottom),
        stroke,
        lineWidth: 1,
      }),
    );

    // The depth rod extends from the tail of the beam by the measurement, which
    // is why a depth gauge and an outside measurement share one scale.
    this.depthRod = new Rectangle(
      CALIPER_BEAM_LENGTH,
      (CALIPER_BEAM_HEIGHT - DEPTH_ROD_HEIGHT) / 2,
      0,
      DEPTH_ROD_HEIGHT,
      {
        fill: barFill(
          sliderFill,
          (CALIPER_BEAM_HEIGHT - DEPTH_ROD_HEIGHT) / 2,
          (CALIPER_BEAM_HEIGHT + DEPTH_ROD_HEIGHT) / 2,
        ),
        stroke,
      },
    );
    this.addChild(this.depthRod);

    // ── Sliding assembly ──────────────────────────────────────────────────────
    // Its own frame has the sliding jaw's measuring face — and so the vernier's
    // zero — at x = 0, so the whole assembly is placed by the measurement alone.
    const slidingHead = new Path(headShape(1), {
      fill: barFill(sliderFill, headTop, headBottom),
      stroke,
      lineWidth: 1,
    });

    this.vernierPlate = new Rectangle(0, SCALE_BASELINE, MIN_PLATE_LENGTH, PLATE_BOTTOM - SCALE_BASELINE, {
      fill: barFill(sliderFill, SCALE_BASELINE, PLATE_BOTTOM),
      stroke,
      cornerRadius: 1.5,
    });
    this.vernierTicksPath = new Path(null, { stroke: engravedColorProperty, lineWidth: 0.7 });
    this.vernierLabelsLayer = new Node();

    this.sliderTail = new Node({ children: tailChildren(sliderFill, stroke) });

    this.sliderTargetRect = new InteractiveSlider(0, headTop, MIN_PLATE_LENGTH, headBottom - headTop, {
      fill: "transparent",
      cursor: "ew-resize",
      tagName: "div",
      focusable: true,
      ...(options.sliderAccessibleName !== null && { accessibleName: options.sliderAccessibleName }),
      ...(options.sliderAccessibleHelpText !== null && { accessibleHelpText: options.sliderAccessibleHelpText }),
    });

    // The plate is riveted to the front of the head on the real tool, and has to
    // be drawn that way here too: the vernier's zero mark sits on the jaw's face
    // plane, so a head drawn over the plate would bury the first graduations.
    this.sliderAssembly = new Node({
      children: [
        slidingHead,
        this.vernierPlate,
        this.vernierTicksPath,
        this.vernierLabelsLayer,
        this.sliderTail,
        this.sliderTargetRect,
      ],
    });
    this.addChild(this.sliderAssembly);
    this.sliderTarget = this.sliderTargetRect;

    // ── Input ─────────────────────────────────────────────────────────────────
    // Delta must be in a frame that does not move with the measurement. The
    // target lives inside sliderAssembly, which translates as the jaws open, so
    // parentPoint would chase its own frame and undershoot (worse on slow drags).
    let startPointerX = 0;
    let startMeasurement = 0;

    this.sliderTargetRect.addInputListener(
      new DragListener({
        start: (_event, listener) => {
          startPointerX = listener.globalPoint.x;
          startMeasurement = model.measurementProperty.value;
        },
        drag: (_event, listener) => {
          const deltaUnits = (listener.globalPoint.x - startPointerX) / this.pixelsPerUnit;
          model.setMeasurement(startMeasurement + deltaUnits);
        },
      }),
    );

    this.sliderTargetRect.addInputListener(createVernierKeyboardListener(model));

    Multilink.multilink(
      [model.measurementProperty, model.specProperty, measurementModeProperty],
      (measurement, spec, mode) => {
        this.layoutFor(measurement, spec, mode);
      },
    );
  }

  /** Position the slider and redraw the workpiece for the active mode. */
  private layoutFor(measurement: number, spec: VernierScaleSpec, mode: MeasurementMode): void {
    if (spec !== this.engravedSpec) {
      this.engravedSpec = spec;
      this.rebuildScales(spec);
    }

    const jawX = measurement * this.pixelsPerUnit;
    this.sliderAssembly.x = jawX;

    // The depth rod is the only part whose length, rather than position, tracks
    // the measurement, and it is only in the way when depth is being measured.
    this.depthRod.visible = mode === MeasurementMode.DEPTH;
    this.depthRod.setRect(CALIPER_BEAM_LENGTH, (CALIPER_BEAM_HEIGHT - DEPTH_ROD_HEIGHT) / 2, jawX, DEPTH_ROD_HEIGHT);

    this.workpiecePath.shape = workpieceShape(mode, jawX);
  }

  /**
   * Re-engrave both scales for a new preset, and resize the plate to suit.
   *
   * The plate carries the whole vernier scale and the block at its tail, and it
   * must clear the beam's end even at full travel — so the scale factor and the
   * plate length are solved together: whichever of the two constraints binds
   * (a long vernier, or a short one where the block sets the minimum) fixes the
   * pixels per unit.
   */
  private rebuildScales(spec: VernierScaleSpec): void {
    const rangeUnits = canonicalRange(spec);
    const spanUnits = fromSpecUnits(spec, vernierSpan(spec));
    const usable = CALIPER_BEAM_LENGTH - BEAM_END_MARGIN;
    const tailOverhead = PLATE_PAD + BODY_LENGTH;

    this.pixelsPerUnit = Math.min(
      (usable - tailOverhead) / (rangeUnits + spanUnits),
      (usable - MIN_PLATE_LENGTH) / rangeUnits,
    );

    const plateLength = Math.max(MIN_PLATE_LENGTH, spanUnits * this.pixelsPerUnit + tailOverhead);
    this.vernierPlate.setRect(0, SCALE_BASELINE, plateLength, PLATE_BOTTOM - SCALE_BASELINE);
    this.sliderTail.x = plateLength;
    this.sliderTargetRect.setRect(
      0,
      -CALIPER_INSIDE_JAW_LENGTH,
      plateLength,
      CALIPER_INSIDE_JAW_LENGTH + CALIPER_BEAM_HEIGHT + CALIPER_JAW_LENGTH,
    );

    this.rebuildMainScale(spec, rangeUnits);
    this.rebuildVernierScale(spec);
  }

  /** Engrave the beam: a tick per main division, numbered at the spec's interval. */
  private rebuildMainScale(spec: VernierScaleSpec, rangeUnits: number): void {
    const divisionPx = fromSpecUnits(spec, spec.mainDivision) * this.pixelsPerUnit;
    const tickStride = strideFor(divisionPx, MIN_TICK_SPACING);
    const labelStride = spec.mainLabelInterval * strideFor(spec.mainLabelInterval * divisionPx, MIN_MAIN_LABEL_SPACING);

    const shape = new Shape();
    this.mainLabelsLayer.removeAllChildren();

    const lastIndex = Math.floor(rangeUnits / fromSpecUnits(spec, spec.mainDivision));
    for (let index = 0; index <= lastIndex; index++) {
      if (index % tickStride !== 0) {
        continue;
      }
      const x = index * divisionPx;
      const isLabelled = index % labelStride === 0;
      const length = isLabelled ? MAIN_TICK_MAJOR : MAIN_TICK;
      shape.moveTo(x, SCALE_BASELINE).lineTo(x, SCALE_BASELINE - length);

      if (isLabelled) {
        this.mainLabelsLayer.addChild(
          engravedText(trimmed(fromTicks(spec, index * spec.divisions)), x, SCALE_BASELINE - MAIN_TICK_MAJOR - 1, 1),
        );
      }
    }
    this.mainTicksPath.shape = shape;
  }

  /** Engrave the plate, hanging from the same baseline the main scale rises from. */
  private rebuildVernierScale(spec: VernierScaleSpec): void {
    const { divisions, type } = spec;
    const divisionPx = fromSpecUnits(spec, fromTicks(spec, vernierDivisionTicks(type, divisions))) * this.pixelsPerUnit;
    const labelStride = vernierLabelStride(divisions, divisionPx);

    const shape = new Shape();
    this.vernierLabelsLayer.removeAllChildren();

    for (let index = 0; index <= divisions; index++) {
      const x = index * divisionPx;
      const isLabelled = labelStride !== null && (index % labelStride === 0 || index === divisions);
      const length = isLabelled ? VERNIER_TICK_MAJOR : VERNIER_TICK;
      shape.moveTo(x, SCALE_BASELINE).lineTo(x, SCALE_BASELINE + length);

      if (isLabelled) {
        const value = index === divisions ? divisions : vernierLabel(index, type, divisions);
        this.vernierLabelsLayer.addChild(
          engravedText(String(value), x, SCALE_BASELINE + VERNIER_TICK_MAJOR + ENGRAVED_FONT_SIZE + 1, 1.5),
        );
      }
    }
    this.vernierTicksPath.shape = shape;
  }
}

/**
 * The clamp screw and the knurled thumb tab, drawn relative to the tail of the
 * plate so that they follow whatever length the active scale gives it.
 */
const tailChildren = (sliderFill: TReadOnlyProperty<Color>, stroke: TReadOnlyProperty<Color>): Node[] => {
  const left = -BODY_LENGTH;
  const tabInset = 5;

  return [
    // The block that clamps the slider to the beam.
    new Rectangle(left, BODY_TOP, BODY_LENGTH, PLATE_BOTTOM - BODY_TOP, {
      fill: barFill(sliderFill, BODY_TOP, PLATE_BOTTOM),
      stroke,
      cornerRadius: 2,
    }),

    // Thumb tab, hanging below the block where a thumb would push it.
    new Rectangle(left + tabInset, PLATE_BOTTOM - 2, BODY_LENGTH - 2 * tabInset, 13, {
      fill: barFill(sliderFill, PLATE_BOTTOM, PLATE_BOTTOM + 11),
      stroke,
      cornerRadius: 2,
    }),
    new Path(knurlShape(left + tabInset + 3, left + BODY_LENGTH - tabInset - 3, 4, 3, PLATE_BOTTOM + 4.5), {
      stroke: shade(sliderFill, -0.2),
      lineWidth: 0.6,
    }),

    // Clamp screw, seated in a boss on top of the block.
    new Circle(6, {
      x: left + BODY_LENGTH / 2,
      y: BODY_TOP + 1,
      fill: barFill(sliderFill, -6, 6),
      stroke,
    }),
    new Path(Shape.lineSegment(left + BODY_LENGTH / 2 - 4, BODY_TOP + 1, left + BODY_LENGTH / 2 + 4, BODY_TOP + 1), {
      stroke: shade(sliderFill, -0.45),
      lineWidth: 1.5,
    }),
  ];
};

/**
 * One engraved number, centred on its tick with its baseline at `bottom`.
 *
 * The zero of either scale sits exactly on a measuring face, where half its
 * number would disappear under the jaw beside it; `leftLimit` nudges that one
 * clear, which is what the engraver does on the real tool.
 */
const engravedText = (text: string, centerX: number, bottom: number, leftLimit = Number.NEGATIVE_INFINITY): Text => {
  const node = new Text(text, {
    font: new PhetFont(ENGRAVED_FONT_SIZE),
    fill: engravedColorProperty,
    centerX,
    bottom,
  });
  if (node.left < leftLimit) {
    node.left = leftLimit;
  }
  return node;
};

/**
 * Drop trailing zeros from an engraved number: `1.5`, but `2` rather than `2.0`.
 *
 * Uses scenerystack/dot's `toFixedNumber` rather than native `Number.toFixed`
 * (cross-browser rounding). Period separator kept deliberately — these are
 * instrument engravings, not UI readouts.
 */
const trimmed = (value: number): string => String(toFixedNumber(value, 3));

/** Smallest stride from a round set that keeps marks at least `minimum` apart. */
const strideFor = (spacing: number, minimum: number): number =>
  [1, 2, 5, 10, 20, 50].find((stride) => stride * spacing >= minimum) ?? 100;

/**
 * How often to number the vernier's ticks, or null when even its two ends are
 * too close together to number.
 *
 * Strides that do not divide the division count are no use here — the last
 * number has to land on the last tick. A short vernier (the eight divisions of a
 * 1/16 in caliper) falls through every round stride and is numbered at its ends
 * alone, which is better than an anonymous comb.
 */
const vernierLabelStride = (divisions: number, spacing: number): number | null => {
  const fits = (stride: number): boolean => stride * spacing >= MIN_VERNIER_LABEL_SPACING;
  const round = [1, 2, 5, 10, 25, 50].find((stride) => divisions % stride === 0 && fits(stride));
  return round ?? (fits(divisions) ? divisions : null);
};

/**
 * The workpiece, drawn to suit the jaws in use.
 *
 * Each mode gets a shape that makes the measured dimension obvious: a bar
 * gripped between the outside jaws, a bore the inside jaws open into, a blind
 * hole the depth rod drops into, a shoulder the step faces bridge.
 */
const workpieceShape = (mode: MeasurementMode, jawX: number): Shape => {
  switch (mode) {
    case MeasurementMode.OUTSIDE: {
      const top = CALIPER_BEAM_HEIGHT + CALIPER_JAW_LENGTH * 0.3;
      const height = CALIPER_JAW_LENGTH * 0.55;
      return Shape.roundRectangle(0, top, Math.max(jawX, 0), height, 4, 4);
    }

    case MeasurementMode.INSIDE: {
      // A block whose bore is exactly the jaw opening: two walls either side.
      // They overlap the tips of the nibs, which are drawn in front of them, so
      // the jaws read as standing inside the bore rather than hovering under it.
      const top = -CALIPER_INSIDE_JAW_LENGTH - 24;
      const height = 30;
      const wall = 26;
      return new Shape().rect(-wall, top, wall, height).rect(Math.max(jawX, 0), top, wall, height);
    }

    case MeasurementMode.DEPTH: {
      // A block beyond the tail of the beam with a blind hole the rod enters.
      const blockLeft = CALIPER_BEAM_LENGTH;
      const blockTop = CALIPER_BEAM_HEIGHT + 12;
      const wall = 16;
      const depth = Math.max(jawX, 0);
      return new Shape()
        .rect(blockLeft, blockTop, depth + wall, wall)
        .rect(blockLeft + depth, blockTop - DEPTH_ROD_HEIGHT - 12, wall, DEPTH_ROD_HEIGHT + 12);
    }

    case MeasurementMode.STEP: {
      // A shoulder. The riser stands at the fixed reference face and the lower
      // shelf runs out to the sliding face, so the drawn step is the measurement.
      // Kept wholly to the right of the origin, or it would slide off screen.
      const top = CALIPER_BEAM_HEIGHT + CALIPER_JAW_LENGTH * 0.3;
      const step = Math.max(jawX, 0);
      const riser = 44;
      return new Shape().rect(0, top, riser, 46).rect(0, top + 46, step + riser, 22);
    }

    default:
      throw new Error(`Unhandled MeasurementMode: ${mode}`);
  }
};
