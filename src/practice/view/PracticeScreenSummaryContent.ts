/**
 * PracticeScreenSummaryContent.ts
 *
 * The accessible screen summary for the Practice screen.
 *
 * Note what it does *not* say: the reading. The summary names the question, the
 * scale and the tally, because a screen-reader user needs to know where they are
 * — but reading the instrument is the exercise, and the live description is the
 * one place it would be trivial to give the answer away.
 */

import { PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { createScaleNameProperty } from "../../common/view/readingProperties.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { PracticeModel } from "../model/PracticeModel.js";

export class PracticeScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: PracticeModel) {
    const a11y = StringManager.getInstance().getPracticeA11yStrings();
    const strings = StringManager.getInstance().getPracticeStrings();

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsStringProperty, {
        asked: model.askedCountProperty,
        scale: createScaleNameProperty(model.scale.specProperty),
        tally: new PatternStringProperty(strings.tallyPatternStringProperty, {
          correct: model.correctCountProperty,
          asked: model.askedCountProperty,
        }),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
