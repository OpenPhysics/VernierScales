/**
 * ProtractorNode.ts
 *
 * A bevel protractor: a degree scale on a circular arc, read against a vernier
 * arc at the blade.
 *
 * ── The point of this node ────────────────────────────────────────────────────
 *
 * Everywhere else in this sim the vernier is a straight comb sliding along
 * another straight comb. Here both scales are arcs, the divisions are angles
 * rather than lengths, and the reading comes out in degrees and arcminutes —
 * and the principle is untouched. Twelve vernier divisions span 23 degrees, so
 * each is 5 arcminutes short of two degrees, and the line that comes into
 * alignment names the arcminutes exactly as it names the hundredths of a
 * millimetre on a caliper.
 *
 * ── Fixed blade, moving dial ──────────────────────────────────────────────────
 *
 * The blade is drawn pointing straight up and the degree scale rotates past it,
 * rather than the blade swinging around a fixed dial. That is how the instrument
 * is actually read — against an index — and it also keeps the drawing inside a
 * fixed, predictable box. A swinging sector would sweep across half the screen
 * and collide with the scale views below.
 *
 * The dial's centre sits well below the visible area so that the arc reads as
 * part of a large circle; only the sector around the blade is drawn.
 */

import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Node, type NodeOptions, Path, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import { leastCount, type VernierScaleSpec } from "../../common/model/VernierScaleSpec.js";
import { vernierDivisionTicks, vernierLabel } from "../../common/model/vernier.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import { PROTRACTOR_RADIUS, SCALE_LABEL_FONT_SIZE } from "../../VernierScalesConstants.js";

/**
 * Radius of the main degree scale.
 *
 * Deliberately far larger than the visible drawing: at this radius the sector
 * below gives about ten pixels per degree, which is what the 23-degree vernier
 * needs before its twelve divisions can be told apart at all.
 */
const DIAL_RADIUS = PROTRACTOR_RADIUS * 3.3;

/** Half-width of the visible sector, in degrees. */
const SECTOR_HALF_ANGLE = 26;

/** Length of an unnumbered degree tick. */
const DEGREE_TICK = 11;

/** Length of a numbered degree tick. */
const DEGREE_TICK_MAJOR = 18;

/** Length of a vernier tick, drawn inside the main arc. */
const VERNIER_TICK = 13;

/** Degrees to radians, with zero pointing up and angles opening clockwise. */
const toRadians = (degrees: number): number => (degrees - 90) * (Math.PI / 180);

export class ProtractorNode extends Node {
  private readonly dialFacePath: Path;
  private readonly mainArcPath: Path;
  private readonly mainTicksPath: Path;
  private readonly vernierTicksPath: Path;
  private readonly coincidentTickPath: Path;
  private readonly bladePath: Path;
  private readonly labelsLayer: Node;

  public constructor(model: VernierScaleModel, providedOptions?: NodeOptions) {
    super(providedOptions);

    // The dial face. Without it the graduations would be dark marks on a dark
    // background; every other scale in the sim is read off a light face, and the
    // protractor has to match or its ticks simply disappear.
    this.dialFacePath = new Path(null, {
      fill: VernierScalesColors.scaleFaceColorProperty,
      stroke: VernierScalesColors.panelBorderColorProperty,
      lineWidth: 1,
    });

    this.mainArcPath = new Path(null, {
      stroke: VernierScalesColors.instrumentStrokeColorProperty,
      lineWidth: 1.5,
    });
    this.mainTicksPath = new Path(null, {
      stroke: VernierScalesColors.scaleTickColorProperty,
      lineWidth: 1.2,
    });
    this.vernierTicksPath = new Path(null, {
      stroke: VernierScalesColors.vernierTickColorProperty,
      lineWidth: 1.2,
    });
    this.coincidentTickPath = new Path(null, {
      stroke: VernierScalesColors.coincidenceColorProperty,
      lineWidth: 3,
    });
    this.bladePath = new Path(null, {
      fill: VernierScalesColors.instrumentSliderColorProperty,
      stroke: VernierScalesColors.instrumentStrokeColorProperty,
      lineWidth: 1.2,
    });
    this.labelsLayer = new Node();

    this.addChild(this.dialFacePath);
    this.addChild(this.mainArcPath);
    this.addChild(this.bladePath);
    this.addChild(this.mainTicksPath);
    this.addChild(this.vernierTicksPath);
    this.addChild(this.coincidentTickPath);
    this.addChild(this.labelsLayer);

    Multilink.multilink(
      [model.measurementProperty, model.specProperty, model.coincidentIndexProperty],
      (angleDegrees, spec, coincidentIdx) => {
        this.rebuild(angleDegrees, spec, coincidentIdx);
      },
    );
  }

