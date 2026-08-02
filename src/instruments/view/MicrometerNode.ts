/**
 * MicrometerNode.ts
 *
 * An outside micrometer drawn in side elevation: horseshoe frame, fixed anvil,
 * advancing spindle, graduated sleeve, and the knurled thimble that turns as the
 * spindle moves.
 *
 * ── Why the thimble rotates ───────────────────────────────────────────────────
 *
 * On a micrometer the fine scale is wrapped around a rotating drum rather than
 * laid out along a beam, and the vernier lives on the fixed sleeve beside it.
 * That is the whole reason this instrument is on the screen: the vernier is
 * reading a *rotation*, which the flat scale views below cannot show. The thimble
 * turns through one full revolution per {@link THIMBLE_PITCH_MM} of spindle
 * travel, as a real 0.5 mm-pitch micrometer does.
 *
 * The drum is drawn as the side of a cylinder, not face-on, because that is what
 * a micrometer looks like — and rotation is still perfectly visible, since the
 * graduations on the near half of the drum scroll past the sleeve's datum line
 * and bunch up towards the silhouette exactly as they do on the real tool. Each
 * mark sits at y = R·sin θ and is hidden once it turns to the far side.
 *
 * ── Geometry ──────────────────────────────────────────────────────────────────
 *
 * Measuring axis at y = 0, with the anvil face at x = 0 and the sleeve mouth a
 * fixed {@link OPENING} pixels to its right — the frame's capacity. Two things
 * move with the reading, both by the same amount:
 *
 *   - the spindle face, opening the gap the workpiece sits in;
 *   - the thimble, retreating along the sleeve and uncovering one millimetre
 *     graduation per millimetre of travel.
 *
 * So the exposed length of sleeve scale *is* the reading, which is how the
 * instrument is actually read, and no separate scaling has to be kept in sync.
 */

import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Circle, LinearGradient, Node, type NodeOptions, Path, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import { cylinderFill, knurlShape, shade } from "../../common/view/metalFills.js";
import VernierScalesColors from "../../VernierScalesColors.js";

/** Spindle travel per full turn of the thimble, in millimetres. */
const THIMBLE_PITCH_MM = 0.5;

/** Graduations around the thimble: one per 0.01 mm at a 0.5 mm pitch. */
const THIMBLE_DIVISIONS = 50;

/** Every fifth thimble graduation carries a number, as on the real drum. */
const THIMBLE_LABEL_INTERVAL = 5;

/** How many view pixels one millimetre of spindle travel opens the gap by. */
const PIXELS_PER_MM = 4;

/** Capacity of the frame, matching the micrometer's 25 mm range. */
const CAPACITY_MM = 25;

/** Fixed width of the frame opening: anvil face to sleeve mouth. */
const OPENING = CAPACITY_MM * PIXELS_PER_MM;

// ── Anvil, workpiece, spindle ────────────────────────────────────────────────

/** Half-height of the workpiece held between the faces. */
const WORKPIECE_HALF = 13;

/** Length of the anvil protruding from the frame, and its half-height. */
const ANVIL_LENGTH = 30;
const ANVIL_HALF = 9;

/** Half-height of the spindle, a slimmer rod than the anvil. */
const SPINDLE_HALF = 7;

/** How far the spindle is drawn past the sleeve mouth, where it is hidden. */
const SPINDLE_INTO_SLEEVE = 24;

// ── Sleeve and its boss ──────────────────────────────────────────────────────

/** Half-height of the sleeve the thimble rides on. */
const SLEEVE_HALF = 18;

/** Length of the frame boss that clamps the sleeve at the mouth. */
const BOSS_LENGTH = 38;

/** Position of the sleeve's 0 mm graduation — clear of the boss. */
const SLEEVE_ZERO = OPENING + BOSS_LENGTH + 4;

/**
 * Length of the sleeve. Long enough that the retreating thimble still overlaps
 * its tail at full capacity, as it must if it is to stay supported.
 */
