/**
 * MicrometerNode.ts
 *
 * A schematic vernier micrometer: C-frame, fixed anvil, advancing spindle, and a
 * thimble that turns as the spindle moves.
 *
 * ── Why the thimble rotates ───────────────────────────────────────────────────
 *
 * On a micrometer the fine scale is wrapped around a rotating drum rather than
 * laid out along a beam, and the vernier lives on the fixed sleeve beside it.
 * That is the whole reason this instrument is on the screen: the vernier is
 * reading a *rotation*, which the flat scale views below cannot show. The thimble
 * here turns through one full revolution per {@link THIMBLE_PITCH_MM} of spindle
 * travel, as a real 0.5 mm-pitch micrometer does.
 */

import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, Node, type NodeOptions, Path, Rectangle } from "scenerystack/scenery";
import type { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import VernierScalesColors from "../../VernierScalesColors.js";

/** Spindle travel per full turn of the thimble, in millimetres. */
const THIMBLE_PITCH_MM = 0.5;

/** How many view pixels one millimetre of spindle travel opens the gap by. */
const PIXELS_PER_MM = 9;

/** Radius of the thimble drum. */
const THIMBLE_RADIUS = 42;

/** Length of the barrel the thimble rides on. */
const BARREL_LENGTH = 150;

/** Half-height of the barrel. */
const BARREL_HALF_HEIGHT = 15;

export class MicrometerNode extends Node {
  private readonly spindle: Rectangle;
  private readonly workpiece: Rectangle;
  private readonly thimbleMarks: Path;

  public constructor(model: VernierScaleModel, providedOptions?: NodeOptions) {
    super(providedOptions);

    const bodyFill = VernierScalesColors.instrumentBodyColorProperty;
    const sliderFill = VernierScalesColors.instrumentSliderColorProperty;
    const stroke = VernierScalesColors.instrumentStrokeColorProperty;

    // ── C-frame ───────────────────────────────────────────────────────────────
    // Drawn as a thick arc opening to the right, with the anvil at its top tip.
    const frame = new Path(
      new Shape()
        .moveTo(0, -46)
        .lineTo(-58, -46)
        .arc(-58, 0, 46, -Math.PI / 2, Math.PI / 2, false)
        .lineTo(0, 46)
        .lineTo(0, 30)
        .lineTo(-42, 30)
        .arc(-58, 0, 30, Math.PI / 2, -Math.PI / 2, true)
        .lineTo(0, -30)
        .close(),
      { fill: bodyFill, stroke, lineWidth: 1.5 },
    );
    this.addChild(frame);

    // ── Anvil (fixed) ─────────────────────────────────────────────────────────
    const anvil = new Rectangle(-2, -46, 16, 22, { fill: bodyFill, stroke });
    this.addChild(anvil);

    // ── Workpiece, gripped between anvil and spindle ──────────────────────────
    this.workpiece = new Rectangle(14, -44, 0, 18, {
      fill: VernierScalesColors.workpieceColorProperty,
      stroke,
      cornerRadius: 2,
    });
    this.addChild(this.workpiece);

    // ── Spindle (advances with the measurement) ───────────────────────────────
    this.spindle = new Rectangle(14, -44, 26, 18, { fill: sliderFill, stroke });
    this.addChild(this.spindle);

    // ── Barrel and thimble ────────────────────────────────────────────────────
    const barrel = new Rectangle(40, -BARREL_HALF_HEIGHT, BARREL_LENGTH, 2 * BARREL_HALF_HEIGHT, {
      fill: bodyFill,
      stroke,
      cornerRadius: 3,
    });
    this.addChild(barrel);

    const thimbleCentre = 40 + BARREL_LENGTH + THIMBLE_RADIUS - 26;
    const thimble = new Circle(THIMBLE_RADIUS, {
      x: thimbleCentre,
      fill: sliderFill,
      stroke,
      lineWidth: 1.5,
    });
    this.addChild(thimble);

    // The graduations that make the rotation visible. Without them the thimble
    // is a featureless disc and turning it looks like nothing happening.
    this.thimbleMarks = new Path(null, {
      x: thimbleCentre,
      stroke: VernierScalesColors.scaleTickColorProperty,
      lineWidth: 1.2,
    });
    this.addChild(this.thimbleMarks);

    // An index line on the fixed barrel: the mark the thimble is read against.
    this.addChild(
      new Path(Shape.lineSegment(40, 0, thimbleCentre - THIMBLE_RADIUS, 0), {
        stroke: VernierScalesColors.coincidenceColorProperty,
        lineWidth: 1.5,
      }),
    );

    Multilink.multilink([model.measurementProperty], (measurement) => {
      this.layoutFor(measurement);
    });
  }

  /** Advance the spindle and turn the thimble to match the measurement. */
  private layoutFor(measurementMm: number): void {
    const gap = measurementMm * PIXELS_PER_MM;

    this.workpiece.setRect(14, -44, gap, 18);
    this.spindle.x = gap;

    // One revolution per pitch of travel, so the drum position is the fractional
    // part of the measurement — exactly what the vernier beside it resolves.
    const turns = measurementMm / THIMBLE_PITCH_MM;
    const angle = 2 * Math.PI * (turns - Math.floor(turns));

    const marks = new Shape();
    const graduations = 20;
    for (let index = 0; index < graduations; index++) {
      const theta = angle + (2 * Math.PI * index) / graduations;
      const isMajor = index % 5 === 0;
      const inner = THIMBLE_RADIUS - (isMajor ? 13 : 8);
      marks
        .moveTo(inner * Math.cos(theta), inner * Math.sin(theta))
        .lineTo(THIMBLE_RADIUS * Math.cos(theta), THIMBLE_RADIUS * Math.sin(theta));
    }
    this.thimbleMarks.shape = marks;
  }
}
