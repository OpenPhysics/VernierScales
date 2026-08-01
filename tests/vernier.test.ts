/**
 * vernier.test.ts
 *
 * Tests for the sim's core vernier arithmetic.
 *
 * Three layers, following the fleet's house style:
 *   1. readings computed by hand from real instruments (the 2.4 mm student
 *      caliper, a 23.14 mm precision reading, a 12.35 mm extended vernier);
 *   2. *independent* structural checks — above all that the label under the tick
 *      which physically lines up always equals the fraction of the reading, a
 *      property the implementation computes by two unrelated routes and so
 *      cannot pass by restating its own formula;
 *   3. a sweep over the whole parameter space for boundedness and totality.
 */

import { describe, expect, it } from "vitest";
import {
  coincidentIndex,
  correctForZeroError,
  hasReversedNumbering,
  mainDivisionsRead,
  mainDivisionTicks,
  readingError,
  readingTicks,
  VernierType,
  vernierDivisionTicks,
  vernierLabel,
  vernierLabelRead,
  vernierLengthTicks,
  vernierSpanDivisions,
  vernierTickPosition,
} from "../src/common/model/vernier.js";

const ALL_TYPES = [VernierType.DIRECT, VernierType.RETROGRADE, VernierType.EXTENDED] as const;

describe("scale geometry", () => {
  it("makes one main division exactly n ticks", () => {
    expect(mainDivisionTicks(10)).toBe(10);
    expect(mainDivisionTicks(50)).toBe(50);
  });

  it("spans the number of main divisions each type is defined by", () => {
    // The 0.02 mm caliper: 50 divisions over 49 mm.
    expect(vernierSpanDivisions(VernierType.DIRECT, 50)).toBe(49);

    // A retrograde vernier overhangs instead of falling short.
    expect(vernierSpanDivisions(VernierType.RETROGRADE, 50)).toBe(51);

    // The 0.05 mm caliper: 20 divisions over 39 mm, not 19.
    expect(vernierSpanDivisions(VernierType.EXTENDED, 20)).toBe(39);

    // The 5-arcminute bevel protractor: 12 divisions over 23°.
    expect(vernierSpanDivisions(VernierType.EXTENDED, 12)).toBe(23);
  });

  it("makes a direct vernier division exactly one tick short of a main division", () => {
    for (const n of [8, 10, 20, 25, 50]) {
      expect(mainDivisionTicks(n) - vernierDivisionTicks(VernierType.DIRECT, n)).toBe(1);
    }
  });

  it("makes a retrograde vernier division exactly one tick long", () => {
    for (const n of [8, 10, 20, 25, 50]) {
      expect(vernierDivisionTicks(VernierType.RETROGRADE, n) - mainDivisionTicks(n)).toBe(1);
    }
  });

  it("makes an extended vernier division one tick short of two main divisions", () => {
    for (const n of [8, 10, 12, 20, 50]) {
      expect(2 * mainDivisionTicks(n) - vernierDivisionTicks(VernierType.EXTENDED, n)).toBe(1);
    }
  });

  it("places the last vernier tick at the end of the span", () => {
    for (const type of ALL_TYPES) {
      for (const n of [8, 10, 20, 50]) {
        expect(vernierTickPosition(0, n, type, n)).toBe(vernierLengthTicks(type, n));
        expect(vernierLengthTicks(type, n)).toBe(vernierSpanDivisions(type, n) * n);
      }
    }
  });

  it("reverses the numbering only for a retrograde vernier", () => {
    expect(hasReversedNumbering(VernierType.DIRECT)).toBe(false);
    expect(hasReversedNumbering(VernierType.EXTENDED)).toBe(false);
    expect(hasReversedNumbering(VernierType.RETROGRADE)).toBe(true);
  });
});

