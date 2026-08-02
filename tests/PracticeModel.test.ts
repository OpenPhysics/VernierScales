/**
 * PracticeModel.test.ts
 *
 * Tests for the Practice game.
 *
 * Two things are worth guarding here. The first is that every generated
 * challenge *has* a correct answer a student could type: the value must land on
 * a whole number of least counts, or the game is asking for something the
 * instrument cannot show. Because challenges are random, that is checked over
 * many draws rather than one.
 *
 * The second is the state machine and its scoring, where an off-by-one would
 * quietly hand out points for a reading got wrong twice.
 */

import { describe, expect, it } from "vitest";
import { formatReading } from "../src/common/model/readingFormat.js";
import { canonicalRange, ReadingFormat } from "../src/common/model/VernierScaleSpec.js";
import {
  AnswerState,
  CHALLENGES_PER_LEVEL,
  GameState,
  PERFECT_SCORE,
  POINTS_FIRST_ATTEMPT,
  POINTS_SECOND_ATTEMPT,
  PracticeLevel,
  PracticeModel,
} from "../src/practice/model/PracticeModel.js";

/** Type the exactly-correct answer for whatever challenge is on screen. */
const answerCorrectly = (model: PracticeModel): void => {
  const spec = model.scale.specProperty.value;
  const text = formatReading(model.scale.readingTicksProperty.value, spec, "en");

  // Strip the unit, which the field does not ask for.
  model.answerTextProperty.value = text.replace(" mm", "").replace(" in", "");
};

/** Type an answer one least count out — a real misreading, not a typo. */
const answerOffByOne = (model: PracticeModel): void => {
  const spec = model.scale.specProperty.value;
  model.answerTextProperty.value = formatReading(model.scale.readingTicksProperty.value + 1, spec, "en")
    .replace(" mm", "")
    .replace(" in", "");
};

/** Play a whole level, answering every challenge either perfectly or not at all. */
const playLevel = (model: PracticeModel, level: PracticeLevel, perfectly: boolean): void => {
  model.startLevel(level);
  for (let challenge = 1; challenge <= CHALLENGES_PER_LEVEL; challenge++) {
    if (perfectly) {
      answerCorrectly(model);
      model.checkAnswer();
    } else {
      answerOffByOne(model);
      model.checkAnswer();
      model.tryAgain();
      model.checkAnswer();
      model.showAnswer();
    }
    model.next();
  }
};

describe("challenge generation", () => {
  it("always sets an exactly readable value", () => {
    const model = new PracticeModel();
    for (const level of PracticeLevel.enumeration.values) {
      model.levelProperty.value = level;
      for (let draw = 0; draw < 200; draw++) {
        model.newChallenge();
        expect(model.scale.readingErrorProperty.value).toBeCloseTo(0, 9);
      }
    }
  });

  it("keeps the challenge inside the instrument's travel", () => {
    const model = new PracticeModel();
    for (let draw = 0; draw < 200; draw++) {
      model.newChallenge();
      const spec = model.scale.specProperty.value;
      expect(model.scale.measurementProperty.value).toBeGreaterThanOrEqual(0);
      expect(model.scale.measurementProperty.value).toBeLessThanOrEqual(canonicalRange(spec));
    }
  });

  it("draws only imperial scales on the imperial level", () => {
    const model = new PracticeModel();
    model.levelProperty.value = PracticeLevel.IMPERIAL;
    const seen = new Set<string>();
    for (let draw = 0; draw < 200; draw++) {
      model.newChallenge();
      seen.add(model.scale.specProperty.value.id);
    }
    expect([...seen].sort()).toEqual(["inch128", "inchThou"]);
  });

  it("gives the zero-error level a zero error, and the others none", () => {
    const model = new PracticeModel();

    model.levelProperty.value = PracticeLevel.ZERO_ERROR;
    for (let draw = 0; draw < 100; draw++) {
      model.newChallenge();
      expect(model.scale.zeroErrorTicksProperty.value).not.toBe(0);
    }

    model.levelProperty.value = PracticeLevel.METRIC;
    for (let draw = 0; draw < 100; draw++) {
      model.newChallenge();
      expect(model.scale.zeroErrorTicksProperty.value).toBe(0);
    }
  });

  it("clears the previous answer with every new challenge", () => {
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.METRIC);
    model.answerTextProperty.value = "12.34";
    model.checkAnswer();
    model.newChallenge();
    expect(model.answerTextProperty.value).toBe("");
    expect(model.answerStateProperty.value).toBe(AnswerState.PENDING);
    expect(model.attemptsProperty.value).toBe(0);
  });
});