const SLEEVE_LENGTH = SLEEVE_ZERO - OPENING + CAPACITY_MM * PIXELS_PER_MM + 16;

/** Sleeve graduation lengths, measured from the datum line. */
const SLEEVE_TICK = 6;
const SLEEVE_TICK_MAJOR = 9;

// ── Thimble and ratchet ──────────────────────────────────────────────────────

/** Radius of the thimble drum. */
const THIMBLE_RADIUS = 34;

/** Length of the thimble along the axis. */
const THIMBLE_LENGTH = 96;

/** Length of the chamfer at the thimble's reading edge. */
const THIMBLE_BEVEL = 6;

/** Where the thimble graduations start, just past the chamfer. */
const THIMBLE_MARK_X = THIMBLE_BEVEL + 1;

/** Thimble graduation lengths. */
const THIMBLE_MARK = 9;
const THIMBLE_MARK_MAJOR = 15;

/**
 * How square-on a graduation must be before it is drawn at all.
 * Below this the mark has turned to the silhouette, where the real drum shows
 * nothing but a crowded edge.
 */
const THIMBLE_MARK_FACING = 0.15;

/** How square-on a graduation must be before its number is legible. */
const THIMBLE_LABEL_FACING = 0.62;

/** Radius and length of the ratchet stop at the far end. */
const RATCHET_RADIUS = 19;
const RATCHET_LENGTH = 32;

// ── Frame ────────────────────────────────────────────────────────────────────

/** Half-height of the boss where the frame clamps the sleeve. */
const BOSS_HALF = SLEEVE_HALF + 8;

/** The face the anvil is set into: the right-hand end of the frame's arm. */
const ARM_FACE_X = -ANVIL_LENGTH;

/** Top of the frame, level with the top of the boss. */
const FRAME_TOP = -BOSS_HALF;

/** Throat: the slot in the C, between the arm's underside and the bow's top. */
const THROAT_TOP = 14;
const THROAT_BOTTOM = 56;

/**
 * Centre of the frame's rounded back, on the throat's axis.
 *
 * Inner and outer curves share this x but not their radii, which is what gives
 * the frame a slim anvil arm and a deep bow — a horseshoe rather than a hook.
 */
const BACK_X = -58;
const BACK_INNER_RADIUS = (THROAT_BOTTOM - THROAT_TOP) / 2;
const BACK_INNER_Y = (THROAT_BOTTOM + THROAT_TOP) / 2;
const BACK_OUTER_RADIUS = 60;
const BACK_OUTER_Y = FRAME_TOP + BACK_OUTER_RADIUS;

/** Rounding on the arm's outer corners, where it meets the anvil face. */
const ARM_CORNER = 8;

/** Font sizes for the engraved numbers. */
const SLEEVE_FONT_SIZE = 8;
const THIMBLE_FONT_SIZE = 9;

/**
 * Colour of everything engraved on the instrument's metal.
 *
 * The sleeve and thimble are instrument body, not scale faces: they are light in
 * both colour profiles, so their graduations must be dark in both. That is what
 * the instrument stroke colour is for. `scaleTickColorProperty` inverts with the
 * scale face and would disappear here in the default profile.
 */
const engravedColorProperty = VernierScalesColors.instrumentStrokeColorProperty;

export class MicrometerNode extends Node {
  private readonly workpiece: Rectangle;
  private readonly spindle: Rectangle;

  /** Thimble, ratchet and their marks — everything that retreats with the reading. */
  private readonly thimbleAssembly: Node;

  private readonly thimbleMarks: Path;

  /** One reusable label per numbered graduation, hidden as it turns out of view. */
  private readonly thimbleLabels: Text[];

