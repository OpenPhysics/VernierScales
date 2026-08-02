/**
 * CaliperNode.ts
 *
 * A schematic vernier caliper: fixed jaw at the left, sliding jaw that follows
 * the measurement, and a workpiece drawn to suit whichever pair of jaws is in
 * use. Drag the slider to measure.
 *
 * ── Schematic, not a portrait ─────────────────────────────────────────────────
 *
 * The drawing is deliberately flat and diagrammatic. The scales here are far too
 * compressed to read — the whole 150 mm beam is about 550 pixels wide, so one
 * least count of a 0.02 mm caliper is a thousandth of a pixel — and pretending
 * otherwise by drawing convincing engraved marks would invite users to try. The
 * reading happens in the {@link ScaleViewsNode} below; this node's job is to
 * show *what is being measured and how*, which is the part the scales cannot
 * convey.
 *
 * ── Geometry ──────────────────────────────────────────────────────────────────
 *
 * The origin sits at the inner face of the fixed jaw, with the beam's top edge
 * at y = 0. Outside jaws hang below the beam, inside jaws rise above it, and the
 * jaw opening in view coordinates is exactly the measurement in model
 * coordinates times {@link pixelsPerUnit} — so the gap you see is the gap the
 * scales report, with no separate scaling to keep in sync.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { optionize } from "scenerystack/phet-core";
import {
  DragListener,
  InteractiveHighlighting,
  KeyboardListener,
  Node,
  type NodeOptions,
  Path,
  Rectangle,
} from "scenerystack/scenery";
import type { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import { canonicalRange, type VernierScaleSpec } from "../../common/model/VernierScaleSpec.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import {
  CALIPER_BEAM_HEIGHT,
  CALIPER_BEAM_LENGTH,
  CALIPER_INSIDE_JAW_LENGTH,
  CALIPER_JAW_LENGTH,
  CALIPER_JAW_WIDTH,
} from "../../VernierScalesConstants.js";
import { MeasurementMode } from "../model/CaliperModel.js";

/** Width of the sliding assembly that carries the vernier scale. */
const SLIDER_WIDTH = 64;

/** How far the slider body overhangs the beam, top and bottom. */
const SLIDER_OVERHANG = 5;

/** Thickness of the depth rod. */
const DEPTH_ROD_HEIGHT = 7;

