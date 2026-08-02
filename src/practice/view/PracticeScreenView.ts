/**
 * PracticeScreenView.ts
 *
 * The Practice screen as a PhET game, built on `vegas`.
 *
 * The screen is three mutually exclusive things, chosen by the model's
 * {@link GameState}: choosing a level, playing a challenge, and looking at a
 * level result. This class owns that switch and the celebration around it — the
 * sounds, the falling stars, the level-result panel — and delegates the two
 * substantial layouts to {@link PracticeLevelSelectionNode} and
 * {@link PracticeChallengeNode}.
 *
 * The level result is built fresh each time rather than kept and re-shown:
 * vegas's LevelCompletedNode takes plain numbers, not Properties, so it is a
 * snapshot of a finished level by construction.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { PhetFont } from "scenerystack/scenery-phet";
import { RewardNode, ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { GameAudioPlayer, LevelCompletedNode } from "scenerystack/vegas";
import { StringManager } from "../../i18n/StringManager.js";
import type { VernierScalesPreferencesModel } from "../../preferences/VernierScalesPreferencesModel.js";
import { PANEL_CORNER_RADIUS } from "../../VernierScalesConstants.js";
import { GameState, NUMBER_OF_STARS, PERFECT_SCORE, type PracticeModel } from "../model/PracticeModel.js";
import { PracticeChallengeNode } from "./PracticeChallengeNode.js";
import { PracticeLevelSelectionNode } from "./PracticeLevelSelectionNode.js";
import { PracticeScreenSummaryContent } from "./PracticeScreenSummaryContent.js";

export type PracticeScreenViewOptions = ScreenViewOptions;

export class PracticeScreenView extends ScreenView {
  private readonly model: PracticeModel;
  private readonly levelSelectionNode: PracticeLevelSelectionNode;
  private readonly rewardNode: RewardNode;
  private readonly gameAudioPlayer = new GameAudioPlayer();

  /** The level result, alive only while one is on screen. */
  private levelCompletedNode: LevelCompletedNode | null = null;

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

    this.model = model;
    const gameState = model.gameStateProperty;
    const a11y = StringManager.getInstance().getPracticeA11yStrings();

    this.levelSelectionNode = new PracticeLevelSelectionNode(
      model,
      this.layoutBounds,
      () => {
        model.reset();
        this.reset();
      },
      this.tandem,
      {
        visibleProperty: new DerivedProperty([gameState], (state) => state === GameState.LEVEL_SELECTION),
      },
    );
    this.addChild(this.levelSelectionNode);

    const challengeNode = new PracticeChallengeNode(
      model,
      preferences,
      this.layoutBounds,
      this.visibleBoundsProperty,
      () => this.leaveLevel(),
      {
        visibleProperty: new DerivedProperty(
          [gameState],
          (state) => state !== GameState.LEVEL_SELECTION && state !== GameState.LEVEL_COMPLETED,
        ),
      },
    );
    this.addChild(challengeNode);

    // The status bar spans the visible bounds, so it lives outside the challenge
    // layout and is drawn over it.
    challengeNode.statusBar.visibleProperty = challengeNode.visibleProperty;
    this.addChild(challengeNode.statusBar);

    // Falling stars for a perfect level. Stepped by hand from this view's step,
    // so nothing animates while it is hidden.
    this.rewardNode = new RewardNode({ stepEmitter: null, visible: false });
    this.addChild(this.rewardNode);

    const levelCompletedResponse = new PatternStringProperty(a11y.responses.levelCompletedStringProperty, {
      score: model.scoreProperty,
      perfect: PERFECT_SCORE,
    });

    gameState.link((state) => {
      if (state === GameState.LEVEL_COMPLETED) {
        this.showLevelCompleted();
        this.addAccessibleResponse(levelCompletedResponse.value);
      } else {
        this.hideLevelCompleted();
      }
    });
  }

  /** Advance the falling stars, and only them. */
  public override step(dt: number): void {
    if (this.rewardNode.visible) {
      this.rewardNode.step(dt);
    }
  }

  public reset(): void {
    this.hideLevelCompleted();
  }

  /** Leave a level in progress, putting focus back on the button that started it. */
  private leaveLevel(): void {
    const level = this.model.levelProperty.value;
    this.model.returnToLevelSelection();
    this.levelSelectionNode.focusLevelButton(level);
  }

  /** Build and show the level result, with the sound and the stars it has earned. */
  private showLevelCompleted(): void {
    const model = this.model;
    const level = model.levelProperty.value;
    const score = model.scoreProperty.value;

    if (score === PERFECT_SCORE) {
      this.gameAudioPlayer.gameOverPerfectScore();
      this.rewardNode.visible = true;
    } else if (score === 0) {
      this.gameAudioPlayer.gameOverZeroScore();
    } else {
      this.gameAudioPlayer.gameOverImperfectScore();
    }

    this.levelCompletedNode = new LevelCompletedNode(
      level.levelNumber,
      score,
      PERFECT_SCORE,
      NUMBER_OF_STARS,
      model.timerEnabledProperty.value,
      model.gameTimer.elapsedTimeProperty.value,
      model.bestTime(level),
      model.isNewBestTimeProperty.value,
      () => this.leaveLevel(),
      {
        cornerRadius: PANEL_CORNER_RADIUS,
        buttonFont: new PhetFont(20),
        center: this.layoutBounds.center,
        contentMaxWidth: 400,
      },
    );
    this.addChild(this.levelCompletedNode);
  }

  /** Take the level result down and stop the stars. */
  private hideLevelCompleted(): void {
    this.rewardNode.visible = false;
    if (this.levelCompletedNode !== null) {
      this.removeChild(this.levelCompletedNode);
      this.levelCompletedNode.dispose();
      this.levelCompletedNode = null;
    }
  }
}
