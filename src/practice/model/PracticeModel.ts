/**
 * PracticeModel.ts
 *
 * The Practice screen as a PhET game (the `vegas` pattern): choose a level, work
 * through a fixed number of challenges, earn points, see the level result.
 *
 * ── The state machine ─────────────────────────────────────────────────────────
 *
 * Everything the view shows is a function of {@link GameState}. The transitions
 * are the standard vegas ones:
 *
 *   LEVEL_SELECTION ──startLevel──▶ CHALLENGE
 *   CHALLENGE ──checkAnswer──▶ CORRECT ─────────────┐
 *   CHALLENGE ──checkAnswer──▶ TRY_AGAIN ──tryAgain──▶ CHALLENGE
 *   CHALLENGE ──checkAnswer──▶ SHOW_ANSWER ──showAnswer──▶ ANSWER_REVEALED ─┐
 *   CORRECT / ANSWER_REVEALED ──next──▶ CHALLENGE, or LEVEL_COMPLETED on the last
 *   LEVEL_COMPLETED ──returnToLevelSelection──▶ LEVEL_SELECTION
 *
 * ── Scoring ───────────────────────────────────────────────────────────────────
 *
 * Two points for a reading got right first time, one for right on the second
 * attempt, none after that — the scoring every PhET game uses. A perfect level
 * is therefore {@link PERFECT_SCORE}.
 *
 * Text that is not a reading at all is deliberately *not* an attempt: it costs
 * no points and does not advance the state machine. A mistyped answer is a slip
 * of the fingers, not a misread instrument, and the score is meant to reflect
 * whether a student can read a vernier — so the early return in
 * {@link PracticeModel.checkAnswer} is load-bearing, not an oversight.
 *
 * ── Why generated values are exactly readable ─────────────────────────────────
 *
 * Every challenge snaps the measurement to a whole number of least counts. A real
 * caliper does not oblige, but a challenge whose true answer falls between two
 * readable values has no correct response to type, which would be marking a
 * student wrong for the instrument's limitations rather than their own. The
 * Caliper screen is where the ±½ least count error is taught; here it would only
 * be noise.
 */

