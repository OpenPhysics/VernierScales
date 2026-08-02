/**
 * PracticeModel.ts
 *
 * A drill: the sim sets an instrument to a value, the student reads it and types
 * the answer, the sim says whether that is right.
 *
 * Deliberately *not* a game — no levels to unlock, no timer, no score to chase.
 * It keeps a running tally only so a student can tell whether they are getting
 * better, and that tally resets with everything else.
 *
 * ── Why generated values are exactly readable ─────────────────────────────────
 *
 * Every question snaps the measurement to a whole number of least counts. A real
 * caliper does not oblige, but a question whose true answer falls between two
 * readable values has no correct response to type, which would be marking a
 * student wrong for the instrument's limitations rather than their own. The
 * Caliper screen is where the ±½ least count error is taught; here it would only
 * be noise.
 */

import { NumberProperty, Property, StringProperty } from "scenerystack/axon";
import { dotRandom } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
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

/** How hard the questions are, and which skill each tier is drilling. */
export const PracticeLevel = {
  /** Metric calipers at three different least counts. */
  METRIC: "metric",
  /** Imperial, both decimal thousandths and reduced fractions of an inch. */
  IMPERIAL: "imperial",
  /** Metric again, but the instrument is miscalibrated and must be corrected. */
  ZERO_ERROR: "zeroError",
} as const;

export type PracticeLevel = (typeof PracticeLevel)[keyof typeof PracticeLevel];

/** Every level, in the order the selector lists them. */
export const ALL_PRACTICE_LEVELS: readonly PracticeLevel[] = [
  PracticeLevel.METRIC,
  PracticeLevel.IMPERIAL,
  PracticeLevel.ZERO_ERROR,
] as const;

/** How the student's current answer stands. */
export const AnswerState = {
  /** Not checked yet. */
  PENDING: "pending",
  /** Checked and right. */
  CORRECT: "correct",
  /** Checked and wrong. */
  INCORRECT: "incorrect",
  /** Checked, but the text was not a reading at all. */
  UNPARSEABLE: "unparseable",
} as const;

export type AnswerState = (typeof AnswerState)[keyof typeof AnswerState];

/** Which scales each level draws its questions from. */
const LEVEL_SPECS: Record<PracticeLevel, readonly VernierScaleSpec[]> = {
  [PracticeLevel.METRIC]: [METRIC_TENTH, METRIC_TWENTIETH, METRIC_FIFTIETH],
  [PracticeLevel.IMPERIAL]: [INCH_THOU, INCH_128],
  [PracticeLevel.ZERO_ERROR]: [METRIC_TENTH, METRIC_FIFTIETH],
};

/**
 * Keep generated questions clear of the very ends of the scale, where the vernier
 * would hang off the end of the main scale and there would be nothing to read
 * against.
 */
const USABLE_RANGE_FRACTION = 0.35;

export class PracticeModel implements TModel {
  /** The instrument being read. Its spec changes with every question. */
  public readonly scale = new VernierScaleModel(METRIC_FIFTIETH, 0);

  /** Which tier of question is being asked. */
  public readonly levelProperty = new Property<PracticeLevel>(PracticeLevel.METRIC);

  /** What the student has typed. */
  public readonly answerTextProperty = new StringProperty("");

  /** How the typed answer stands. */
  public readonly answerStateProperty = new Property<AnswerState>(AnswerState.PENDING);

  /** How many questions have been answered correctly on the first check. */
  public readonly correctCountProperty = new NumberProperty(0);

  /** How many questions have been asked. */
  public readonly askedCountProperty = new NumberProperty(0);

  /** Whether the current question has already been checked once. */
  private hasBeenChecked = false;

  public constructor() {
    this.levelProperty.lazyLink(() => this.newQuestion());
    this.newQuestion();
  }

  /**
   * Set up a fresh question: pick a scale for the level, a readable value, and —
   * on the zero-error tier — a miscalibration the student must undo.
   */
  public newQuestion(): void {
    const level = this.levelProperty.value;
    const spec = dotRandom.sample(LEVEL_SPECS[level]);

    this.scale.specProperty.value = spec;

    // A zero error must be applied before the measurement is chosen, so that the
    // *displayed* offset — not the true size — is what lands on a readable value.
    this.scale.zeroErrorTicksProperty.value = level === PracticeLevel.ZERO_ERROR ? nonZeroErrorTicks() : 0;

    const usableRange = canonicalRange(spec) * USABLE_RANGE_FRACTION;
    this.scale.setMeasurement(dotRandom.nextDouble() * usableRange);
    this.scale.snapToReadable();

    this.answerTextProperty.value = "";
    this.answerStateProperty.value = AnswerState.PENDING;
    this.hasBeenChecked = false;
    this.askedCountProperty.value += 1;
  }

  /**
   * Mark the typed answer. Only the first check on a question counts towards the
   * tally, so that retrying after a wrong answer is free — the point is to learn
   * the reading, not to protect a score.
   *
   * Text that is not a reading at all is deliberately *not* treated as an
   * attempt. A mistyped answer is a slip of the fingers, not a misread
   * instrument, and the tally is meant to reflect whether a student can read a
   * vernier — so the early return here is load-bearing, not an oversight.
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
    this.answerStateProperty.value = isCorrect ? AnswerState.CORRECT : AnswerState.INCORRECT;

    if (isCorrect && !this.hasBeenChecked) {
      this.correctCountProperty.value += 1;
    }
    this.hasBeenChecked = true;
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
    this.levelProperty.reset();
    this.correctCountProperty.reset();
    this.askedCountProperty.reset();
    this.scale.reset();
    this.newQuestion();

    // newQuestion counts the question it just set up; a reset should start from
    // "none asked yet" plus the one now on screen.
    this.askedCountProperty.value = 1;
  }

  /** Nothing here integrates; the screen is entirely user-driven. */
  public step(_dt: number): void {
    // Intentionally empty.
  }
}

/** A miscalibration of at least one least count, either sign. */
const nonZeroErrorTicks = (): number => {
  const magnitude = dotRandom.nextIntBetween(1, MAX_ZERO_ERROR_TICKS);
  return dotRandom.nextBoolean() ? magnitude : -magnitude;
};
