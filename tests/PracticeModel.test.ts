/**
 * PracticeModel.test.ts
 *
 * Tests for the drill.
 *
 * The property that matters most is that every generated question *has* a
 * correct answer a student could type: the value must land on a whole number of
 * least counts, or the drill is asking for something the instrument cannot show.
 * Because questions are random, that is checked over many draws rather than one.
 */

import { describe, expect, it } from "vitest";
import { formatReading } from "../src/common/model/readingFormat.js";
import { canonicalRange, ReadingFormat } from "../src/common/model/VernierScaleSpec.js";
import { AnswerState, PracticeLevel, PracticeModel } from "../src/practice/model/PracticeModel.js";

/** Type the exactly-correct answer for whatever question is on screen. */
const answerCorrectly = (model: PracticeModel): void => {
  const spec = model.scale.specProperty.value;
  const text = formatReading(model.scale.readingTicksProperty.value, spec, "en");

  // Strip the unit, which the field does not ask for.
  model.answerTextProperty.value = text.replace(" mm", "").replace(" in", "");
};

describe("question generation", () => {
  it("always sets an exactly readable value", () => {
    const model = new PracticeModel();
    for (const level of [PracticeLevel.METRIC, PracticeLevel.IMPERIAL, PracticeLevel.ZERO_ERROR]) {
      model.levelProperty.value = level;
      for (let draw = 0; draw < 200; draw++) {
        model.newQuestion();
        expect(model.scale.readingErrorProperty.value).toBeCloseTo(0, 9);
      }
    }
  });

  it("keeps the question inside the instrument's travel", () => {
    const model = new PracticeModel();
    for (let draw = 0; draw < 200; draw++) {
      model.newQuestion();
      const spec = model.scale.specProperty.value;
      expect(model.scale.measurementProperty.value).toBeGreaterThanOrEqual(0);
      expect(model.scale.measurementProperty.value).toBeLessThanOrEqual(canonicalRange(spec));
    }
  });

  it("draws only imperial scales on the imperial tier", () => {
    const model = new PracticeModel();
    model.levelProperty.value = PracticeLevel.IMPERIAL;
    const seen = new Set<string>();
    for (let draw = 0; draw < 200; draw++) {
      model.newQuestion();
      seen.add(model.scale.specProperty.value.id);
    }
    expect([...seen].sort()).toEqual(["inch128", "inchThou"]);
  });

  it("gives the zero-error tier a zero error, and the others none", () => {
    const model = new PracticeModel();

    model.levelProperty.value = PracticeLevel.ZERO_ERROR;
    for (let draw = 0; draw < 100; draw++) {
      model.newQuestion();
      expect(model.scale.zeroErrorTicksProperty.value).not.toBe(0);
    }

    model.levelProperty.value = PracticeLevel.METRIC;
    for (let draw = 0; draw < 100; draw++) {
      model.newQuestion();
      expect(model.scale.zeroErrorTicksProperty.value).toBe(0);
    }
  });

  it("clears the previous answer with every new question", () => {
    const model = new PracticeModel();
    model.answerTextProperty.value = "12.34";
    model.checkAnswer();
    model.newQuestion();
    expect(model.answerTextProperty.value).toBe("");
    expect(model.answerStateProperty.value).toBe(AnswerState.PENDING);
  });
});