  public constructor(model: VernierScaleModel, providedOptions?: NodeOptions) {
    super(providedOptions);

    const bodyFill = VernierScalesColors.instrumentBodyColorProperty;
    const sliderFill = VernierScalesColors.instrumentSliderColorProperty;
    const stroke = VernierScalesColors.instrumentStrokeColorProperty;

    // ── Spindle, emerging from the sleeve mouth ───────────────────────────────
    // Drawn before the sleeve and the frame, both of which it disappears behind.
    this.spindle = new Rectangle(0, -SPINDLE_HALF, OPENING + SPINDLE_INTO_SLEEVE, 2 * SPINDLE_HALF, {
      fill: cylinderFill(sliderFill, SPINDLE_HALF),
      stroke,
    });
    this.addChild(this.spindle);

    // ── Sleeve, fixed, carrying the millimetre scale ──────────────────────────
    this.addChild(
      new Rectangle(OPENING, -SLEEVE_HALF, SLEEVE_LENGTH, 2 * SLEEVE_HALF, {
        fill: cylinderFill(bodyFill, SLEEVE_HALF),
        stroke,
        cornerRadius: 2,
      }),
    );

    // Millimetres above the datum line, half-millimetres below it, as engraved.
    const sleeveTicks = new Shape();
    for (let mm = 0; mm <= CAPACITY_MM; mm++) {
      const x = SLEEVE_ZERO + mm * PIXELS_PER_MM;
      sleeveTicks.moveTo(x, -2).lineTo(x, -(mm % 5 === 0 ? SLEEVE_TICK_MAJOR : SLEEVE_TICK));
      if (mm < CAPACITY_MM) {
        sleeveTicks.moveTo(x + PIXELS_PER_MM / 2, 2).lineTo(x + PIXELS_PER_MM / 2, SLEEVE_TICK);
      }
      if (mm % 5 === 0) {
        this.addChild(
          new Text(String(mm), {
            font: new PhetFont(SLEEVE_FONT_SIZE),
            fill: engravedColorProperty,
            centerX: x,
            bottom: -SLEEVE_TICK_MAJOR - 1,
          }),
        );
      }
    }
    this.addChild(new Path(sleeveTicks, { stroke: engravedColorProperty, lineWidth: 1 }));

    // The datum line: what the thimble is read against. It runs from the boss to
    // wherever the thimble has retreated to, since the thimble covers the rest.
    this.addChild(
      new Path(Shape.lineSegment(OPENING + BOSS_LENGTH - 4, 0, OPENING + SLEEVE_LENGTH - 2, 0), {
        stroke: VernierScalesColors.coincidenceColorProperty,
        lineWidth: 1.5,
      }),
    );

    // ── Horseshoe frame, boss included ────────────────────────────────────────
    // One closed silhouette rather than a stroked centre line, so the arm can be
    // slim where the anvil is set into it and the bow deep where the frame has to
    // resist being sprung. Walked clockwise: over the arm, round the outside of
    // the back, along the bow, up and over the boss, then back through the throat.
    const frameShape = new Shape()
      .moveTo(ARM_FACE_X - ARM_CORNER, FRAME_TOP)
      .lineTo(BACK_X, FRAME_TOP)
      .arc(BACK_X, BACK_OUTER_Y, BACK_OUTER_RADIUS, -Math.PI / 2, Math.PI / 2, true)
      .lineTo(OPENING + BOSS_LENGTH - 22, BACK_OUTER_Y + BACK_OUTER_RADIUS)
      .quadraticCurveTo(
        OPENING + BOSS_LENGTH,
        BACK_OUTER_Y + BACK_OUTER_RADIUS,
        OPENING + BOSS_LENGTH,
        BACK_OUTER_Y + BACK_OUTER_RADIUS - 26,
      )
      .lineTo(OPENING + BOSS_LENGTH, FRAME_TOP)
      .lineTo(OPENING, FRAME_TOP)
      .lineTo(OPENING, THROAT_TOP + 10)
      .quadraticCurveTo(OPENING - 26, THROAT_BOTTOM, OPENING - 62, THROAT_BOTTOM)
      .lineTo(BACK_X, THROAT_BOTTOM)
      .arc(BACK_X, BACK_INNER_Y, BACK_INNER_RADIUS, Math.PI / 2, -Math.PI / 2, false)
      .lineTo(ARM_FACE_X, THROAT_TOP)
      .lineTo(ARM_FACE_X, FRAME_TOP + ARM_CORNER)
      .quadraticCurveTo(ARM_FACE_X, FRAME_TOP, ARM_FACE_X - ARM_CORNER, FRAME_TOP)
      .close();
    this.addChild(
      new Path(frameShape, {
        // A gentle top-lit wash rather than the cylinders' gradient: the frame is
        // a flat forging, and shading it like a barrel would make it read as one.
        fill: new LinearGradient(0, FRAME_TOP, 0, BACK_OUTER_Y + BACK_OUTER_RADIUS)
          .addColorStop(0, shade(bodyFill, 0.18))
          .addColorStop(0.4, bodyFill)
          .addColorStop(1, shade(bodyFill, -0.22)),
        stroke,
        lineWidth: 1.5,
      }),
    );

    // The spindle lock: a screw head half sunk into the top of the boss.
    this.addChild(
      new Circle(8, {
        x: OPENING + 14,
        y: FRAME_TOP + 2,
        fill: cylinderFill(sliderFill, 8),
        stroke,
      }),
    );

    // ── Anvil, fixed, its measuring face at x = 0 ─────────────────────────────
    this.addChild(
      new Rectangle(ARM_FACE_X, -ANVIL_HALF, ANVIL_LENGTH, 2 * ANVIL_HALF, {
        fill: cylinderFill(bodyFill, ANVIL_HALF),
        stroke,
      }),
    );

    // ── Workpiece, gripped between anvil and spindle ──────────────────────────
    this.workpiece = new Rectangle(0, -WORKPIECE_HALF, 0, 2 * WORKPIECE_HALF, {
      fill: VernierScalesColors.workpieceColorProperty,
      stroke,
      cornerRadius: 2,
    });
    this.addChild(this.workpiece);

    // ── Thimble and ratchet, retreating together with the reading ─────────────
    // Built with the thimble's reading edge at local x = 0.
    const thimbleShape = new Shape()
      .moveTo(0, -SLEEVE_HALF - 2)
      .lineTo(THIMBLE_BEVEL, -THIMBLE_RADIUS)
      .lineTo(THIMBLE_LENGTH - 10, -THIMBLE_RADIUS)
      .quadraticCurveTo(THIMBLE_LENGTH, -THIMBLE_RADIUS, THIMBLE_LENGTH, -THIMBLE_RADIUS + 10)
      .lineTo(THIMBLE_LENGTH, THIMBLE_RADIUS - 10)
      .quadraticCurveTo(THIMBLE_LENGTH, THIMBLE_RADIUS, THIMBLE_LENGTH - 10, THIMBLE_RADIUS)
      .lineTo(THIMBLE_BEVEL, THIMBLE_RADIUS)
      .lineTo(0, SLEEVE_HALF + 2)
      .close();

    const ratchetLeft = THIMBLE_LENGTH;
    const ratchetShape = new Shape()
      .moveTo(ratchetLeft, -RATCHET_RADIUS)
      .lineTo(ratchetLeft + RATCHET_LENGTH - 7, -RATCHET_RADIUS)
      .quadraticCurveTo(
        ratchetLeft + RATCHET_LENGTH,
        -RATCHET_RADIUS,
        ratchetLeft + RATCHET_LENGTH,
        -RATCHET_RADIUS + 7,
      )
      .lineTo(ratchetLeft + RATCHET_LENGTH, RATCHET_RADIUS - 7)
      .quadraticCurveTo(ratchetLeft + RATCHET_LENGTH, RATCHET_RADIUS, ratchetLeft + RATCHET_LENGTH - 7, RATCHET_RADIUS)
      .lineTo(ratchetLeft, RATCHET_RADIUS)
      .close();

    this.thimbleMarks = new Path(null, { stroke: engravedColorProperty, lineWidth: 1.1 });

    this.thimbleLabels = [];
    for (let division = 0; division < THIMBLE_DIVISIONS; division += THIMBLE_LABEL_INTERVAL) {
      this.thimbleLabels.push(
        new Text(String(division), {
          font: new PhetFont(THIMBLE_FONT_SIZE),
          fill: engravedColorProperty,
          left: THIMBLE_MARK_X + THIMBLE_MARK_MAJOR + 4,
        }),
      );
    }

    this.thimbleAssembly = new Node({
      children: [
        new Path(ratchetShape, { fill: cylinderFill(sliderFill, RATCHET_RADIUS), stroke }),
        new Path(knurlShape(ratchetLeft + 6, ratchetLeft + RATCHET_LENGTH - 9, RATCHET_RADIUS - 4, 5), {
          stroke: shade(sliderFill, -0.16),
          lineWidth: 0.6,
        }),
        new Path(thimbleShape, { fill: cylinderFill(sliderFill, THIMBLE_RADIUS), stroke }),
        new Path(knurlShape(THIMBLE_LENGTH * 0.45, THIMBLE_LENGTH - 9, THIMBLE_RADIUS - 6, 6), {
          stroke: shade(sliderFill, -0.12),
          lineWidth: 0.6,
        }),
        this.thimbleMarks,
        ...this.thimbleLabels,
      ],
    });
    this.addChild(this.thimbleAssembly);

    Multilink.multilink([model.measurementProperty], (measurement) => {
      this.layoutFor(measurement);
    });
  }