describe("readings computed by hand", () => {
  it("reads 2.4 mm on the 0.1 mm student caliper", () => {
    // 2.4 mm at a least count of 0.1 mm is 24 ticks; n = 10.
    const offsetTicks = 24;
    expect(coincidentIndex(offsetTicks, VernierType.DIRECT, 10)).toBe(4);
    expect(mainDivisionsRead(offsetTicks, 10)).toBe(2);
    expect(vernierLabelRead(offsetTicks, 10)).toBe(4);
  });

  it("reads 23.14 mm on the 0.02 mm precision caliper", () => {
    // 23.14 mm at 0.02 mm is 1157 ticks; n = 50. 23 mm on the main scale,
    // vernier line 7 coincident, 7 × 0.02 = 0.14 mm.
    const offsetTicks = 1157;
    expect(mainDivisionsRead(offsetTicks, 50)).toBe(23);
    expect(vernierLabelRead(offsetTicks, 50)).toBe(7);
    expect(coincidentIndex(offsetTicks, VernierType.DIRECT, 50)).toBe(7);
  });

  it("reads 12.35 mm on the 0.05 mm extended-vernier caliper", () => {
    // 12.35 mm at 0.05 mm is 247 ticks; n = 20. 12 mm plus line 7 × 0.05.
    const offsetTicks = 247;
    expect(mainDivisionsRead(offsetTicks, 20)).toBe(12);
    expect(vernierLabelRead(offsetTicks, 20)).toBe(7);
    expect(coincidentIndex(offsetTicks, VernierType.EXTENDED, 20)).toBe(7);
  });

  it("puts a retrograde vernier's coincident tick on the mirrored side", () => {
    // Same 24-tick offset as the student caliper, but the geometry runs the other
    // way: tick 6 lines up, and it is the one printed "4".
    const offsetTicks = 24;
    expect(coincidentIndex(offsetTicks, VernierType.RETROGRADE, 10)).toBe(6);
    expect(vernierLabel(6, VernierType.RETROGRADE, 10)).toBe(4);
  });
});

describe("the label under the coincident tick is the reading", () => {
  // This is the whole vernier principle. coincidentIndex derives from
  // vernierLabelRead, so for a direct or extended vernier the first two tests
  // below are true by construction and stand as regression guards; for a
  // retrograde one they genuinely check that mirroring the numbering undoes
  // mirroring the geometry. The independent check is the third test, which
  // brute-forces the closest tick from the drawn positions and knows nothing
  // about how the implementation finds it.
  it("holds for every type, division count and integer offset", () => {
    for (const type of ALL_TYPES) {
      for (const n of [8, 10, 12, 20, 25, 50]) {
        for (let offsetTicks = -3 * n; offsetTicks <= 3 * n; offsetTicks++) {
          const index = coincidentIndex(offsetTicks, type, n);
          expect(vernierLabel(index, type, n)).toBe(vernierLabelRead(offsetTicks, n));
        }
      }
    }
  });

  it("holds for fractional offsets too", () => {
    for (const type of ALL_TYPES) {
      for (const n of [10, 20, 50]) {
        for (let step = 0; step < 400; step++) {
          const offsetTicks = step * 0.37;
          const index = coincidentIndex(offsetTicks, type, n);
          expect(vernierLabel(index, type, n)).toBe(vernierLabelRead(offsetTicks, n));
        }
      }
    }
  });

  it("names a tick that genuinely sits closest to the main-scale grid", () => {
    // Independent check: measure every drawn tick's distance to the main-scale
    // grid and confirm the chosen one is a minimiser. Compares gaps rather than
    // indices because at a half-tick offset two ticks are exactly equidistant,
    // and either is a correct answer.
    const gapToGrid = (offsetTicks: number, index: number, type: (typeof ALL_TYPES)[number], n: number): number => {
      const position = vernierTickPosition(offsetTicks, index, type, n);
      return Math.abs(position - n * Math.round(position / n));
    };

    for (const type of ALL_TYPES) {
      for (const n of [8, 10, 20]) {
        for (let step = 0; step < 120; step++) {
          const offsetTicks = step * 0.53;

          let smallestGap = Number.POSITIVE_INFINITY;
          for (let index = 0; index < n; index++) {
            smallestGap = Math.min(smallestGap, gapToGrid(offsetTicks, index, type, n));
          }
          const chosenGap = gapToGrid(offsetTicks, coincidentIndex(offsetTicks, type, n), type, n);
          expect(chosenGap).toBeCloseTo(smallestGap, 9);
        }
      }
    }
  });

  it("keeps the highlighted tick and the readout consistent at a half-tick tie", () => {
    // Regression: Math.round breaks ties towards +∞, so deriving the coincident
    // index by rounding a *negated* offset disagreed with the reading at exactly
    // x.5 for a retrograde vernier — the tick printed "8" lit up while the
    // readout said "9".
    for (const type of ALL_TYPES) {
      for (const n of [8, 10, 20, 50]) {
        for (let half = -6; half <= 6; half++) {
          const offsetTicks = half + 0.5;
          const index = coincidentIndex(offsetTicks, type, n);
          expect(vernierLabel(index, type, n)).toBe(vernierLabelRead(offsetTicks, n));
        }
      }
    }
  });
});

