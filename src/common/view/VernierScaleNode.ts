/**
 * VernierScaleNode.ts
 *
 * The heart of the sim's visuals: a main scale with a vernier scale sliding
 * against it, and a highlight on whichever vernier tick currently lines up.
 *
 * ── Why this node is used twice per screen ────────────────────────────────────
 *
 * The difference between a main division and a vernier division is one least
 * count — 1/n of a division, or 2% on a 0.02 mm caliper. No amount of zoom makes
 * that 2% obvious *between neighbouring ticks*; what makes a vernier readable is
 * the pattern across many ticks, the marks converging on the coincidence and
 * splaying apart either side of it. So every screen shows two of these nodes:
 *
 *  - a wide one covering the whole vernier, where the converging pattern is the
 *    thing you see, and
 *  - a narrow one covering a few divisions around the coincidence at much higher
 *    magnification, where you confirm exactly which tick it is.
 *
 * That is the {@link VernierScaleNodeOptions.windowMainDivisions} option: it sets
 * how many main divisions fit across `viewWidth`, and so the magnification.
 *
 * ── Layout ────────────────────────────────────────────────────────────────────
 *
 * The two scales meet at y = 0, the line along which coincidence is judged. Main
 * ticks rise from it, vernier ticks descend from it, each with its labels on the
 * far side. Everything is clipped to the window so the scale can scroll under a
 * fixed frame as the vernier moves.
 */

import { BooleanProperty, Multilink, type TReadOnlyProperty } from "scenerystack/axon";
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
  Text,
} from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import VernierScalesColors from "../../VernierScalesColors.js";
import {
  COINCIDENT_TICK_WIDTH,
  MAIN_TICK_LENGTH,
  MAJOR_TICK_LENGTH_SCALE,
  SCALE_LABEL_FONT_SIZE,
  SCALE_TICK_WIDTH,
  VERNIER_TICK_LENGTH,
} from "../../VernierScalesConstants.js";
import type { VernierScaleModel } from "../model/VernierScaleModel.js";
import { fromTicks, ticksToCanonical, type VernierScaleSpec } from "../model/VernierScaleSpec.js";
import { vernierDivisionTicks, vernierLabel, vernierSpanDivisions } from "../model/vernier.js";

/** What the visible window stays centred on as the vernier moves. */
export const WindowAnchor = {
  /** Keep the whole vernier scale in frame; the main scale scrolls beneath it. */
  VERNIER: "vernier",
  /** Keep the coincident tick in frame — the magnified confirmation view. */
  COINCIDENCE: "coincidence",
} as const;

export type WindowAnchor = (typeof WindowAnchor)[keyof typeof WindowAnchor];

type SelfOptions = {
  /** Width of the visible window, in view coordinates. */
  viewWidth?: number;

  /** Height reserved for the scales, excluding labels. */
  viewHeight?: number;

  /**
   * How many main-scale divisions span `viewWidth`. Fewer divisions means higher
   * magnification; this is the only knob that sets the zoom.
   *
   * `"fit"` sizes the window to the active vernier's span plus a little context,
   * so that changing the scale preset — and with it the number of divisions —
   * keeps the whole vernier in frame instead of cropping it.
   */
  windowMainDivisions?: number | "fit";

  /** What the window follows as the vernier slides. */
  anchor?: WindowAnchor;

  /** Whether to draw the numbers under the vernier ticks. */
  showVernierLabels?: boolean;

  /** Whether to draw the values above the main-scale ticks. */
  showMainLabels?: boolean;

  /**
   * Whether the vernier can be dragged along the main scale, by pointer or by
   * keyboard. The magnified view is normally left non-interactive so that the
   * wide view is the single place a drag starts.
   */
  interactive?: boolean;

  /**
   * Accessible name for the draggable region. It belongs on the transparent drag
   * target rather than on this node, because that is the element which actually
   * takes focus.
   */
  dragAccessibleName?: TReadOnlyProperty<string> | null;

  /** Accessible help text for the draggable region. */
  dragAccessibleHelpText?: TReadOnlyProperty<string> | null;

  /**
   * Controls a full-height guide line drawn through the coincident tick. It runs
   * across both scales, which is what makes "these two marks are in line"
   * checkable rather than a matter of squinting.
   *
   * Left null the line is hidden, not shown: it is a teaching aid for the
   * Principle screen, and everywhere else it would do the looking for the user.
   */
  coincidenceMarkerVisibleProperty?: TReadOnlyProperty<boolean> | null;

  /**
   * Whether the coincident tick is drawn in the highlight colour.
   *
   * True everywhere the sim is explaining, false on the Practice screen — there,
   * colouring the aligned line in tells the student the vernier digit outright
   * and leaves them only the main scale to read, which is not the exercise.
   */
  highlightCoincidence?: boolean;
};

