/**
 * inchFraction.test.ts
 *
 * Tests for imperial readings written as reduced mixed fractions.
 *
 * The cases here are the ones a fractional-inch caliper actually produces: a
 * 1/128 in instrument yields numerators 0–127, of which the students' hardest
 * are the ones that reduce (32/128 must be written 1/4) and the ones that do not
 * (37/128 stays put). Round-trip and reduction invariants back the hand cases up.
 */

import { describe, expect, it } from "vitest";
import {
  formatFractionalInch,
  formatMixedNumber,
  fromMixedNumber,
  parseFractionalInch,
  reduceFraction,
  toMixedNumber,
} from "../src/common/model/inchFraction.js";

describe("reduceFraction", () => {
  it("reduces to lowest terms", () => {
    expect(reduceFraction(32, 128)).toEqual({ numerator: 1, denominator: 4 });
    expect(reduceFraction(64, 128)).toEqual({ numerator: 1, denominator: 2 });
    expect(reduceFraction(96, 128)).toEqual({ numerator: 3, denominator: 4 });
    expect(reduceFraction(48, 128)).toEqual({ numerator: 3, denominator: 8 });
    expect(reduceFraction(20, 128)).toEqual({ numerator: 5, denominator: 32 });
  });

  it("leaves a fraction already in lowest terms alone", () => {
    expect(reduceFraction(37, 128)).toEqual({ numerator: 37, denominator: 128 });
    expect(reduceFraction(1, 128)).toEqual({ numerator: 1, denominator: 128 });
    expect(reduceFraction(127, 128)).toEqual({ numerator: 127, denominator: 128 });
  });

  it("normalises zero to 0/1 so callers need no special case", () => {
    expect(reduceFraction(0, 128)).toEqual({ numerator: 0, denominator: 1 });
  });

  it("always produces a fraction that cannot be reduced further", () => {
    for (let numerator = 0; numerator < 128; numerator++) {
      const reduced = reduceFraction(numerator, 128);
      const again = reduceFraction(reduced.numerator, reduced.denominator);
      expect(again).toEqual(reduced);
    }
  });
});

describe("toMixedNumber", () => {
  it("splits a 1/128 in reading into whole inches and a reduced fraction", () => {
    expect(toMixedNumber(165, 128)).toEqual({ negative: false, whole: 1, numerator: 37, denominator: 128 });
  });

  it("reduces when the reading lands on a coarser mark", () => {
    expect(toMixedNumber(160, 128)).toEqual({ negative: false, whole: 1, numerator: 1, denominator: 4 });
    expect(toMixedNumber(64, 128)).toEqual({ negative: false, whole: 0, numerator: 1, denominator: 2 });
  });

  it("handles whole inches and sub-inch readings", () => {
    expect(toMixedNumber(256, 128)).toEqual({ negative: false, whole: 2, numerator: 0, denominator: 1 });
    expect(toMixedNumber(0, 128)).toEqual({ negative: false, whole: 0, numerator: 0, denominator: 1 });
    expect(toMixedNumber(3, 128)).toEqual({ negative: false, whole: 0, numerator: 3, denominator: 128 });
  });

  it("carries the sign separately from the magnitude", () => {
    // Negative readings arise from zero-error correction, not from measurement.
    expect(toMixedNumber(-165, 128)).toEqual({ negative: true, whole: 1, numerator: 37, denominator: 128 });
  });

  it("works on a 1/64 in scale too", () => {
    expect(toMixedNumber(80, 64)).toEqual({ negative: false, whole: 1, numerator: 1, denominator: 4 });
    expect(toMixedNumber(35, 64)).toEqual({ negative: false, whole: 0, numerator: 35, denominator: 64 });
  });
});

describe("formatting", () => {
  it("writes mixed, proper and whole readings the way a drawing does", () => {
    expect(formatFractionalInch(165, 128)).toBe("1 37/128");
    expect(formatFractionalInch(160, 128)).toBe("1 1/4");
    expect(formatFractionalInch(64, 128)).toBe("1/2");
    expect(formatFractionalInch(256, 128)).toBe("2");
    expect(formatFractionalInch(0, 128)).toBe("0");
  });

  it("puts the sign in front of the whole thing", () => {
    expect(formatFractionalInch(-165, 128)).toBe("-1 37/128");
    expect(formatFractionalInch(-3, 128)).toBe("-3/128");
  });

  it("never emits an improper fraction", () => {
    for (let ticks = 0; ticks < 512; ticks++) {
      const mixed = toMixedNumber(ticks, 128);
      expect(mixed.numerator).toBeLessThan(mixed.denominator);
      expect(formatMixedNumber(mixed)).not.toMatch(/\/1$/);
    }
  });
});

describe("round trips", () => {
  it("recovers the tick count from the mixed number", () => {
    for (let ticks = -300; ticks <= 300; ticks++) {
      expect(fromMixedNumber(toMixedNumber(ticks, 128), 128)).toBe(ticks);
    }
  });

  it("parses back everything it formats", () => {
    for (let ticks = 0; ticks < 512; ticks++) {
      expect(parseFractionalInch(formatFractionalInch(ticks, 128), 128)).toBe(ticks);
    }
  });
});

describe("parsing student input", () => {
  it("accepts the forms a student is likely to type", () => {
    expect(parseFractionalInch("1 37/128", 128)).toBe(165);
    expect(parseFractionalInch("1-37/128", 128)).toBe(165);
    expect(parseFractionalInch("  1 37/128  ", 128)).toBe(165);
    expect(parseFractionalInch("37/128", 128)).toBe(37);
    expect(parseFractionalInch("2", 128)).toBe(256);
  });

  it("accepts an unreduced but correct reading", () => {
    // 32/128 and 1/4 are the same measurement; insisting on reduction is the
    // screen's pedagogical choice, not the parser's.
    expect(parseFractionalInch("32/128", 128)).toBe(32);
    expect(parseFractionalInch("1/4", 128)).toBe(32);
  });

  it("accepts a leading sign", () => {
    expect(parseFractionalInch("-1/16", 128)).toBe(-8);
    expect(parseFractionalInch("+1/16", 128)).toBe(8);
  });

  it("rejects denominators the instrument cannot produce", () => {
    // 1/3 in is not a tick on any binary scale; 1/256 is finer than the vernier.
    expect(parseFractionalInch("1/3", 128)).toBeNull();
    expect(parseFractionalInch("1/256", 128)).toBeNull();
    expect(parseFractionalInch("1/0", 128)).toBeNull();
  });

  it("rejects things that are not readings at all", () => {
    for (const text of ["", "  ", "abc", "1 2 3", "1//2", "1.5", "/", "1 /2", "1/", "--1"]) {
      expect(parseFractionalInch(text, 128)).toBeNull();
    }
  });
});