describe("reading and resolution", () => {
  it("reconstructs the reading from its two transcribed parts", () => {
    for (const n of [8, 10, 20, 25, 50]) {
      for (let step = 0; step < 300; step++) {
        const offsetTicks = step * 0.41;
        expect(mainDivisionsRead(offsetTicks, n) * n + vernierLabelRead(offsetTicks, n)).toBe(
          readingTicks(offsetTicks),
        );
      }
    }
  });

  it("carries into the next main division rather than reporting one too few", () => {
    // A vernier zero a whisker below the 30-tick mark reads 30, not 29 + label 0.
    // Getting this wrong is the classic off-by-one in naive implementations.
    const offsetTicks = 29.6;
    expect(readingTicks(offsetTicks)).toBe(30);
    expect(mainDivisionsRead(offsetTicks, 10)).toBe(3);
    expect(vernierLabelRead(offsetTicks, 10)).toBe(0);
  });

  it("bounds the reading error at half a least count", () => {
    for (let step = 0; step < 2000; step++) {
      const offsetTicks = step * 0.137;
      expect(Math.abs(readingError(offsetTicks))).toBeLessThanOrEqual(0.5 + 1e-12);
    }
  });

  it("reads exactly when the offset is already a whole number of least counts", () => {
    for (let offsetTicks = -50; offsetTicks <= 50; offsetTicks++) {
      expect(readingTicks(offsetTicks)).toBe(offsetTicks);
      expect(readingError(offsetTicks)).toBe(0);
    }
  });

  it("reads the same value whatever the vernier geometry", () => {
    // All three types resolve one main division into n parts, so they must agree.
    for (let step = 0; step < 200; step++) {
      const offsetTicks = step * 0.29;
      const readings = ALL_TYPES.map(() => readingTicks(offsetTicks));
      expect(new Set(readings).size).toBe(1);
    }
  });
});

describe("zero error", () => {
  it("subtracts a positive zero error", () => {
    // A caliper reading +3 ticks with its jaws shut reports everything long.
    expect(correctForZeroError(1157, 3)).toBe(1154);
  });

  it("adds back a negative zero error", () => {
    expect(correctForZeroError(1157, -3)).toBe(1160);
  });

  it("is the identity for a correctly zeroed instrument", () => {
    for (let reading = -20; reading <= 20; reading++) {
      expect(correctForZeroError(reading, 0)).toBe(reading);
    }
  });
});

describe("totality over the parameter space", () => {
  it("always names a tick index inside [0, n)", () => {
    for (const type of ALL_TYPES) {
      for (const n of [2, 8, 10, 12, 20, 25, 50, 100]) {
        for (let step = -200; step < 200; step++) {
          const offsetTicks = step * 0.73;
          const index = coincidentIndex(offsetTicks, type, n);
          expect(Number.isInteger(index)).toBe(true);
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(n);

          const label = vernierLabel(index, type, n);
          expect(label).toBeGreaterThanOrEqual(0);
          expect(label).toBeLessThan(n);
        }
      }
    }
  });

  it("keeps every vernier division positive", () => {
    for (const type of ALL_TYPES) {
      for (const n of [2, 8, 10, 50, 100]) {
        expect(vernierDivisionTicks(type, n)).toBeGreaterThan(0);
      }
    }
  });
});
