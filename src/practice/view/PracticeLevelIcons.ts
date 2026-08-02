/**
 * PracticeLevelIcons.ts
 *
 * The icon that sits on each level-selection button.
 *
 * All three are the same pair of combs on a scale face — that pairing is what
 * the sim is about — and what distinguishes them is the badge underneath: the
 * unit the level is read in, or, for the miscalibrated level, a zero with a
 * stroke through it. The tick counts are illustrative rather than accurate; at
 * button size a real 50-division vernier is a grey smear.
 */

import { Shape } from "scenerystack/kite";
import { Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import VernierScalesColors from "../../VernierScalesColors.js";
import { PracticeLevel } from "../model/PracticeModel.js";

/** Canvas the icons are drawn on, before the button scales them to fit. */
const ICON_WIDTH = 132;
const ICON_HEIGHT = 96;

/** A comb of evenly spaced ticks; a negative length draws upward from the baseline. */
function comb(count: number, spacing: number, length: number): Shape {
  const shape = new Shape();
  for (let index = 0; index < count; index++) {
    shape.moveTo(index * spacing, 0).lineTo(index * spacing, length);
  }
  return shape;
}

/** The two scales, with the coincident vernier tick picked out. */
function scaleGlyph(coincidentIndex: number): Node {
  // The button itself is a light control surface in both profiles, so the face
  // is outlined: without the stroke the near-white projector-mode face would
  // disappear into the button.
  const face = new Rectangle(0, 0, ICON_WIDTH, 52, {
    fill: VernierScalesColors.scaleFaceColorProperty,
    stroke: VernierScalesColors.instrumentStrokeColorProperty,
    lineWidth: 1.5,
    cornerRadius: 3,
  });

  const mainTicks = new Path(comb(12, 11, -16), {
    stroke: VernierScalesColors.scaleTickColorProperty,
    lineWidth: 2,
    x: 6,
    y: 27,
  });

  // Ten vernier divisions across nine main ones — the classic student caliper.
  const vernierTicks = new Path(comb(10, 9.9, 16), {
    stroke: VernierScalesColors.vernierTickColorProperty,
    lineWidth: 2,
    x: 16,
    y: 27,
  });

  const coincident = new Path(comb(1, 0, 16), {
    stroke: VernierScalesColors.coincidenceColorProperty,
    lineWidth: 4,
    x: 16 + coincidentIndex * 9.9,
    y: 27,
  });

  return new Node({ children: [face, mainTicks, vernierTicks, coincident] });
}

/** The unit badge under the scale, drawn on the button's light surface rather than on a scale face. */
function badge(text: string, fill = VernierScalesColors.controlSurfaceTextColorProperty): Text {
  return new Text(text, {
    font: new PhetFont({ size: 26, weight: "bold" }),
    fill,
    centerX: ICON_WIDTH / 2,
    top: 58,
  });
}

/** A zero with a stroke through it: the instrument does not read zero when closed. */
function struckZero(): Node {
  const zero = badge("0", VernierScalesColors.coincidenceColorProperty);
  const slash = new Path(new Shape().moveTo(zero.left - 7, zero.bottom + 3).lineTo(zero.right + 7, zero.top - 3), {
    stroke: VernierScalesColors.coincidenceColorProperty,
    lineWidth: 3.5,
    lineCap: "round",
  });
  return new Node({ children: [zero, slash] });
}

/** The icon for a level's selection button, sized to a common canvas. */
export function createLevelIcon(level: PracticeLevel): Node {
  const badgeNode =
    level === PracticeLevel.METRIC ? badge("mm") : level === PracticeLevel.IMPERIAL ? badge("in") : struckZero();

  // A different coincidence per level, so the three icons are not identical above
  // the badge and are told apart at a glance.
  const coincidentIndex = level === PracticeLevel.METRIC ? 3 : level === PracticeLevel.IMPERIAL ? 6 : 8;

  return new Node({
    children: [
      // An invisible spacer fixes every icon to the same size, so the buttons
      // scale their contents identically.
      new Rectangle(0, 0, ICON_WIDTH, ICON_HEIGHT, { fill: null }),
      scaleGlyph(coincidentIndex),
      badgeNode,
    ],
  });
}