export type VernierScaleNodeOptions = SelfOptions & NodeOptions;

/**
 * Pick how often to number the vernier ticks: the *finest* spacing from 1, 2, 5
 * or 10 that divides `n` evenly and still leaves at most a dozen numbers.
 *
 * Finest rather than coarsest — a 10-division vernier wants all ten numbered,
 * and taking the coarsest divisor would label only 0 and 10, which is no use for
 * reading anything. A 50-division vernier falls through to every fifth.
 */
const vernierLabelInterval = (n: number): number => {
  const candidates = [1, 2, 5, 10];
  return candidates.find((interval) => n % interval === 0 && n / interval <= 12) ?? 10;
};

/**
 * A Rectangle that shows an interactive highlight on hover and focus. The
 * vernier is dragged by a transparent overlay rather than by its own ticks, so
 * without the mixin there would be no visible affordance at all.
 */
class InteractiveTarget extends InteractiveHighlighting(Rectangle) {}

/** Decimal places needed to write `value` exactly, capped at three. */
const placesFor = (value: number): number => {
  for (let places = 0; places < 3; places++) {
    if (Math.abs(value * 10 ** places - Math.round(value * 10 ** places)) < 1e-9) {
      return places;
    }
  }
  return 3;
};

export class VernierScaleNode extends Node {
  private readonly mainTicksPath: Path;
  private readonly vernierTicksPath: Path;
  private readonly coincidentTickPath: Path;
  private readonly mainLabelsLayer: Node;
  private readonly vernierLabelsLayer: Node;
  private readonly coincidenceMarkerPath: Path;

  private readonly viewWidth: number;
  private readonly viewHeight: number;
  private readonly windowMainDivisions: number | "fit";
  private readonly anchor: WindowAnchor;
  private readonly showVernierLabels: boolean;
  private readonly showMainLabels: boolean;
  private readonly highlightCoincidence: boolean;

  /** View pixels per tick at the current spec; the drag handler needs it. */
  private pixelsPerTick = 1;

  /** The focusable drag target, when this node is interactive. */
  private dragTarget: Node | null = null;

  public constructor(model: VernierScaleModel, providedOptions?: VernierScaleNodeOptions) {
    const options = optionize<VernierScaleNodeOptions, SelfOptions, NodeOptions>()(
      {
        viewWidth: 760,
        viewHeight: 120,
        windowMainDivisions: "fit",
        anchor: WindowAnchor.VERNIER,
        showVernierLabels: true,
        showMainLabels: true,
        interactive: false,
        dragAccessibleName: null,
        dragAccessibleHelpText: null,
        coincidenceMarkerVisibleProperty: null,
        highlightCoincidence: true,
      },
      providedOptions,
    );
    super(options);

    this.highlightCoincidence = options.highlightCoincidence;

    this.viewWidth = options.viewWidth;
    this.viewHeight = options.viewHeight;
    this.windowMainDivisions = options.windowMainDivisions;
    this.anchor = options.anchor;
    this.showVernierLabels = options.showVernierLabels;
    this.showMainLabels = options.showMainLabels;

    const halfHeight = this.viewHeight / 2;

    // The frame doubles as the clip: the scales scroll behind a fixed window.
    const frame = new Rectangle(0, -halfHeight, this.viewWidth, this.viewHeight, {
      fill: VernierScalesColors.scaleFaceColorProperty,
      stroke: VernierScalesColors.panelBorderColorProperty,
      cornerRadius: 3,
    });
    this.addChild(frame);

    const clipped = new Node({
      clipArea: Shape.bounds(frame.bounds),
    });
    this.addChild(clipped);

    this.mainTicksPath = new Path(null, {
      stroke: VernierScalesColors.scaleTickColorProperty,
      lineWidth: SCALE_TICK_WIDTH,
    });
    this.vernierTicksPath = new Path(null, {
      stroke: VernierScalesColors.vernierTickColorProperty,
      lineWidth: SCALE_TICK_WIDTH,
    });
    this.coincidentTickPath = new Path(null, {
      stroke: VernierScalesColors.coincidenceColorProperty,
      lineWidth: COINCIDENT_TICK_WIDTH,
    });
    this.mainLabelsLayer = new Node();
    this.vernierLabelsLayer = new Node();

    // Drawn faintly and behind the ticks, so it guides the eye to the alignment
    // without becoming the thing you read instead of the marks themselves.
    this.coincidenceMarkerPath = new Path(null, {
      stroke: VernierScalesColors.coincidenceColorProperty,
      lineWidth: 1,
      lineDash: [4, 3],
      opacity: 0.75,

      // A constant false Property rather than `visible: false` alongside a
      // visibleProperty: scenery applies `visible` *after* `visibleProperty` and
      // writes it through, which silently set the caller's own Property to false.
      visibleProperty: options.coincidenceMarkerVisibleProperty ?? new BooleanProperty(false),
    });

    // The line along which coincidence is judged, and the two scales' shared edge.
    const interfaceLine = new Path(Shape.lineSegment(0, 0, this.viewWidth, 0), {
      stroke: VernierScalesColors.panelBorderColorProperty,
      lineWidth: 1,
    });

    clipped.addChild(interfaceLine);
    clipped.addChild(this.coincidenceMarkerPath);
    clipped.addChild(this.mainTicksPath);
    clipped.addChild(this.vernierTicksPath);
    clipped.addChild(this.coincidentTickPath);
    clipped.addChild(this.mainLabelsLayer);
    clipped.addChild(this.vernierLabelsLayer);

    Multilink.multilink(
      [model.specProperty, model.offsetTicksProperty, model.coincidentIndexProperty],
      (spec, offsetTicks, coincidentIdx) => {
        this.rebuild(spec, offsetTicks, coincidentIdx);
      },
    );

    if (options.interactive) {
      this.addDragTarget(model, halfHeight, options.dragAccessibleName, options.dragAccessibleHelpText);
    }
  }