describe("marking", () => {
  it("accepts the exactly correct reading on every level", () => {
    const model = new PracticeModel();
    for (const level of PracticeLevel.enumeration.values) {
      model.startLevel(level);
      for (let draw = 0; draw < 100; draw++) {
        model.newChallenge();
        model.gameStateProperty.value = GameState.CHALLENGE;
        answerCorrectly(model);
        model.checkAnswer();
        expect(model.answerStateProperty.value).toBe(AnswerState.CORRECT);
      }
    }
  });

  it("rejects a reading that is one least count out", () => {
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.METRIC);

    answerOffByOne(model);
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.INCORRECT);
  });

  it("distinguishes an unreadable answer from a wrong one", () => {
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.METRIC);

    model.answerTextProperty.value = "not a number";
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.UNPARSEABLE);
  });

  it("expects the corrected value on the zero-error level", () => {
    // Answering with the raw scale reading — the classic mistake — must fail.
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.ZERO_ERROR);

    const spec = model.scale.specProperty.value;
    model.answerTextProperty.value = formatReading(model.scale.rawReadingTicksProperty.value, spec, "en").replace(
      " mm",
      "",
    );
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.INCORRECT);

    model.tryAgain();
    answerCorrectly(model);
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.CORRECT);
  });

  it("accepts an unreduced fraction, since it names the same reading", () => {
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.IMPERIAL);

    // Find a fractional challenge whose answer reduces, then answer it the long way.
    for (let draw = 0; draw < 400; draw++) {
      model.newChallenge();
      model.gameStateProperty.value = GameState.CHALLENGE;
      const spec = model.scale.specProperty.value;
      if (spec.format !== ReadingFormat.FRACTIONAL) {
        continue;
      }
      const ticks = model.scale.readingTicksProperty.value;
      const whole = Math.floor(ticks / spec.ticksPerUnit);
      const remainder = ticks % spec.ticksPerUnit;
      if (remainder === 0) {
        continue;
      }
      model.answerTextProperty.value = `${whole} ${remainder}/${spec.ticksPerUnit}`;
      model.checkAnswer();
      expect(model.answerStateProperty.value).toBe(AnswerState.CORRECT);
      return;
    }
    throw new Error("no fractional challenge drawn in 400 attempts");
  });
});

describe("the state machine", () => {
  it("starts in level selection and leaves it only when a level is chosen", () => {
    const model = new PracticeModel();
    expect(model.gameStateProperty.value).toBe(GameState.LEVEL_SELECTION);

    model.startLevel(PracticeLevel.IMPERIAL);
    expect(model.gameStateProperty.value).toBe(GameState.CHALLENGE);
    expect(model.levelProperty.value).toBe(PracticeLevel.IMPERIAL);
    expect(model.challengeNumberProperty.value).toBe(1);
    expect(model.scoreProperty.value).toBe(0);
  });

  it("offers Try Again once, then only Show Answer", () => {
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.METRIC);

    answerOffByOne(model);
    model.checkAnswer();
    expect(model.gameStateProperty.value).toBe(GameState.TRY_AGAIN);

    model.tryAgain();
    expect(model.gameStateProperty.value).toBe(GameState.CHALLENGE);

    model.checkAnswer();
    expect(model.gameStateProperty.value).toBe(GameState.SHOW_ANSWER);

    model.showAnswer();
    expect(model.gameStateProperty.value).toBe(GameState.ANSWER_REVEALED);
  });

  it("keeps the typed text through Try Again, so a near miss can be edited", () => {
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.METRIC);

    answerOffByOne(model);
    const typed = model.answerTextProperty.value;
    model.checkAnswer();
    model.tryAgain();
    expect(model.answerTextProperty.value).toBe(typed);
  });

  it("does not treat a typo as an attempt", () => {
    // Deliberate: the score is about whether a student can read a vernier, and
    // fumbling the keyboard is not evidence either way.
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.METRIC);

    model.answerTextProperty.value = "nonsense";
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.UNPARSEABLE);
    expect(model.gameStateProperty.value).toBe(GameState.CHALLENGE);
    expect(model.attemptsProperty.value).toBe(0);

    answerCorrectly(model);
    model.checkAnswer();
    expect(model.scoreProperty.value).toBe(POINTS_FIRST_ATTEMPT);
  });

  it("ends the level after the last challenge", () => {
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.METRIC);

    for (let challenge = 1; challenge <= CHALLENGES_PER_LEVEL; challenge++) {
      expect(model.challengeNumberProperty.value).toBe(challenge);
      answerCorrectly(model);
      model.checkAnswer();
      model.next();
    }

    expect(model.gameStateProperty.value).toBe(GameState.LEVEL_COMPLETED);
  });

  it("abandons a level in progress on request", () => {
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.METRIC);
    model.returnToLevelSelection();
    expect(model.gameStateProperty.value).toBe(GameState.LEVEL_SELECTION);
    expect(model.answerTextProperty.value).toBe("");
  });
});

