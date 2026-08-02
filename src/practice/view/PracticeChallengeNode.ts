/**
 * PracticeChallengeNode.ts
 *
 * One challenge of the game: the instrument, the answer field, and the single
 * game button that is right for wherever the state machine has got to.
 *
 * ── Why only one button is ever visible ───────────────────────────────────────
 *
 * Check, Try Again, Show Answer and Next all occupy the same slot and take turns,
 * which is the vegas convention and the reason it is worth following: the button
 * in that slot is always the only move available, so there is never a question of
 * what to press next. They are held in a plain Node rather than a layout box so
 * that swapping one for another cannot shift anything around it.
 *
 * The scales here are not draggable, and the coincident line is not highlighted.
 * On every other screen moving the vernier is the point; here it would let a
 * student walk the instrument to a round number instead of reading the one in
 * front of them, and the highlight would simply hand over the answer.
 */

import { DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import type { Bounds2 } from "scenerystack/dot";
import { optionize } from "scenerystack/phet-core";
import { HBox, Node, type NodeOptions, Text, VBox } from "scenerystack/scenery";
import { FaceWithPointsNode, PhetFont } from "scenerystack/scenery-phet";
import { TextPushButton } from "scenerystack/sun";
import { ReadingFormat } from "../../common/model/VernierScaleSpec.js";
import { FLAT_RECTANGULAR_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/VernierScalesButtonOptions.js";
import { VernierScalesPanel } from "../../common/VernierScalesPanel.js";
import {
  createReadingStringProperty,
  createScaleNameProperty,
  createSignedReadingStringProperty,
} from "../../common/view/readingProperties.js";
import { ScaleViewsNode } from "../../common/view/ScaleViewsNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VernierScalesPreferencesModel } from "../../preferences/VernierScalesPreferencesModel.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import { SCREEN_VIEW_MARGIN } from "../../VernierScalesConstants.js";
import { AnswerState, CHALLENGES_PER_LEVEL, GameState, type PracticeModel } from "../model/PracticeModel.js";
import { AnswerFieldNode } from "./AnswerFieldNode.js";
import { PracticeStatusBar } from "./PracticeStatusBar.js";

export type PracticeChallengeNodeOptions = NodeOptions;

/** Everything below the status bar starts here. */
const CONTENT_TOP = PracticeStatusBar.BAR_HEIGHT + 14;

/** A game button: same font and flat chrome for all four. */
const gameButton = (
  label: TReadOnlyProperty<string>,
  accessibleName: TReadOnlyProperty<string>,
  listener: () => void,
  visibleProperty: TReadOnlyProperty<boolean>,
): TextPushButton =>
  new TextPushButton(label, {
    ...FLAT_RECTANGULAR_BUTTON_OPTIONS,
    textNodeOptions: { font: new PhetFont(15), fill: LIGHT_SURFACE_TEXT_FILL },
    accessibleName,
    listener,
    visibleProperty,
    left: 0,
    top: 0,
  });

export class PracticeChallengeNode extends Node {
  /** The status bar, kept separate so the screen can layer it above everything. */
  public readonly statusBar: PracticeStatusBar;

  public constructor(
    model: PracticeModel,
    preferences: VernierScalesPreferencesModel,
    layoutBounds: Bounds2,
    visibleBoundsProperty: TReadOnlyProperty<Bounds2>,
    startOver: () => void,
    providedOptions?: PracticeChallengeNodeOptions,
  ) {
    const options = optionize<PracticeChallengeNodeOptions, Record<string, never>, NodeOptions>()({}, providedOptions);
    super(options);

    const strings = StringManager.getInstance().getPracticeStrings();
    const a11y = StringManager.getInstance().getPracticeA11yStrings();
    const gameState = model.gameStateProperty;

    this.statusBar = new PracticeStatusBar(model, layoutBounds, visibleBoundsProperty, startOver);

    // ── The challenge ─────────────────────────────────────────────────────────
    const promptText = new Text(strings.promptStringProperty, {
      font: new PhetFont({ size: 17, weight: "bold" }),
      fill: VernierScalesColors.textColorProperty,
      maxWidth: 500,
      left: SCREEN_VIEW_MARGIN,
      top: CONTENT_TOP,
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
      top: scaleNameText.bottom + 14,
    });
    this.addChild(scaleViews);

    // The zero-error level needs the magnitude said out loud: the scales are
    // locked, so the student cannot close the jaws to discover it themselves.
    const zeroErrorPrompt = new Text(
      new PatternStringProperty(strings.zeroErrorPromptStringProperty, {
        value: createSignedReadingStringProperty(model.scale.zeroErrorTicksProperty, model.scale.specProperty),
      }),
      {
        font: new PhetFont(13),
        fill: VernierScalesColors.coincidenceColorProperty,
        maxWidth: 500,
        left: SCREEN_VIEW_MARGIN,
        top: scaleViews.bottom + 10,
        visibleProperty: new DerivedProperty([model.scale.zeroErrorTicksProperty], (ticks) => ticks !== 0),
      },
    );
    this.addChild(zeroErrorPrompt);

    // ── The answer ────────────────────────────────────────────────────────────
    const answerField = new AnswerFieldNode(model.answerTextProperty, {
      accessibleName: a11y.controls.answerStringProperty,
      accessibleHelpText: a11y.controls.answerHelpStringProperty,
    });

    const checkButton = gameButton(
      strings.checkStringProperty,
      a11y.controls.checkStringProperty,
      () => model.checkAnswer(),
      new DerivedProperty([gameState], (state) => state === GameState.CHALLENGE),
    );

    const tryAgainButton = gameButton(
      strings.tryAgainStringProperty,
      a11y.controls.tryAgainStringProperty,
      () => model.tryAgain(),
      new DerivedProperty([gameState], (state) => state === GameState.TRY_AGAIN),
    );

    const showAnswerButton = gameButton(
      strings.showAnswerStringProperty,
      a11y.controls.showAnswerStringProperty,
      () => model.showAnswer(),
      new DerivedProperty([gameState], (state) => state === GameState.SHOW_ANSWER),
    );

    const nextButton = gameButton(
      strings.nextStringProperty,
      a11y.controls.nextStringProperty,
      () => model.next(),
      new DerivedProperty([gameState], (state) => state === GameState.CORRECT || state === GameState.ANSWER_REVEALED),
    );

    const buttonSlot = new Node({ children: [checkButton, tryAgainButton, showAnswerButton, nextButton] });

    // Only shown for fractional-inch challenges, where the expected notation is
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
            default:
              throw new Error(`Unhandled AnswerState: ${state}`);
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

    // The reading is only spelled out once the challenge is over, so that a wrong
    // attempt sends the student back to the scale rather than to the answer.
    const readingStringProperty = createReadingStringProperty(
      model.scale.readingTicksProperty,
      model.scale.specProperty,
    );
    const revealText = new Text(
      new PatternStringProperty(strings.revealPatternStringProperty, { reading: readingStringProperty }),
      {
        font: new PhetFont(14),
        fill: VernierScalesColors.textColorProperty,
        visibleProperty: new DerivedProperty(
          [gameState],
          (state) => state === GameState.CORRECT || state === GameState.ANSWER_REVEALED,
        ),
      },
    );

    const answerPanel = new VernierScalesPanel(
      new VBox({
        align: "left",
        spacing: 9,
        children: [
          new Text(strings.yourAnswerStringProperty, {
            font: new PhetFont(14),
            fill: VernierScalesColors.textColorProperty,
          }),
          new HBox({ spacing: 10, align: "center", children: [answerField, buttonSlot] }),
          fractionHint,
          feedbackText,
          revealText,
        ],
      }),
      {
        left: SCREEN_VIEW_MARGIN,
        top: scaleViews.bottom + 42,
      },
    );
    this.addChild(answerPanel);

    // The smiley is anchored to the panel's top-left corner, which never moves.
    // The panel's own width and height change with the feedback it is showing, so
    // anchoring to its right edge or centre would make the face jump about.
    const faceNode = new FaceWithPointsNode({
      faceDiameter: 120,
      pointsAlignment: "rightBottom",
      pointsFont: new PhetFont({ size: 24, weight: "bold" }),
      pointsFill: VernierScalesColors.correctColorProperty,
      left: answerPanel.left + 520,
      top: answerPanel.top + 14,
      visibleProperty: new DerivedProperty(
        [model.answerStateProperty, gameState],
        (answerState, state) =>
          state !== GameState.CHALLENGE &&
          (answerState === AnswerState.CORRECT || answerState === AnswerState.INCORRECT),
      ),
    });
    this.addChild(faceNode);

    model.answerStateProperty.link((answerState) => {
      if (answerState === AnswerState.CORRECT) {
        faceNode.smile();
        faceNode.setPoints(model.pointsAwardedProperty.value);
      } else if (answerState === AnswerState.INCORRECT) {
        faceNode.frown();
        faceNode.setPoints(0);
      }
    });

    // The visual feedback is a colour change, a face and a line of text, none of
    // which a screen reader announces on its own. Speaking the verdict is what
    // makes the game playable without sight — and the correct-answer response
    // repeats the reading, which the visible text also does only once it is over.
    const correctResponse = new PatternStringProperty(a11y.responses.correctStringProperty, {
      reading: readingStringProperty,
      score: model.scoreProperty,
    });
    const revealedResponse = new PatternStringProperty(a11y.responses.revealedStringProperty, {
      reading: readingStringProperty,
    });

    model.answerStateProperty.lazyLink((answerState) => {
      if (answerState === AnswerState.CORRECT) {
        this.addAccessibleResponse(correctResponse.value);
      } else if (answerState === AnswerState.INCORRECT) {
        this.addAccessibleResponse(a11y.responses.incorrectStringProperty.value);
      } else if (answerState === AnswerState.UNPARSEABLE) {
        this.addAccessibleResponse(a11y.responses.unparseableStringProperty.value);
      }
    });

    const levelStartedResponse = new PatternStringProperty(a11y.responses.levelStartedStringProperty, {
      level: model.levelNumberProperty,
      total: CHALLENGES_PER_LEVEL,
    });

    gameState.lazyLink((state, previousState) => {
      if (state === GameState.ANSWER_REVEALED) {
        this.addAccessibleResponse(revealedResponse.value);
      } else if (state === GameState.CHALLENGE && previousState === GameState.LEVEL_SELECTION) {
        // Only on arrival from the level-selection screen: Try Again also lands
        // on CHALLENGE, and announcing the level again there would be noise.
        this.addAccessibleResponse(levelStartedResponse.value);
      }
    });

    this.pdomOrder = [answerField, checkButton, tryAgainButton, showAnswerButton, nextButton, this.statusBar];
  }
}
