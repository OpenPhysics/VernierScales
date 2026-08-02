/**
 * readingFormat.test.ts
 *
 * Tests for turning readings into text and back.
 *
 * The locale cases matter more than they look: a French build showing `23.14 mm`
 * where it should show `23,14 mm` is wrong in exactly the place a student is
 * being taught to copy a number down carefully, and `Number.toFixed` gets it
 * wrong silently in every locale.
 */

import { describe, expect, it } from "vitest";
import {
  formatAngular,
  formatDecimal,
  formatLeastCount,
  formatReading,
  parseReading,
  unitSymbol,
} from "../src/common/model/readingFormat.js";
import {
  INCH_128,
  INCH_THOU,
  METRIC_FIFTIETH,
  METRIC_TENTH,
  PROTRACTOR_FIVE_MINUTE,
} from "../src/common/model/VernierScaleSpec.js";

describe("decimal formatting", () => {
  it("uses a point in English and a comma in French and Spanish", () => {
    expect(formatDecimal(23.14, 2, "en")).toBe("23.14");
    expect(formatDecimal(23.14, 2, "fr")).toBe("23,14");
    expect(formatDecimal(23.14, 2, "es")).toBe("23,14");
  });

  it("pads to the scale's precision so readings line up", () => {
    expect(formatDecimal(23, 2, "en")).toBe("23.00");
    expect(formatDecimal(23.1, 2, "en")).toBe("23.10");
  });

  it("does not group thousands, which no reading in this sim needs", () => {
    expect(formatDecimal(1234.5, 1, "en")).toBe("1234.5");
  });
});

describe("angular formatting", () => {
  it("writes degrees and arcminutes", () => {
    // 47° 25′ at a least count of 5′ is 569 ticks: 47 × 12 + 5.
    expect(formatAngular(569, PROTRACTOR_FIVE_MINUTE)).toBe("47° 25′");
  });

  it("writes a whole degree with zero arcminutes", () => {
    expect(formatAngular(12 * 30, PROTRACTOR_FIVE_MINUTE)).toBe("30° 0′");
  });

  it("only ever produces arcminutes that are multiples of the least count", () => {
    for (let ticks = 0; ticks < 400; ticks++) {
      const arcminutes = Number(/(\d+)′/.exec(formatAngular(ticks, PROTRACTOR_FIVE_MINUTE))?.[1]);
      expect(arcminutes % 5).toBe(0);
    }
  });
});

describe("unit symbols and complete readings", () => {
  it("appends the right symbol", () => {
    expect(unitSymbol(METRIC_FIFTIETH)).toBe("mm");
    expect(unitSymbol(INCH_THOU)).toBe("in");
    expect(unitSymbol(PROTRACTOR_FIVE_MINUTE)).toBe("°");
  });

  it("formats a metric reading with its unit and locale separator", () => {
    expect(formatReading(1157, METRIC_FIFTIETH, "en")).toBe("23.14 mm");
    expect(formatReading(1157, METRIC_FIFTIETH, "fr")).toBe("23,14 mm");
  });

  it("formats a decimal-inch reading to thousandths", () => {
    expect(formatReading(1234, INCH_THOU, "en")).toBe("1.234 in");
  });

  it("formats a fractional-inch reading as a reduced mixed number", () => {
    expect(formatReading(165, INCH_128, "en")).toBe("1 37/128 in");
    expect(formatReading(160, INCH_128, "en")).toBe("1 1/4 in");
  });

  it("leaves an angular reading's own symbols alone rather than appending a unit", () => {
    expect(formatReading(569, PROTRACTOR_FIVE_MINUTE, "en")).toBe("47° 25′");
  });

  it("renders each scale's least count the way its readings are rendered", () => {
    expect(formatLeastCount(METRIC_TENTH, "en")).toBe("0.1 mm");
    expect(formatLeastCount(METRIC_FIFTIETH, "en")).toBe("0.02 mm");
    expect(formatLeastCount(INCH_THOU, "en")).toBe("0.001 in");
    expect(formatLeastCount(INCH_128, "en")).toBe("1/128 in");
    expect(formatLeastCount(PROTRACTOR_FIVE_MINUTE, "en")).toBe("0° 5′");
  });
});

describe("parsing typed answers", () => {
  it("round-trips every metric reading it formats", () => {
    for (let ticks = 0; ticks < 500; ticks++) {
      const text = formatReading(ticks, METRIC_FIFTIETH, "en").replace(" mm", "");
      expect(Math.round(parseReading(text, METRIC_FIFTIETH) ?? Number.NaN)).toBe(ticks);
    }
  });

  it("round-trips fractional-inch readings", () => {
    for (let ticks = 0; ticks < 300; ticks++) {
      const text = formatReading(ticks, INCH_128, "en").replace(" in", "");
      expect(parseReading(text, INCH_128)).toBe(ticks);
    }
  });

  it("accepts either decimal separator regardless of locale", () => {
    // A student on a French build may well type a point out of habit, and
    // marking that wrong would be marking the wrong thing.
    expect(parseReading("23.14", METRIC_FIFTIETH)).toBeCloseTo(1157, 6);
    expect(parseReading("23,14", METRIC_FIFTIETH)).toBeCloseTo(1157, 6);
  });

  it("accepts angular answers in the forms that are typeable", () => {
    expect(parseReading("47° 25′", PROTRACTOR_FIVE_MINUTE)).toBeCloseTo(569, 6);
    expect(parseReading("47 25", PROTRACTOR_FIVE_MINUTE)).toBeCloseTo(569, 6);
    expect(parseReading("47d 25m", PROTRACTOR_FIVE_MINUTE)).toBeCloseTo(569, 6);
    expect(parseReading("47", PROTRACTOR_FIVE_MINUTE)).toBeCloseTo(564, 6);
  });

  it("rejects an arcminute count that is not an arcminute count", () => {
    expect(parseReading("47 60", PROTRACTOR_FIVE_MINUTE)).toBeNull();
  });

  it("returns null rather than zero for text that is not a reading", () => {
    // The caller has to be able to tell "not answered" from "answered wrongly".
    for (const text of ["", "   ", "abc", "1/3", "23.14.5", "--3"]) {
      expect(parseReading(text, METRIC_FIFTIETH)).toBeNull();
    }
  });
});