  /** Open the gap, retreat the thimble, and turn the drum to match the reading. */
  private layoutFor(measurementMm: number): void {
    const gap = Math.max(0, measurementMm) * PIXELS_PER_MM;

    this.workpiece.setRect(0, -WORKPIECE_HALF, gap, 2 * WORKPIECE_HALF);

    // The face sits at `gap`; the shaft still runs into the sleeve, so it never
    // floats free of the barrel.
    this.spindle.setRect(gap, -SPINDLE_HALF, OPENING + SPINDLE_INTO_SLEEVE - gap, 2 * SPINDLE_HALF);

    // The thimble travels with the spindle, uncovering the millimetre scale it
    // has just read off.
    this.thimbleAssembly.x = SLEEVE_ZERO + gap;

    // One revolution per pitch of travel, so the drum's angle is the fractional
    // part of the measurement — exactly what the vernier beside it resolves.
    const turns = measurementMm / THIMBLE_PITCH_MM;
    const angle = 2 * Math.PI * (turns - Math.floor(turns));

    // A graduation reaches the datum line when the drum has turned by its own
    // share of a revolution, so its angle off the datum is that much behind.
    // Numbering therefore runs *down* the near face from 0 — 45, 40, 35 — which
    // is how the numbers sit on the real drum.
    const marks = new Shape();
    for (let division = 0; division < THIMBLE_DIVISIONS; division++) {
      const theta = angle - (2 * Math.PI * division) / THIMBLE_DIVISIONS;
      const facing = Math.cos(theta);
      if (facing < THIMBLE_MARK_FACING) {
        continue;
      }
      const y = THIMBLE_RADIUS * Math.sin(theta);
      const isLabelled = division % THIMBLE_LABEL_INTERVAL === 0;
      marks.moveTo(THIMBLE_MARK_X, y).lineTo(THIMBLE_MARK_X + (isLabelled ? THIMBLE_MARK_MAJOR : THIMBLE_MARK), y);
    }
    this.thimbleMarks.shape = marks;

    // The numbers need more of the drum face than a bare tick does before they
    // are worth showing; the rest have turned too far to be legible.
    this.thimbleLabels.forEach((label, index) => {
      const theta = angle - (2 * Math.PI * index * THIMBLE_LABEL_INTERVAL) / THIMBLE_DIVISIONS;
      label.visible = Math.cos(theta) > THIMBLE_LABEL_FACING;
      if (label.visible) {
        label.centerY = THIMBLE_RADIUS * Math.sin(theta);
      }
    });
  }
}