/** A Rectangle that highlights on hover and focus, for the draggable slider. */
class InteractiveSlider extends InteractiveHighlighting(Rectangle) {}

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

  /** The focusable slider, for a screen's pdomOrder. */
  public readonly sliderTarget: Node;

  /**
   * View pixels per canonical unit. Depends on the active scale only through its
   * range, so an inch caliper and a millimetre one both fill the beam.
   */
  private pixelsPerUnit = 1;

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

    // ── Workpiece, behind the instrument so the jaws read as gripping it ──────
    this.workpiecePath = new Path(null, {
      fill: VernierScalesColors.workpieceColorProperty,
      stroke,
      lineWidth: 1,
    });
    this.addChild(this.workpiecePath);

    // ── Beam and fixed jaw ────────────────────────────────────────────────────
    const beam = new Rectangle(-CALIPER_JAW_WIDTH, 0, CALIPER_BEAM_LENGTH + CALIPER_JAW_WIDTH, CALIPER_BEAM_HEIGHT, {
      fill: bodyFill,
      stroke,
      cornerRadius: 2,
    });

    const fixedOutsideJaw = new Rectangle(
      -CALIPER_JAW_WIDTH,
      CALIPER_BEAM_HEIGHT,
      CALIPER_JAW_WIDTH,
      CALIPER_JAW_LENGTH,
      { fill: bodyFill, stroke },
    );

    const fixedInsideJaw = new Rectangle(
      -CALIPER_JAW_WIDTH,
      -CALIPER_INSIDE_JAW_LENGTH,
      CALIPER_JAW_WIDTH,
      CALIPER_INSIDE_JAW_LENGTH,
      { fill: bodyFill, stroke },
    );

    // The depth rod extends from the tail of the beam by the measurement, which
    // is why a depth gauge and an outside measurement share one scale.
    this.depthRod = new Rectangle(
      CALIPER_BEAM_LENGTH,
      (CALIPER_BEAM_HEIGHT - DEPTH_ROD_HEIGHT) / 2,
      0,
      DEPTH_ROD_HEIGHT,
      { fill: sliderFill, stroke },
    );

    this.addChild(beam);
    this.addChild(fixedOutsideJaw);
    this.addChild(fixedInsideJaw);
    this.addChild(this.depthRod);

    // ── Sliding assembly ──────────────────────────────────────────────────────
    const sliderBody = new Rectangle(0, -SLIDER_OVERHANG, SLIDER_WIDTH, CALIPER_BEAM_HEIGHT + 2 * SLIDER_OVERHANG, {
      fill: sliderFill,
      stroke,
      cornerRadius: 2,
    });
    const slidingOutsideJaw = new Rectangle(0, CALIPER_BEAM_HEIGHT, CALIPER_JAW_WIDTH, CALIPER_JAW_LENGTH, {
      fill: sliderFill,
      stroke,
    });
    const slidingInsideJaw = new Rectangle(
      0,
      -CALIPER_INSIDE_JAW_LENGTH,
      CALIPER_JAW_WIDTH,
      CALIPER_INSIDE_JAW_LENGTH,
      {
        fill: sliderFill,
        stroke,
      },
    );

    const sliderTarget = new InteractiveSlider(
      0,
      -CALIPER_INSIDE_JAW_LENGTH,
      SLIDER_WIDTH,
      CALIPER_INSIDE_JAW_LENGTH + CALIPER_BEAM_HEIGHT + CALIPER_JAW_LENGTH,
      {
        fill: "transparent",
        cursor: "ew-resize",
        tagName: "div",
        focusable: true,
        ...(options.sliderAccessibleName !== null && { accessibleName: options.sliderAccessibleName }),
        ...(options.sliderAccessibleHelpText !== null && { accessibleHelpText: options.sliderAccessibleHelpText }),
      },
    );

    this.sliderAssembly = new Node({
      children: [sliderBody, slidingOutsideJaw, slidingInsideJaw, sliderTarget],
    });
    this.addChild(this.sliderAssembly);
    this.sliderTarget = sliderTarget;

    // ── Input ─────────────────────────────────────────────────────────────────
    let startPointerX = 0;
    let startMeasurement = 0;

    sliderTarget.addInputListener(
      new DragListener({
        start: (_event, listener) => {
          startPointerX = listener.parentPoint.x;
          startMeasurement = model.measurementProperty.value;
        },
        drag: (_event, listener) => {
          const deltaUnits = (listener.parentPoint.x - startPointerX) / this.pixelsPerUnit;
          model.setMeasurement(startMeasurement + deltaUnits);
        },
      }),
    );

    sliderTarget.addInputListener(
      new KeyboardListener({
        keys: ["arrowRight", "arrowLeft", "pageUp", "pageDown", "home", "end"],
        fire: (_event, keysPressed) => {
          switch (keysPressed) {
            case "arrowRight":
              model.stepByLeastCount(1);
              break;
            case "arrowLeft":
              model.stepByLeastCount(-1);
              break;
            case "pageUp":
              model.stepByMainDivision(1);
              break;
            case "pageDown":
              model.stepByMainDivision(-1);
              break;
            case "home":
              model.setMeasurement(0);
              break;
            case "end":
              model.setMeasurement(model.measurementRangeProperty.value);
              break;
          }
        },
      }),
    );

    Multilink.multilink(
      [model.measurementProperty, model.specProperty, measurementModeProperty],
      (measurement, spec, mode) => {
        this.layoutFor(measurement, spec, mode);
      },
    );
  }

  /** How far the slider can travel before it runs off the end of the beam. */
  private static get maxJawX(): number {
    return CALIPER_BEAM_LENGTH - SLIDER_WIDTH - 8;
  }

  /** Position the slider and redraw the workpiece for the active mode. */
  private layoutFor(measurement: number, spec: VernierScaleSpec, mode: MeasurementMode): void {
    this.pixelsPerUnit = CaliperNode.maxJawX / canonicalRange(spec);

    const jawX = measurement * this.pixelsPerUnit;
    this.sliderAssembly.x = jawX;

    // The depth rod is the only part whose length, rather than position, tracks
    // the measurement, and it is only in the way when depth is being measured.
    this.depthRod.visible = mode === MeasurementMode.DEPTH;
    this.depthRod.setRect(CALIPER_BEAM_LENGTH, (CALIPER_BEAM_HEIGHT - DEPTH_ROD_HEIGHT) / 2, jawX, DEPTH_ROD_HEIGHT);

    this.workpiecePath.shape = workpieceShape(mode, jawX);
  }
}

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
      const top = -CALIPER_INSIDE_JAW_LENGTH - 30;
      const height = 28;
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
  }
};
