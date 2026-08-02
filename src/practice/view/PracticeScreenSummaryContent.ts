/**
 * PracticeScreenSummaryContent.ts
 *
 * The accessible screen summary for the Practice screen.
 *
 * The current details follow the game's phase, because "level 2, challenge 3 of
 * 5" is what a screen-reader user needs when they arrive mid-level, and none of
 * it exists yet while they are still choosing a level.
 *
 * Note what the summary never says: the reading. Reading the instrument is the
 * exercise, and the live description is the one place it would be trivial to
 * give the answer away.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { createScaleNameProperty } from "../../common/view/readingProperties.js";
import { StringManager } from "../../i18n/StringManager.js";
import { CHALLENGES_PER_LEVEL, GameState, PERFECT_SCORE, type PracticeModel } from "../model/PracticeModel.js";

export class PracticeScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: PracticeModel) {
    const a11y = StringManager.getInstance().getPracticeA11yStrings();

    const challengeDetails = new PatternStringProperty(a11y.currentDetails.challengeStringProperty, {
      level: model.levelNumberProperty,
      challenge: model.challengeNumberProperty,
      total: CHALLENGES_PER_LEVEL,
      scale: createScaleNameProperty(model.scale.specProperty),
      score: model.scoreProperty,
      perfect: PERFECT_SCORE,
    });

    const levelCompletedDetails = new PatternStringProperty(a11y.currentDetails.levelCompletedStringProperty, {
      level: model.levelNumberProperty,
      score: model.scoreProperty,
      perfect: PERFECT_SCORE,
    });

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new DerivedProperty(
        [
          model.gameStateProperty,
          a11y.currentDetails.levelSelectionStringProperty,
          challengeDetails,
          levelCompletedDetails,
        ],
        (state, levelSelection, challenge, levelCompleted) => {
          if (state === GameState.LEVEL_SELECTION) {
            return levelSelection;
          }
          return state === GameState.LEVEL_COMPLETED ? levelCompleted : challenge;
        },
      ),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