  /**
   * Make the vernier half of the window draggable, and give it keyboard control.
   *
   * The keyboard steps are whole least counts and whole main divisions rather
   * than pixels: those are the increments the instrument actually has, so a
   * keyboard user lands on exactly readable values instead of somewhere between
   * two of them. It also means the arrow keys walk the coincident tick one
   * number at a time, which is the behaviour the screen-reader description
   * describes.
   */
  private addDragTarget(
    model: VernierScaleModel,
    halfHeight: number,
    accessibleName: TReadOnlyProperty<string> | null,
    accessibleHelpText: TReadOnlyProperty<string> | null,
  ): void {
    const target = new InteractiveTarget(0, 0, this.viewWidth, halfHeight, {
      fill: "transparent",
      cursor: "ew-resize",
      tagName: "div",
      focusable: true,
      ...(accessibleName !== null && { accessibleName }),
      ...(accessibleHelpText !== null && { accessibleHelpText }),
    });

    let startPointerX = 0;
    let startMeasurement = 0;

    target.addInputListener(
      new DragListener({
        start: (_event, listener) => {
          startPointerX = listener.parentPoint.x;
          startMeasurement = model.measurementProperty.value;
        },
        drag: (_event, listener) => {
          const deltaTicks = (listener.parentPoint.x - startPointerX) / this.pixelsPerTick;
          const spec = model.specProperty.value;
          model.setMeasurement(startMeasurement + ticksToCanonical(spec, deltaTicks));
        },
      }),
    );

    target.addInputListener(
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

    this.addChild(target);
    this.dragTarget = target;
  }

  /** The focusable node, so screens can place it in their pdomOrder. */
  public getDragTarget(): Node | null {
    return this.dragTarget;
  }

  /**
   * How many main divisions the window spans for this scale — the span of the
   * active vernier plus context when fitting, otherwise the fixed magnification.
   */
  private windowDivisionsFor(spec: VernierScaleSpec): number {
    return this.windowMainDivisions === "fit" ? fullViewMainDivisions(spec) : this.windowMainDivisions;
  }

  /**
   * Where the visible window starts, in ticks. Anchoring on the vernier keeps its
   * whole length in frame; anchoring on the coincidence keeps the highlighted
   * tick centred, which is what the magnified view needs.
   */
  private windowStartTicks(spec: VernierScaleSpec, offsetTicks: number, coincidentIdx: number): number {
    const windowTicks = this.windowDivisionsFor(spec) * spec.divisions;

    if (this.anchor === WindowAnchor.COINCIDENCE) {
      const coincidentPosition = offsetTicks + coincidentIdx * vernierDivisionTicks(spec.type, spec.divisions);
      return coincidentPosition - windowTicks / 2;
    }

    const vernierCentre = offsetTicks + (spec.divisions * vernierDivisionTicks(spec.type, spec.divisions)) / 2;
    return vernierCentre - windowTicks / 2;
  }

  /**
   * Redraw both combs. Ticks go into two Paths rather than one Node each: a
   * 50-division vernier plus its main scale is over a hundred marks, and rebuilding
   * that many Nodes on every drag frame is exactly the kind of churn that shows up
   * as jank. Labels are Nodes, but there are at most a dozen of each.
   */
  private rebuild(spec: VernierScaleSpec, offsetTicks: number, coincidentIdx: number): void {
    const windowDivisions = this.windowDivisionsFor(spec);
    const pixelsPerMainDivision = this.viewWidth / windowDivisions;
    this.pixelsPerTick = pixelsPerMainDivision / spec.divisions;

    const startTicks = this.windowStartTicks(spec, offsetTicks, coincidentIdx);
    const endTicks = startTicks + windowDivisions * spec.divisions;
    const xOf = (ticks: number): number => (ticks - startTicks) * this.pixelsPerTick;

    this.rebuildMainScale(spec, startTicks, endTicks, xOf);
    this.rebuildVernierScale(spec, offsetTicks, coincidentIdx, pixelsPerMainDivision, xOf);

    // ── Guide line through the coincidence ────────────────────────────────────
    const divisionTicks = vernierDivisionTicks(spec.type, spec.divisions);
    const coincidentX = xOf(offsetTicks + coincidentIdx * divisionTicks);
    this.coincidenceMarkerPath.shape = Shape.lineSegment(
      coincidentX,
      -this.viewHeight / 2,
      coincidentX,
      this.viewHeight / 2,
    );
  }

  /** Draw the fixed scale: ticks every division, numbered at the spec's interval. */
  private rebuildMainScale(
    spec: VernierScaleSpec,
    startTicks: number,
    endTicks: number,
    xOf: (ticks: number) => number,
  ): void {
    const shape = new Shape();
    this.mainLabelsLayer.removeAllChildren();

    const firstIndex = Math.floor(startTicks / spec.divisions) - 1;
    const lastIndex = Math.ceil(endTicks / spec.divisions) + 1;

    for (let mainIndex = Math.max(firstIndex, 0); mainIndex <= lastIndex; mainIndex++) {
      const x = xOf(mainIndex * spec.divisions);
      const isMajor = mainIndex % spec.mainLabelInterval === 0;
      const length = isMajor ? MAIN_TICK_LENGTH * MAJOR_TICK_LENGTH_SCALE : MAIN_TICK_LENGTH;
      shape.moveTo(x, 0).lineTo(x, -length);

      if (isMajor && this.showMainLabels) {
        const value = fromTicks(spec, mainIndex * spec.divisions);
        this.mainLabelsLayer.addChild(
          new Text(value.toFixed(placesFor(value)), {
            font: new PhetFont(SCALE_LABEL_FONT_SIZE),
            fill: VernierScalesColors.scaleLabelColorProperty,
            centerX: x,
            bottom: -length - 2,
          }),
        );
      }
    }
    this.mainTicksPath.shape = shape;
  }

  /**
   * Draw the sliding scale. The coincident tick goes into its own Path so it can
   * be thicker and in the highlight colour without disturbing the comb around it.
   */
  private rebuildVernierScale(
    spec: VernierScaleSpec,
    offsetTicks: number,
    coincidentIdx: number,
    pixelsPerMainDivision: number,
    xOf: (ticks: number) => number,
  ): void {
    const { divisions, type } = spec;
    const shape = new Shape();
    const coincidentShape = new Shape();
    this.vernierLabelsLayer.removeAllChildren();

    const divisionTicks = vernierDivisionTicks(type, divisions);
    const numberInterval = vernierLabelInterval(divisions);

    for (let index = 0; index <= divisions; index++) {
      const x = xOf(offsetTicks + index * divisionTicks);

      // Skip marks scrolled out of frame; the clip would hide them anyway, but
      // not building them keeps the Shape small on the wide, zoomed-out view.
      if (x < -pixelsPerMainDivision || x > this.viewWidth + pixelsPerMainDivision) {
        continue;
      }

      const label = vernierLabel(index, type, divisions);
      const isNumbered = index === divisions || label % numberInterval === 0;
      const length = isNumbered ? VERNIER_TICK_LENGTH * MAJOR_TICK_LENGTH_SCALE : VERNIER_TICK_LENGTH;
      const isCoincident = this.highlightCoincidence && index === coincidentIdx;

      (isCoincident ? coincidentShape : shape).moveTo(x, 0).lineTo(x, length);

      if (isNumbered && this.showVernierLabels) {
        this.vernierLabelsLayer.addChild(
          new Text(String(index === divisions ? divisions : label), {
            font: new PhetFont(SCALE_LABEL_FONT_SIZE),
            fill: isCoincident
              ? VernierScalesColors.coincidenceColorProperty
              : VernierScalesColors.scaleLabelColorProperty,
            centerX: x,
            top: length + 2,
          }),
        );
      }
    }

    this.vernierTicksPath.shape = shape;
    this.coincidentTickPath.shape = coincidentShape;
  }
}

/**
 * How many main divisions to show when the whole vernier must be in frame — its
 * span plus a couple of divisions of context either side.
 */
export const fullViewMainDivisions = (spec: VernierScaleSpec): number =>
  vernierSpanDivisions(spec.type, spec.divisions) + 4;