import {
  BooleanProperty,
  DerivedProperty,
  EnumerationProperty,
  NumberProperty,
  type ReadOnlyProperty,
  StringProperty,
} from "scenerystack/axon";
import { dotRandom } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { GameTimer } from "scenerystack/vegas";
import { parseReading } from "../../common/model/readingFormat.js";
import { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import {
  canonicalRange,
  INCH_128,
  INCH_THOU,
  METRIC_FIFTIETH,
  METRIC_TENTH,
  METRIC_TWENTIETH,
  ticksToCanonical,
  type VernierScaleSpec,
} from "../../common/model/VernierScaleSpec.js";
import { MAX_ZERO_ERROR_TICKS } from "../../VernierScalesConstants.js";

/** How many readings make up one level. */
export const CHALLENGES_PER_LEVEL = 5;

/** Points for a reading got right without a wrong attempt. */
export const POINTS_FIRST_ATTEMPT = 2;

/** Points for a reading got right on the second attempt. */
export const POINTS_SECOND_ATTEMPT = 1;

/** The score for a level answered entirely first time. */
export const PERFECT_SCORE = CHALLENGES_PER_LEVEL * POINTS_FIRST_ATTEMPT;

/** How many stars a level result and a level button are worth. */
export const NUMBER_OF_STARS = 3;

/**
 * How hard the challenges are, and which skill each level is drilling.
 *
 * `levelNumber` is 1-based because that is what vegas's level-selection UI and
 * the `gameLevels` query parameter expect.
 */
export class PracticeLevel extends EnumerationValue {
  /** Metric calipers at three different least counts. */
  public static readonly METRIC = new PracticeLevel(1);

  /** Imperial, both decimal thousandths and reduced fractions of an inch. */
  public static readonly IMPERIAL = new PracticeLevel(2);

  /** Metric again, but the instrument is miscalibrated and must be corrected. */
  public static readonly ZERO_ERROR = new PracticeLevel(3);

  public static readonly enumeration = new Enumeration(PracticeLevel);

  /** 1-based, as vegas numbers levels. */
  public readonly levelNumber: number;

  public constructor(levelNumber: number) {
    super();
    this.levelNumber = levelNumber;
  }

  /** Every level, ordered as vegas expects: by increasing level number. */
  public static levelsInOrder(): PracticeLevel[] {
    return [...PracticeLevel.enumeration.values].sort((a, b) => a.levelNumber - b.levelNumber);
  }

  /** The level with the given 1-based number, for the `gameLevels` query parameter. */
  public static forNumber(levelNumber: number): PracticeLevel {
    const level = PracticeLevel.enumeration.values.find((value) => value.levelNumber === levelNumber);
    if (level === undefined) {
      throw new Error(`No PracticeLevel numbered ${levelNumber}`);
    }
    return level;
  }
}

/** Which phase of the game is on screen. */
export class GameState extends EnumerationValue {
  /** Choosing which level to play. */
  public static readonly LEVEL_SELECTION = new GameState();

  /** A challenge is shown and the answer has not been checked. */
  public static readonly CHALLENGE = new GameState();

  /** Wrong on the first attempt; the student may try again. */
  public static readonly TRY_AGAIN = new GameState();

  /** Wrong on the second attempt; the only way on is to reveal the reading. */
  public static readonly SHOW_ANSWER = new GameState();

  /** Right; waiting for the student to move on. */
  public static readonly CORRECT = new GameState();

  /** The reading has been revealed after two wrong attempts. */
  public static readonly ANSWER_REVEALED = new GameState();

  /** All the challenges in the level have been played. */
  public static readonly LEVEL_COMPLETED = new GameState();

  public static readonly enumeration = new Enumeration(GameState);
}

/** How the student's current answer stands. Drives the feedback message. */
export class AnswerState extends EnumerationValue {
  /** Not checked yet. */
  public static readonly PENDING = new AnswerState();

  /** Checked and right. */
  public static readonly CORRECT = new AnswerState();

  /** Checked and wrong. */
  public static readonly INCORRECT = new AnswerState();

  /** Checked, but the text was not a reading at all. */
  public static readonly UNPARSEABLE = new AnswerState();

  public static readonly enumeration = new Enumeration(AnswerState);
}

/** Which scales each level draws its challenges from. */
const specsForLevel = (level: PracticeLevel): readonly VernierScaleSpec[] => {
  switch (level) {
    case PracticeLevel.METRIC:
      return [METRIC_TENTH, METRIC_TWENTIETH, METRIC_FIFTIETH];
    case PracticeLevel.IMPERIAL:
      return [INCH_THOU, INCH_128];
    case PracticeLevel.ZERO_ERROR:
      return [METRIC_TENTH, METRIC_FIFTIETH];
    default:
      throw new Error(`Unhandled PracticeLevel: ${level}`);
  }
};

/**
 * Keep generated challenges clear of the very ends of the scale, where the vernier
 * would hang off the end of the main scale and there would be nothing to read
 * against.
 */
const USABLE_RANGE_FRACTION = 0.35;

export class PracticeModel implements TModel {
  /** The instrument being read. Its spec changes with every challenge. */
  public readonly scale = new VernierScaleModel(METRIC_FIFTIETH, 0);

  /** Which phase of the game is on screen; everything the view shows follows this. */
  public readonly gameStateProperty = new EnumerationProperty(GameState.LEVEL_SELECTION);

  /** The level being played. Meaningless while in {@link GameState.LEVEL_SELECTION}. */
  public readonly levelProperty = new EnumerationProperty(PracticeLevel.METRIC);

  /** The level being played, as the 1-based number vegas's status bar wants. */
  public readonly levelNumberProperty: ReadOnlyProperty<number>;

  /** Points earned so far in this level. */
  public readonly scoreProperty = new NumberProperty(0);

  /** Best score ever reached on each level, shown on the level-selection buttons. */
  public readonly bestScoreProperties: ReadonlyMap<PracticeLevel, NumberProperty>;

  /** Which challenge of the level is on screen, 1-based. */
  public readonly challengeNumberProperty = new NumberProperty(1);

  /** How many challenges the level has. Constant, but the status bar wants a Property. */
  public readonly numberOfChallengesProperty = new NumberProperty(CHALLENGES_PER_LEVEL);

  /** How many times the current challenge has been checked with a real reading. */
  public readonly attemptsProperty = new NumberProperty(0);

  /** Points earned on the current challenge, for the smiley face. */
  public readonly pointsAwardedProperty = new NumberProperty(0);

  /** Whether the timer is shown and recorded. Off by default, as in PhET games. */
  public readonly timerEnabledProperty = new BooleanProperty(false);

  /** Whether the level just finished set a new best time. */
  public readonly isNewBestTimeProperty = new BooleanProperty(false);

  /** Times the level clock. */
  public readonly gameTimer = new GameTimer();

  /** What the student has typed. */
  public readonly answerTextProperty = new StringProperty("");

  /** How the typed answer stands. */
  public readonly answerStateProperty = new EnumerationProperty(AnswerState.PENDING);

  /**
   * Best time on each level, in seconds, or null if the level has never been
   * played perfectly. Following PhET convention a time is only recorded for a
   * perfect score, so that rushing through wrong answers cannot set a record.
   */
  private readonly bestTimes = new Map<PracticeLevel, number | null>();

  public constructor() {
    this.levelNumberProperty = new DerivedProperty([this.levelProperty], (level) => level.levelNumber);

    const bestScores = new Map<PracticeLevel, NumberProperty>();
    for (const level of PracticeLevel.enumeration.values) {
      bestScores.set(level, new NumberProperty(0));
      this.bestTimes.set(level, null);
    }
    this.bestScoreProperties = bestScores;

    // Give the scale something readable to show behind the level-selection UI.
    this.newChallenge();
  }

  /** Start a level from the beginning: score zeroed, clock restarted, first challenge up. */
  public startLevel(level: PracticeLevel): void {
    this.levelProperty.value = level;
    this.scoreProperty.value = 0;
    this.challengeNumberProperty.value = 1;
    this.isNewBestTimeProperty.value = false;
    this.newChallenge();
    this.gameStateProperty.value = GameState.CHALLENGE;
    this.gameTimer.restart();
  }

  /**
   * Mark the typed answer.
   *
   * Text that is not a reading at all leaves the state machine where it was — see
   * the note at the top of this file.
   */
  public checkAnswer(): void {
    const spec = this.scale.specProperty.value;
    const parsed = parseReading(this.answerTextProperty.value, spec);

    if (parsed === null) {
      this.answerStateProperty.value = AnswerState.UNPARSEABLE;
      return;
    }

    // Both sides are whole numbers of least counts, so this is an exact
    // comparison and not a tolerance check.
    const isCorrect = Math.round(parsed) === this.scale.readingTicksProperty.value;
    const attempt = this.attemptsProperty.value + 1;
    this.attemptsProperty.value = attempt;

    if (isCorrect) {
      const points = attempt === 1 ? POINTS_FIRST_ATTEMPT : attempt === 2 ? POINTS_SECOND_ATTEMPT : 0;
      this.pointsAwardedProperty.value = points;
      this.scoreProperty.value += points;
      this.answerStateProperty.value = AnswerState.CORRECT;
      this.gameStateProperty.value = GameState.CORRECT;
    } else {
      this.pointsAwardedProperty.value = 0;
      this.answerStateProperty.value = AnswerState.INCORRECT;
      this.gameStateProperty.value = attempt === 1 ? GameState.TRY_AGAIN : GameState.SHOW_ANSWER;
    }
  }

  /**
   * Go back to the challenge after a first wrong attempt. The typed text is left
   * alone: the student is usually one line out and editing what they wrote is
   * quicker than retyping it.
   */
  public tryAgain(): void {
    this.answerStateProperty.value = AnswerState.PENDING;
    this.gameStateProperty.value = GameState.CHALLENGE;
  }

  /** Give up on the current challenge and show what it read. */
  public showAnswer(): void {
    this.gameStateProperty.value = GameState.ANSWER_REVEALED;
  }

  /** Move on: the next challenge, or the level result if that was the last one. */
  public next(): void {
    if (this.challengeNumberProperty.value < CHALLENGES_PER_LEVEL) {
      this.challengeNumberProperty.value += 1;
      this.newChallenge();
      this.gameStateProperty.value = GameState.CHALLENGE;
    } else {
      this.endLevel();
    }
  }

  /** Abandon the level in progress and go back to choosing one. */
  public returnToLevelSelection(): void {
    this.gameTimer.stop();
    this.answerTextProperty.value = "";
    this.answerStateProperty.value = AnswerState.PENDING;
    this.gameStateProperty.value = GameState.LEVEL_SELECTION;
  }

  /** Best score reached on a level, for the level-selection button. */
  public bestScoreProperty(level: PracticeLevel): NumberProperty {
    const property = this.bestScoreProperties.get(level);
    if (property === undefined) {
      throw new Error("No best-score Property for level");
    }
    return property;
  }

  /** Best time on a level in seconds, or null if it has never been played perfectly. */
  public bestTime(level: PracticeLevel): number | null {
    return this.bestTimes.get(level) ?? null;
  }

  /** The answer the student should have typed, in ticks. */
  public get expectedReadingTicks(): number {
    return this.scale.readingTicksProperty.value;
  }

  /** True size in canonical units, for revealing after a wrong answer. */
  public get expectedReadingValue(): number {
    return ticksToCanonical(this.scale.specProperty.value, this.scale.readingTicksProperty.value);
  }

  public reset(): void {
    this.gameTimer.reset();
    this.scoreProperty.reset();
    this.challengeNumberProperty.reset();
    this.attemptsProperty.reset();
    this.pointsAwardedProperty.reset();
    this.timerEnabledProperty.reset();
    this.isNewBestTimeProperty.reset();
    this.answerTextProperty.reset();
    this.answerStateProperty.reset();
    this.levelProperty.reset();
    this.scale.reset();

    for (const level of PracticeLevel.enumeration.values) {
      this.bestScoreProperty(level).reset();
      this.bestTimes.set(level, null);
    }

    this.newChallenge();
    this.gameStateProperty.reset();
  }

  /** Nothing here integrates; the screen is entirely user-driven. */
  public step(_dt: number): void {
    // Intentionally empty. GameTimer runs off the global step timer.
  }

  /**
   * Set up a fresh challenge: pick a scale for the level, a readable value, and —
   * on the zero-error level — a miscalibration the student must undo.
   *
   * Public so tests can draw many challenges without driving the state machine.
   */
  public newChallenge(): void {
    const level = this.levelProperty.value;
    const spec = dotRandom.sample([...specsForLevel(level)]);

    this.scale.specProperty.value = spec;

    // A zero error must be applied before the measurement is chosen, so that the
    // *displayed* offset — not the true size — is what lands on a readable value.
    this.scale.zeroErrorTicksProperty.value = level === PracticeLevel.ZERO_ERROR ? nonZeroErrorTicks() : 0;

    const usableRange = canonicalRange(spec) * USABLE_RANGE_FRACTION;
    this.scale.setMeasurement(dotRandom.nextDouble() * usableRange);
    this.scale.snapToReadable();

    this.answerTextProperty.value = "";
    this.answerStateProperty.value = AnswerState.PENDING;
    this.attemptsProperty.value = 0;
    this.pointsAwardedProperty.value = 0;
  }

  /** Stop the clock, bank any records, and show the level result. */
  private endLevel(): void {
    this.gameTimer.stop();

    const level = this.levelProperty.value;
    const score = this.scoreProperty.value;
    const bestScore = this.bestScoreProperty(level);
    if (score > bestScore.value) {
      bestScore.value = score;
    }

    // A time is only a record if the level was played perfectly; otherwise the
    // quickest route to a "best time" would be to answer everything wrong.
    if (score === PERFECT_SCORE) {
      const elapsed = this.gameTimer.elapsedTimeProperty.value;
      const previousBest = this.bestTime(level);
      this.isNewBestTimeProperty.value = previousBest === null || elapsed < previousBest;
      if (this.isNewBestTimeProperty.value) {
        this.bestTimes.set(level, elapsed);
      }
    } else {
      this.isNewBestTimeProperty.value = false;
    }

    this.gameStateProperty.value = GameState.LEVEL_COMPLETED;
  }
}

/** A miscalibration of at least one least count, either sign. */
const nonZeroErrorTicks = (): number => {
  const magnitude = dotRandom.nextIntBetween(1, MAX_ZERO_ERROR_TICKS);
  return dotRandom.nextBoolean() ? magnitude : -magnitude;
};
