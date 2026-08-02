/**
 * VernierScalesScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen.
 * Drawn on the standard PhET 548 × 373 canvas using VernierScalesColors.
 *
 * Each icon shows the same two combs of ticks in a different setting, because
 * that pairing is what the sim is about; what changes between screens is what is
 * built around them. The tick counts are illustrative rather than accurate — at
 * icon size a real 50-division vernier is a grey smear.
 */

import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import VernierScalesColors from "../VernierScalesColors.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: VernierScalesColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: VernierScalesColors.backgroundColorProperty,
  });
}

/**
 * A comb of evenly spaced ticks.
 *
 * @param count - how many ticks
 * @param spacing - distance between ticks
 * @param length - tick length; negative draws upward from the baseline
 */
function comb(count: number, spacing: number, length: number): Shape {
  const shape = new Shape();
  for (let index = 0; index < count; index++) {
    const x = index * spacing;
    shape.moveTo(x, 0).lineTo(x, length);
  }
  return shape;
}

/** The two scales alone, the vernier's shorter divisions plainly visible. */
export function createVernierPrincipleIcon(): ScreenIcon {
  const face = new Rectangle(44, 116, 460, 142, {
    fill: VernierScalesColors.scaleFaceColorProperty,
    cornerRadius: 6,
  });

  const mainTicks = new Path(comb(12, 40, -52), {
    stroke: VernierScalesColors.scaleTickColorProperty,
    lineWidth: 6,
    x: 62,
    y: 187,
  });

  // Ten vernier divisions across nine main ones — the classic student caliper.
  const vernierTicks = new Path(comb(10, 36, 52), {
    stroke: VernierScalesColors.vernierTickColorProperty,
    lineWidth: 6,
    x: 98,
    y: 187,
  });

  // The one that lines up, four divisions along.
  const coincident = new Path(comb(1, 0, 52), {
    stroke: VernierScalesColors.coincidenceColorProperty,
    lineWidth: 11,
    x: 98 + 4 * 36,
    y: 187,
  });

  return iconFrom(new Node({ children: [background(), face, mainTicks, vernierTicks, coincident] }));
}

/** A caliper gripping a workpiece between its outside jaws. */
export function createCaliperIcon(): ScreenIcon {
  const body = VernierScalesColors.instrumentBodyColorProperty;
  const slider = VernierScalesColors.instrumentSliderColorProperty;
  const stroke = VernierScalesColors.instrumentStrokeColorProperty;

  const beam = new Rectangle(50, 120, 450, 44, { fill: body, stroke, lineWidth: 3, cornerRadius: 4 });
  const fixedJaw = new Rectangle(50, 164, 30, 128, { fill: body, stroke, lineWidth: 3 });
  const sliderBody = new Rectangle(300, 108, 120, 68, { fill: slider, stroke, lineWidth: 3, cornerRadius: 4 });
  const slidingJaw = new Rectangle(300, 164, 30, 128, { fill: slider, stroke, lineWidth: 3 });

  const workpiece = new Rectangle(80, 200, 220, 60, {
    fill: VernierScalesColors.workpieceColorProperty,
    stroke,
    lineWidth: 3,
    cornerRadius: 6,
  });

  const vernierTicks = new Path(comb(6, 20, 30), {
    stroke: VernierScalesColors.vernierTickColorProperty,
    lineWidth: 5,
    x: 312,
    y: 132,
  });

  return iconFrom(
    new Node({ children: [background(), workpiece, beam, fixedJaw, sliderBody, slidingJaw, vernierTicks] }),
  );
}

/** A protractor arc, standing in for the instruments that are not calipers. */
export function createInstrumentsIcon(): ScreenIcon {
  const centreX = W / 2;
  const centreY = 350;
  const radius = 210;

  const dial = new Path(new Shape().arc(centreX, centreY, radius, Math.PI, 2 * Math.PI, false), {
    stroke: VernierScalesColors.instrumentStrokeColorProperty,
    lineWidth: 5,
  });

  const ticks = new Shape();
  const vernier = new Shape();
  for (let index = 0; index <= 16; index++) {
    const theta = Math.PI + (index * Math.PI) / 16;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    ticks
      .moveTo(centreX + radius * cos, centreY + radius * sin)
      .lineTo(centreX + (radius + 26) * cos, centreY + (radius + 26) * sin);

    // A short arc of vernier marks, offset inward from the degree scale.
    if (index >= 5 && index <= 11) {
      vernier
        .moveTo(centreX + radius * cos, centreY + radius * sin)
        .lineTo(centreX + (radius - 28) * cos, centreY + (radius - 28) * sin);
    }
  }

  const bladeAngle = (-115 * Math.PI) / 180;
  const blade = new Path(
    new Shape()
      .moveTo(centreX, centreY)
      .lineTo(centreX + radius * Math.cos(bladeAngle), centreY + radius * Math.sin(bladeAngle)),
    { stroke: VernierScalesColors.instrumentSliderColorProperty, lineWidth: 12 },
  );

  return iconFrom(
    new Node({
      children: [
        background(),
        dial,
        new Path(ticks, { stroke: VernierScalesColors.scaleTickColorProperty, lineWidth: 5 }),
        blade,
        new Path(vernier, { stroke: VernierScalesColors.vernierTickColorProperty, lineWidth: 5 }),
        new Circle(14, { x: centreX, y: centreY, fill: VernierScalesColors.instrumentStrokeColorProperty }),
      ],
    }),
  );
}

/** A scale with a question mark under it: read this one yourself. */
export function createPracticeIcon(): ScreenIcon {
  const face = new Rectangle(44, 96, 460, 114, {
    fill: VernierScalesColors.scaleFaceColorProperty,
    cornerRadius: 6,
  });

  const mainTicks = new Path(comb(12, 40, -42), {
    stroke: VernierScalesColors.scaleTickColorProperty,
    lineWidth: 6,
    x: 62,
    y: 153,
  });
  const vernierTicks = new Path(comb(10, 36, 42), {
    stroke: VernierScalesColors.vernierTickColorProperty,
    lineWidth: 6,
    x: 98,
    y: 153,
  });

  // A question mark drawn as a stroked arc and a dot, so the icon needs no font.
  const hook = new Path(new Shape().arc(274, 278, 38, Math.PI, 0.4 * Math.PI, false).lineTo(274, 322), {
    stroke: VernierScalesColors.coincidenceColorProperty,
    lineWidth: 17,
    lineCap: "round",
  });
  const dot = new Circle(10, { x: 274, y: 350, fill: VernierScalesColors.coincidenceColorProperty });

  return iconFrom(new Node({ children: [background(), face, mainTicks, vernierTicks, hook, dot] }));
}
