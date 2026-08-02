/**
 * PracticeScreenView.ts
 *
 * A drill. The instrument is set to a value, you read it, you type it, the sim
 * tells you whether you were right.
 *
 * Deliberately plain: no score to chase, no levels to unlock, no celebration.
 * The tally is there so a student can see themselves improving and for no other
 * reason, and it disappears on reset along with everything else.
 *
 * The scales here are not draggable. On every other screen moving the vernier is
 * the point; here it would let a student walk the instrument to a round number
 * instead of reading the one in front of them.
 */

import { DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, TextPushButton } from "scenerystack/sun";
import { ReadingFormat } from "../../common/model/VernierScaleSpec.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../../common/VernierScalesButtonOptions.js";
import { VernierScalesPanel } from "../../common/VernierScalesPanel.js";
import { createReadingStringProperty, createScaleNameProperty } from "../../common/view/readingProperties.js";
import { ScaleViewsNode } from "../../common/view/ScaleViewsNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VernierScalesPreferencesModel } from "../../preferences/VernierScalesPreferencesModel.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import { CONTROL_PANEL_WIDTH, SCREEN_VIEW_MARGIN } from "../../VernierScalesConstants.js";
import { ALL_PRACTICE_LEVELS, AnswerState, type PracticeLevel, type PracticeModel } from "../model/PracticeModel.js";
import { AnswerFieldNode } from "./AnswerFieldNode.js";
import { PracticeScreenSummaryContent } from "./PracticeScreenSummaryContent.js";

export type PracticeScreenViewOptions = ScreenViewOptions;

/** A control label in the panel's text colour. */
const panelLabel = (stringProperty: TReadOnlyProperty<string>, size = 13): Text =>
  new Text(stringProperty, { font: new PhetFont(size), fill: VernierScalesColors.textColorProperty });