describe("scoring", () => {
  it("pays two points for a first-attempt reading and one for a second", () => {
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.METRIC);

    answerCorrectly(model);
    model.checkAnswer();
    expect(model.scoreProperty.value).toBe(POINTS_FIRST_ATTEMPT);
    expect(model.pointsAwardedProperty.value).toBe(POINTS_FIRST_ATTEMPT);

    model.next();
    answerOffByOne(model);
    model.checkAnswer();
    model.tryAgain();
    answerCorrectly(model);
    model.checkAnswer();
    expect(model.pointsAwardedProperty.value).toBe(POINTS_SECOND_ATTEMPT);
    expect(model.scoreProperty.value).toBe(POINTS_FIRST_ATTEMPT + POINTS_SECOND_ATTEMPT);
  });

  it("pays nothing for a reading got wrong twice", () => {
    const model = new PracticeModel();
    model.startLevel(PracticeLevel.METRIC);

    answerOffByOne(model);
    model.checkAnswer();
    model.tryAgain();
    model.checkAnswer();
    model.showAnswer();
    expect(model.scoreProperty.value).toBe(0);
  });

  it("banks a perfect level as the best score, and only for that level", () => {
    const model = new PracticeModel();
    playLevel(model, PracticeLevel.METRIC, true);

    expect(model.scoreProperty.value).toBe(PERFECT_SCORE);
    expect(model.bestScoreProperty(PracticeLevel.METRIC).value).toBe(PERFECT_SCORE);
    expect(model.bestScoreProperty(PracticeLevel.IMPERIAL).value).toBe(0);
  });

  it("keeps the better of two attempts at a level", () => {
    const model = new PracticeModel();
    playLevel(model, PracticeLevel.METRIC, true);
    playLevel(model, PracticeLevel.METRIC, false);

    expect(model.scoreProperty.value).toBe(0);
    expect(model.bestScoreProperty(PracticeLevel.METRIC).value).toBe(PERFECT_SCORE);
  });

  it("records a best time only for a perfect level", () => {
    const model = new PracticeModel();

    playLevel(model, PracticeLevel.METRIC, false);
    expect(model.bestTime(PracticeLevel.METRIC)).toBeNull();
    expect(model.isNewBestTimeProperty.value).toBe(false);

    playLevel(model, PracticeLevel.METRIC, true);
    expect(model.bestTime(PracticeLevel.METRIC)).not.toBeNull();
    expect(model.isNewBestTimeProperty.value).toBe(true);
  });
});

describe("reset", () => {
  it("returns to level selection and forgets every best score", () => {
    const model = new PracticeModel();
    playLevel(model, PracticeLevel.IMPERIAL, true);
    expect(model.bestScoreProperty(PracticeLevel.IMPERIAL).value).toBe(PERFECT_SCORE);

    model.reset();

    expect(model.gameStateProperty.value).toBe(GameState.LEVEL_SELECTION);
    expect(model.levelProperty.value).toBe(PracticeLevel.METRIC);
    expect(model.scoreProperty.value).toBe(0);
    expect(model.challengeNumberProperty.value).toBe(1);
    for (const level of PracticeLevel.enumeration.values) {
      expect(model.bestScoreProperty(level).value).toBe(0);
      expect(model.bestTime(level)).toBeNull();
    }
  });
});

describe("levels", () => {
  it("numbers levels from one, in order, for the gameLevels query parameter", () => {
    expect(PracticeLevel.levelsInOrder().map((level) => level.levelNumber)).toEqual([1, 2, 3]);
    expect(PracticeLevel.forNumber(1)).toBe(PracticeLevel.METRIC);
    expect(PracticeLevel.forNumber(3)).toBe(PracticeLevel.ZERO_ERROR);
    expect(() => PracticeLevel.forNumber(4)).toThrow();
  });
});
