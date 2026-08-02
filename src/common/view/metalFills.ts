/**
 * metalFills.ts
 *
 * Shading helpers shared by the instrument drawings.
 *
 * The instruments are drawn from two themed base colours — one for fixed parts,
 * one for the moving assembly — and every highlight and shadow is derived from
 * whichever of those is passed in, rather than being a palette entry of its own.
 * That keeps the lighting identical in both colour profiles, keeps the fixed and
 * moving parts distinguishable however the palette is retuned, and means the
 * palette does not have to grow a `beamHighlight`, `jawShadow` and so on for
 * every surface that catches the light.
 *
 * The light is always overhead: bright along a part's upper edge, shaded along
 * its lower one.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { Color } from "scenerystack/scenery";
import { LinearGradient } from "scenerystack/scenery";

/** A lighter (`factor > 0`) or darker (`factor < 0`) shade of a themed colour. */
export const shade = (base: TReadOnlyProperty<Color>, factor: number): TReadOnlyProperty<Color> =>
  new DerivedProperty([base], (color) => color.colorUtilsBrightness(factor));

/**
 * A vertical gradient that makes a horizontal cylinder read as round: a dark
 * upper edge, a highlight just below it, and shadow along the bottom. Spans
 * `-halfHeight` to `+halfHeight`, so it suits a part centred on its own axis.
 */
export const cylinderFill = (base: TReadOnlyProperty<Color>, halfHeight: number): LinearGradient =>
  new LinearGradient(0, -halfHeight, 0, halfHeight)
    .addColorStop(0, shade(base, -0.3))
    .addColorStop(0.2, shade(base, 0.35))
    .addColorStop(0.5, base)
    .addColorStop(0.85, shade(base, -0.22))
    .addColorStop(1, shade(base, -0.45));

/**
 * A vertical gradient for a flat bar or plate seen face-on: a bright top edge
 * falling away to a shaded bottom one. Gentler than {@link cylinderFill} — the
 * surface is flat, so it should not look like a tube.
 */
export const barFill = (base: TReadOnlyProperty<Color>, top: number, bottom: number): LinearGradient =>
  new LinearGradient(0, top, 0, bottom)
    .addColorStop(0, shade(base, 0.4))
    .addColorStop(0.12, shade(base, 0.15))
    .addColorStop(0.6, base)
    .addColorStop(1, shade(base, -0.28));

/**
 * Fine axial lines standing in for the knurling on a grip, spanning
 * `centerY ± halfHeight`.
 */
export const knurlShape = (left: number, right: number, halfHeight: number, spacing: number, centerY = 0): Shape => {
  const shape = new Shape();
  for (let x = left; x <= right; x += spacing) {
    shape.moveTo(x, centerY - halfHeight).lineTo(x, centerY + halfHeight);
  }
  return shape;
};
