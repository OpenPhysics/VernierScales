/**
 * VernierScalesScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen.
 * Drawn on the standard PhET 548 × 373 canvas using VernierScalesColors.
 * Replace the stub backgrounds with screen-specific motifs.
 */
import { Node, Rectangle } from "scenerystack/scenery";
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

export function createVernierPrincipleIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createCaliperIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createInstrumentsIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createPracticeIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}
