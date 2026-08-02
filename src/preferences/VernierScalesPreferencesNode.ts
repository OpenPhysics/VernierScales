/**
 * VernierScalesPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to VernierScalesPreferencesModel Properties (whose initial values come from
 * vernierScalesQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import VernierScalesColors from "../VernierScalesColors.js";
import VernierScalesNamespace from "../VernierScalesNamespace.js";
import type { VernierScalesPreferencesModel } from "./VernierScalesPreferencesModel.js";

export class VernierScalesPreferencesNode extends VBox {
  public constructor(preferencesModel: VernierScalesPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: VernierScalesColors.controlSurfaceTextColorProperty,
    });

    const labelOptions = {
      font: new PhetFont(14),
      fill: VernierScalesColors.controlSurfaceTextColorProperty,
    } as const;

    const checkboxOptions = (name: string) => ({
      checkboxColor: VernierScalesColors.controlSurfaceTextColorProperty,
      checkboxColorBackground: VernierScalesColors.controlSurfaceColorProperty,
      spacing: 8,
      ...(tandem && { tandem: tandem.createTandem(name) }),
    });

    const startMagnifiedCheckbox = new Checkbox(
      preferencesModel.startMagnifiedProperty,
      new Text(prefStrings.startMagnifiedStringProperty, labelOptions),
      checkboxOptions("startMagnifiedCheckbox"),
    );

    const showTrueValueCheckbox = new Checkbox(
      preferencesModel.showTrueValueProperty,
      new Text(prefStrings.showTrueValueStringProperty, labelOptions),
      checkboxOptions("showTrueValueCheckbox"),
    );

    const showCoincidenceMarkerCheckbox = new Checkbox(
      preferencesModel.showCoincidenceMarkerProperty,
      new Text(prefStrings.showCoincidenceMarkerStringProperty, labelOptions),
      checkboxOptions("showCoincidenceMarkerCheckbox"),
    );

    super({
      align: "left",
      spacing: 12,
      children: [header, startMagnifiedCheckbox, showTrueValueCheckbox, showCoincidenceMarkerCheckbox],
    });
  }
}

VernierScalesNamespace.register("VernierScalesPreferencesNode", VernierScalesPreferencesNode);
