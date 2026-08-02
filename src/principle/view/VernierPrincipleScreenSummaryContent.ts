/**
 * VernierPrincipleScreenSummaryContent.ts
 *
 * The accessible screen summary for the Vernier Principle screen.
 *
 * The "current details" paragraph is live, and it carries more of the load here
 * than in a typical sim: reading a vernier is a visual act, and a screen-reader
 * user cannot judge coincidence by looking. Naming which line coincides, and the
 * two numbers that combine into the reading, gives them the same information a
 * sighted user extracts from the marks.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import {
  createLeastCountStringProperty,
  createMainPartStringProperty,
  createReadingStringProperty,
} from "../../common/view/readingProperties.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VernierScalesPreferencesModel } from "../../preferences/VernierScalesPreferencesModel.js";
import type { VernierPrincipleModel } from "../model/VernierPrincipleModel.js";

export class VernierPrincipleScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: VernierPrincipleModel, preferences: VernierScalesPreferencesModel) {
    const a11y = StringManager.getInstance().getVernierPrincipleA11yStrings();

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: new DerivedProperty(
        [
          preferences.showVernierGeometryProperty,
          a11y.screenSummary.controlAreaStringProperty,
          a11y.screenSummary.controlAreaWithGeometryStringProperty,
        ],
        (showGeometry, without, withGeometry) => (showGeometry ? withGeometry : without),
      ),
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsStringProperty, {
        divisions: model.divisionsProperty,
        leastCount: createLeastCountStringProperty(model.scale.specProperty),
        main: createMainPartStringProperty(model.scale.mainDivisionsReadProperty, model.scale.specProperty),
        index: model.scale.vernierLabelReadProperty,
        reading: createReadingStringProperty(model.scale.readingTicksProperty, model.scale.specProperty),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
