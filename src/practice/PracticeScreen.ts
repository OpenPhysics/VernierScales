/**
 * PracticeScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createPracticeIcon() in src/common/VernierScalesScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createPracticeIcon } from "../common/VernierScalesScreenIcons.js";
import type { VernierScalesPreferencesModel } from "../preferences/VernierScalesPreferencesModel.js";
import VernierScalesColors from "../VernierScalesColors.js";
import { PracticeModel } from "./model/PracticeModel.js";
import { PracticeKeyboardHelpContent } from "./view/PracticeKeyboardHelpContent.js";
import { PracticeScreenView } from "./view/PracticeScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type PracticeScreenOptions = ScreenOptions & { tandem: Tandem };

export class PracticeScreen extends Screen<PracticeModel, PracticeScreenView> {
  public constructor(preferences: VernierScalesPreferencesModel, options: PracticeScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new PracticeModel(),
      // View factory — receives the model instance
      (model) =>
        new PracticeScreenView(model, preferences, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<PracticeScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: VernierScalesColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new PracticeKeyboardHelpContent(),
          homeScreenIcon: createPracticeIcon(),
          navigationBarIcon: createPracticeIcon(),
        },
        options,
      ),
    );
  }
}