export class PracticeScreenView extends ScreenView {
  public constructor(
    model: PracticeModel,
    preferences: VernierScalesPreferencesModel,
    providedOptions?: PracticeScreenViewOptions,
  ) {
    const options = optionize<PracticeScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new PracticeScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getPracticeStrings();
    const a11y = StringManager.getInstance().getPracticeA11yStrings();

    // ── The question ──────────────────────────────────────────────────────────
    const promptText = new Text(strings.promptStringProperty, {
      font: new PhetFont({ size: 17, weight: "bold" }),
      fill: VernierScalesColors.textColorProperty,
      left: SCREEN_VIEW_MARGIN,
      top: 64,
    });
    this.addChild(promptText);

    const scaleNameText = new Text(createScaleNameProperty(model.scale.specProperty), {
      font: new PhetFont(13),
      fill: VernierScalesColors.textColorProperty,
      left: SCREEN_VIEW_MARGIN,
      top: promptText.bottom + 4,
    });
    this.addChild(scaleNameText);

    const scaleViews = new ScaleViewsNode(model.scale, {
      interactive: false,
      magnifiedVisibleProperty: preferences.startMagnifiedProperty,
      highlightCoincidence: false,
      left: SCREEN_VIEW_MARGIN,
      top: scaleNameText.bottom + 16,
    });
    this.addChild(scaleViews);

    // The zero-error tier needs saying out loud, or a student reads the scale
    // correctly and is marked wrong for not knowing there was a trap.
    const zeroErrorPrompt = new Text(strings.zeroErrorPromptStringProperty, {
      font: new PhetFont(13),
      fill: VernierScalesColors.coincidenceColorProperty,
      maxWidth: 500,
      left: SCREEN_VIEW_MARGIN,
      top: scaleViews.bottom + 12,
      visibleProperty: new DerivedProperty([model.scale.zeroErrorTicksProperty], (ticks) => ticks !== 0),
    });
    this.addChild(zeroErrorPrompt);

    // ── The answer ────────────────────────────────────────────────────────────
    const answerField = new AnswerFieldNode(model.answerTextProperty, {
      accessibleName: a11y.controls.answerStringProperty,
      accessibleHelpText: a11y.controls.answerHelpStringProperty,
    });

    const checkButton = new TextPushButton(strings.checkStringProperty, {
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      textNodeOptions: { font: new PhetFont(15), fill: LIGHT_SURFACE_TEXT_FILL },
      accessibleName: a11y.controls.checkStringProperty,
      listener: () => model.checkAnswer(),
    });

    const newQuestionButton = new TextPushButton(strings.newQuestionStringProperty, {
      ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
      textNodeOptions: { font: new PhetFont(15), fill: LIGHT_SURFACE_TEXT_FILL },
      accessibleName: a11y.controls.newQuestionStringProperty,
      listener: () => model.newQuestion(),
    });

    // Only shown for fractional-inch questions, where the expected notation is
    // not something a student can be assumed to guess.
    const fractionHint = new Text(strings.fractionHintStringProperty, {
      font: new PhetFont(11),
      fill: VernierScalesColors.textColorProperty,
      visibleProperty: new DerivedProperty(
        [model.scale.specProperty],
        (spec) => spec.format === ReadingFormat.FRACTIONAL,
      ),
    });

    // ── Feedback ──────────────────────────────────────────────────────────────
    const feedbackText = new Text(
      new DerivedProperty(
        [
          model.answerStateProperty,
          strings.correctStringProperty,
          strings.incorrectStringProperty,
          strings.unparseableStringProperty,
        ],
        (state, correct, incorrect, unparseable) => {
          switch (state) {
            case AnswerState.CORRECT:
              return correct;
            case AnswerState.INCORRECT:
              return incorrect;
            case AnswerState.UNPARSEABLE:
              return unparseable;
            case AnswerState.PENDING:
              return "";
          }
        },
      ),
      {
        font: new PhetFont({ size: 15, weight: "bold" }),
        maxWidth: 420,
        fill: new DerivedProperty(
          [
            model.answerStateProperty,
            VernierScalesColors.correctColorProperty,
            VernierScalesColors.incorrectColorProperty,
          ],
          (state, correct, incorrect) => (state === AnswerState.CORRECT ? correct : incorrect),
        ),
      },
    );

    // The answer is revealed only once it has been got right, so that a wrong
    // attempt sends the student back to the scale rather than to the answer.
    const revealText = new Text(
      new PatternStringProperty(strings.revealPatternStringProperty, {
        reading: createReadingStringProperty(model.scale.readingTicksProperty, model.scale.specProperty),
      }),
      {
        font: new PhetFont(14),
        fill: VernierScalesColors.textColorProperty,
        visibleProperty: new DerivedProperty([model.answerStateProperty], (state) => state === AnswerState.CORRECT),
      },
    );

    // The visual feedback is a colour change and a line of text, neither of which
    // a screen reader announces on its own. Speaking the verdict is what makes
    // the drill usable without sight — and the correct-answer response repeats
    // the reading, which the visible text also does only once it is right.
    model.answerStateProperty.lazyLink((state) => {
      if (state === AnswerState.PENDING) {
        return;
      }
      const responses = a11y.responses;
      if (state === AnswerState.CORRECT) {
        this.addAccessibleResponse(
          new PatternStringProperty(responses.correctStringProperty, {
            reading: createReadingStringProperty(model.scale.readingTicksProperty, model.scale.specProperty),
          }).value,
        );
      } else if (state === AnswerState.INCORRECT) {
        this.addAccessibleResponse(responses.incorrectStringProperty.value);
      } else {
        this.addAccessibleResponse(responses.unparseableStringProperty.value);
      }
    });

    const answerRow = new HBox({
      spacing: 10,
      align: "center",
      children: [answerField, checkButton, newQuestionButton],
    });

    const answerPanel = new VernierScalesPanel(
      new VBox({
        align: "left",
        spacing: 9,
        children: [panelLabel(strings.yourAnswerStringProperty, 14), answerRow, fractionHint, feedbackText, revealText],
      }),
      {
        left: SCREEN_VIEW_MARGIN,
        top: scaleViews.bottom + 44,
      },
    );
    this.addChild(answerPanel);

    // ── Level selector and tally ──────────────────────────────────────────────
    const levelLabels: Record<PracticeLevel, TReadOnlyProperty<string>> = {
      metric: strings.levels.metricStringProperty,
      imperial: strings.levels.imperialStringProperty,
      zeroError: strings.levels.zeroErrorStringProperty,
    };
    const levelRadioGroup = new AquaRadioButtonGroup(
      model.levelProperty,
      ALL_PRACTICE_LEVELS.map((level) => ({
        value: level,
        createNode: () => panelLabel(levelLabels[level]),
      })),
      {
        orientation: "vertical",
        align: "left",
        spacing: 7,
        accessibleName: a11y.controls.levelStringProperty,
        radioButtonOptions: { radius: 8 },
      },
    );

    const tallyText = new Text(
      new PatternStringProperty(strings.tallyPatternStringProperty, {
        correct: model.correctCountProperty,
        asked: model.askedCountProperty,
      }),
      { font: new PhetFont(13), fill: VernierScalesColors.textColorProperty },
    );

    const controlPanel = new VernierScalesPanel(
      new VBox({
        align: "left",
        spacing: 12,
        children: [panelLabel(strings.levelStringProperty, 14), levelRadioGroup, tallyText],
      }),
      {
        right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
        top: 64,
        minWidth: CONTROL_PANEL_WIDTH,
      },
    );
    this.addChild(controlPanel);

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(resetAllButton);

    this.addChild(
      new Node({
        pdomOrder: [answerField, checkButton, newQuestionButton, levelRadioGroup, resetAllButton],
      }),
    );
  }

  public reset(): void {
    // No view-side state to reset; everything on screen derives from the model.
  }
}
