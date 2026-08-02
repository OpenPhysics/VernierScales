/**
 * VernierPrincipleScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createVernierPrincipleIcon() in src/common/VernierScalesScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createVernierPrincipleIcon } from "../common/VernierScalesScreenIcons.js";
import type { VernierScalesPreferencesModel } from "../preferences/VernierScalesPreferencesModel.js";
import VernierScalesColors from "../VernierScalesColors.js";
import { VernierPrincipleModel } from "./model/VernierPrincipleModel.js";
import { VernierPrincipleKeyboardHelpContent } from "./view/VernierPrincipleKeyboardHelpContent.js";
import { VernierPrincipleScreenView } from "./view/VernierPrincipleScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type VernierPrincipleScreenOptions = ScreenOptions & { tandem: Tandem };

export class VernierPrincipleScreen extends Screen<VernierPrincipleModel, VernierPrincipleScreenView> {
  public constructor(preferences: VernierScalesPreferencesModel, options: VernierPrincipleScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new VernierPrincipleModel(),
      // View factory — receives the model instance
      (model) =>
        new VernierPrincipleScreenView(model, preferences, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<VernierPrincipleScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VernierScalesColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VernierPrincipleKeyboardHelpContent(),
          homeScreenIcon: createVernierPrincipleIcon(),
          navigationBarIcon: createVernierPrincipleIcon(),
        },
        options,
      ),
    );
  }
}