describe("marking", () => {
  it("accepts the exactly correct reading on every tier", () => {
    const model = new PracticeModel();
    for (const level of [PracticeLevel.METRIC, PracticeLevel.IMPERIAL, PracticeLevel.ZERO_ERROR]) {
      model.levelProperty.value = level;
      for (let draw = 0; draw < 100; draw++) {
        model.newQuestion();
        answerCorrectly(model);
        model.checkAnswer();
        expect(model.answerStateProperty.value).toBe(AnswerState.CORRECT);
      }
    }
  });

  it("rejects a reading that is one least count out", () => {
    const model = new PracticeModel();
    model.levelProperty.value = PracticeLevel.METRIC;
    model.newQuestion();

    const spec = model.scale.specProperty.value;
    const offByOne = formatReading(model.scale.readingTicksProperty.value + 1, spec, "en").replace(" mm", "");
    model.answerTextProperty.value = offByOne;
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.INCORRECT);
  });

  it("distinguishes an unreadable answer from a wrong one", () => {
    const model = new PracticeModel();
    model.answerTextProperty.value = "not a number";
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.UNPARSEABLE);
  });

  it("expects the corrected value on the zero-error tier", () => {
    // Answering with the raw scale reading — the classic mistake — must fail.
    const model = new PracticeModel();
    model.levelProperty.value = PracticeLevel.ZERO_ERROR;
    model.newQuestion();

    const spec = model.scale.specProperty.value;
    const raw = formatReading(model.scale.rawReadingTicksProperty.value, spec, "en").replace(" mm", "");
    model.answerTextProperty.value = raw;
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.INCORRECT);

    answerCorrectly(model);
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.CORRECT);
  });

  it("accepts an unreduced fraction, since it names the same reading", () => {
    const model = new PracticeModel();
    model.levelProperty.value = PracticeLevel.IMPERIAL;

    // Find a fractional question whose answer reduces, then answer it the long way.
    for (let draw = 0; draw < 400; draw++) {
      model.newQuestion();
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
    throw new Error("no fractional question drawn in 400 attempts");
  });
});

describe("the tally", () => {
  it("counts a question only on its first check", () => {
    const model = new PracticeModel();
    model.levelProperty.value = PracticeLevel.METRIC;
    model.newQuestion();

    const before = model.correctCountProperty.value;
    answerCorrectly(model);
    model.checkAnswer();
    model.checkAnswer();
    model.checkAnswer();
    expect(model.correctCountProperty.value).toBe(before + 1);
  });

  it("does not credit an answer got right only after a wrong attempt", () => {
    const model = new PracticeModel();
    model.levelProperty.value = PracticeLevel.METRIC;
    model.newQuestion();

    const spec = model.scale.specProperty.value;
    const before = model.correctCountProperty.value;

    model.answerTextProperty.value = formatReading(model.scale.readingTicksProperty.value + 1, spec, "en").replace(
      " mm",
      "",
    );
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.INCORRECT);

    answerCorrectly(model);
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.CORRECT);
    expect(model.correctCountProperty.value).toBe(before);
  });

  it("treats a typo as no attempt at all, not as a wrong answer", () => {
    // Deliberate: the tally is about whether a student can read a vernier, and
    // fumbling the keyboard is not evidence either way.
    const model = new PracticeModel();
    model.levelProperty.value = PracticeLevel.METRIC;
    model.newQuestion();

    const before = model.correctCountProperty.value;
    model.answerTextProperty.value = "nonsense";
    model.checkAnswer();
    expect(model.answerStateProperty.value).toBe(AnswerState.UNPARSEABLE);

    answerCorrectly(model);
    model.checkAnswer();
    expect(model.correctCountProperty.value).toBe(before + 1);
  });

  it("starts over on reset, with one question already on screen", () => {
    const model = new PracticeModel();
    for (let draw = 0; draw < 5; draw++) {
      model.newQuestion();
    }
    model.reset();
    expect(model.correctCountProperty.value).toBe(0);
    expect(model.askedCountProperty.value).toBe(1);
    expect(model.levelProperty.value).toBe(PracticeLevel.METRIC);
  });

  it("asks exactly one question on reset even when the level had changed", () => {
    const model = new PracticeModel();
    model.levelProperty.value = PracticeLevel.IMPERIAL;
    expect(model.askedCountProperty.value).toBeGreaterThan(1);

    model.reset();
    expect(model.levelProperty.value).toBe(PracticeLevel.METRIC);
    expect(model.askedCountProperty.value).toBe(1);
  });
});