  private rebuild(angleDegrees: number, spec: VernierScaleSpec, coincidentIdx: number): void {
    const centreDegrees = angleDegrees;
    const from = centreDegrees - SECTOR_HALF_ANGLE;
    const to = centreDegrees + SECTOR_HALF_ANGLE;

    // Everything is drawn in the blade's frame: the blade points straight up and
    // the degree scale rotates past it. `relative` maps a dial reading onto the
    // angle it appears at, which is what keeps the sector in a fixed box.
    const relative = (degree: number): number => toRadians(degree - angleDegrees);

    // ── The dial face and its arc ─────────────────────────────────────────────
    // An annular sector: out along the outer edge, in at the far end, back along
    // the inner edge. It has to reach past the degree labels outside and the
    // vernier numbers inside, or they sit off the face and vanish again.
    const outerRadius = DIAL_RADIUS + DEGREE_TICK_MAJOR + 24;
    const innerRadius = DIAL_RADIUS - VERNIER_TICK - 24;
    this.dialFacePath.shape = new Shape()
      .arc(0, 0, outerRadius, relative(from), relative(to), false)
      .arc(0, 0, innerRadius, relative(to), relative(from), true)
      .close();

    this.mainArcPath.shape = new Shape().arc(0, 0, DIAL_RADIUS, relative(from), relative(to), false);

    // ── Degree graduations ────────────────────────────────────────────────────
    const mainShape = new Shape();
    this.labelsLayer.removeAllChildren();

    const firstDegree = Math.ceil(from);
    const lastDegree = Math.floor(to);
    for (let degree = firstDegree; degree <= lastDegree; degree++) {
      if (degree < 0) {
        continue;
      }
      const isMajor = degree % 5 === 0;
      const length = isMajor ? DEGREE_TICK_MAJOR : DEGREE_TICK;
      const theta = relative(degree);
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      mainShape
        .moveTo(DIAL_RADIUS * cos, DIAL_RADIUS * sin)
        .lineTo((DIAL_RADIUS + length) * cos, (DIAL_RADIUS + length) * sin);

      if (isMajor) {
        const labelRadius = DIAL_RADIUS + length + 10;
        this.labelsLayer.addChild(
          new Text(String(degree), {
            font: new PhetFont(SCALE_LABEL_FONT_SIZE),
            fill: VernierScalesColors.scaleLabelColorProperty,
            centerX: labelRadius * cos,
            centerY: labelRadius * sin,
          }),
        );
      }
    }
    this.mainTicksPath.shape = mainShape;

    // ── Vernier arc, fixed with the blade ─────────────────────────────────────
    const vernierShape = new Shape();
    const coincidentShape = new Shape();
    const divisionDegrees = vernierDivisionTicks(spec.type, spec.divisions) * leastCount(spec);

    for (let index = 0; index <= spec.divisions; index++) {
      const degree = angleDegrees + index * divisionDegrees;
      if (degree < from || degree > to) {
        continue;
      }
      const theta = relative(degree);
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      const target = index === coincidentIdx ? coincidentShape : vernierShape;
      target
        .moveTo(DIAL_RADIUS * cos, DIAL_RADIUS * sin)
        .lineTo((DIAL_RADIUS - VERNIER_TICK) * cos, (DIAL_RADIUS - VERNIER_TICK) * sin);

      if (index % 2 === 0 && index < spec.divisions) {
        const labelRadius = DIAL_RADIUS - VERNIER_TICK - 9;
        this.labelsLayer.addChild(
          new Text(String(vernierLabel(index, spec.type, spec.divisions)), {
            font: new PhetFont(SCALE_LABEL_FONT_SIZE - 1),
            fill:
              index === coincidentIdx
                ? VernierScalesColors.coincidenceColorProperty
                : VernierScalesColors.scaleLabelColorProperty,
            centerX: labelRadius * cos,
            centerY: labelRadius * sin,
          }),
        );
      }
    }
    this.vernierTicksPath.shape = vernierShape;
    this.coincidentTickPath.shape = coincidentShape;

    // ── The blade, always straight up in its own frame ────────────────────────
    const inner = DIAL_RADIUS - 70;
    const halfWidth = 5;
    this.bladePath.shape = new Shape().rect(-halfWidth, -DIAL_RADIUS, 2 * halfWidth, DIAL_RADIUS - inner);
  }
}
