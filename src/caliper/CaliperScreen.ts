/**
 * CaliperScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createCaliperIcon() in src/common/VernierScalesScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createCaliperIcon } from "../common/VernierScalesScreenIcons.js";
import type { VernierScalesPreferencesModel } from "../preferences/VernierScalesPreferencesModel.js";
import VernierScalesColors from "../VernierScalesColors.js";
import { CaliperModel } from "./model/CaliperModel.js";
import { CaliperKeyboardHelpContent } from "./view/CaliperKeyboardHelpContent.js";
import { CaliperScreenView } from "./view/CaliperScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type CaliperScreenOptions = ScreenOptions & { tandem: Tandem };

export class CaliperScreen extends Screen<CaliperModel, CaliperScreenView> {
  public constructor(preferences: VernierScalesPreferencesModel, options: CaliperScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new CaliperModel(),
      // View factory — receives the model instance
      (model) =>
        new CaliperScreenView(model, preferences, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<CaliperScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VernierScalesColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new CaliperKeyboardHelpContent(),
          homeScreenIcon: createCaliperIcon(),
          navigationBarIcon: createCaliperIcon(),
        },
        options,
      ),
    );
  }
}
