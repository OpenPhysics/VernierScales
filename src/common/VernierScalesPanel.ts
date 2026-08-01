/**
 * VernierScalesPanel.ts
 *
 * A pre-themed Panel that automatically uses VernierScalesColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { VernierScalesPanel } from "../../common/VernierScalesPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new VernierScalesPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new VernierScalesPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new VernierScalesPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import VernierScalesColors from "../VernierScalesColors.js";
import { PANEL_CORNER_RADIUS } from "../VernierScalesConstants.js";

export type VernierScalesPanelOptions = PanelOptions;

export class VernierScalesPanel extends Panel {
  public constructor(content: Node, providedOptions?: VernierScalesPanelOptions) {
    const options = optionize<VernierScalesPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: VernierScalesColors.panelBackgroundColorProperty,
        stroke: VernierScalesColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}
