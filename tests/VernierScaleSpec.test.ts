/**
 * VernierScaleSpec.test.ts
 *
 * Checks the instrument presets against the numbers stamped on the real tools.
 *
 * These are the tests most likely to catch a typo that would otherwise ship as a
 * plausible-looking but wrong instrument: a caliper that spans 19 mm where the
 * real one spans 39, or a protractor reading 6 arcminutes instead of 5.
 */

import { describe, expect, it } from "vitest";
import {
  ALL_SCALE_SPECS,
  CALIPER_SCALE_SPECS,
  fromTicks,
  INCH_64,
  INCH_128,
  INCH_HALF_THOU,
  INCH_THOU,
  leastCount,
  METRIC_FIFTIETH,
  METRIC_HALF_MM,
  METRIC_TENTH,
  METRIC_TWENTIETH,
  MICROMETER_MICRON,
  MILLIMETRES_PER_INCH,
  PROTRACTOR_FIVE_MINUTE,
  ReadingFormat,
  scaleSpecById,
  spanDivisions,
  toTicks,
  vernierSpan,
} from "../src/common/model/VernierScaleSpec.js";
import { VernierType } from "../src/common/model/vernier.js";

describe("metric caliper presets", () => {
  it("gives the least count stamped on each instrument", () => {
    expect(leastCount(METRIC_TENTH)).toBeCloseTo(0.1, 12);
    expect(leastCount(METRIC_TWENTIETH)).toBeCloseTo(0.05, 12);
    expect(leastCount(METRIC_FIFTIETH)).toBeCloseTo(0.02, 12);
    expect(leastCount(METRIC_HALF_MM)).toBeCloseTo(0.025, 12);
  });

  it("spans the length the real scale spans", () => {
    expect(vernierSpan(METRIC_TENTH)).toBeCloseTo(9, 12);
    expect(vernierSpan(METRIC_FIFTIETH)).toBeCloseTo(49, 12);

    // The 0.05 mm caliper is an extended vernier: 39 mm, not 19.
    expect(METRIC_TWENTIETH.type).toBe(VernierType.EXTENDED);
    expect(spanDivisions(METRIC_TWENTIETH)).toBe(39);
    expect(vernierSpan(METRIC_TWENTIETH)).toBeCloseTo(39, 12);
  });
});

describe("imperial caliper presets", () => {
  it("divides the inch into 40 on the decimal main scale", () => {
    expect(INCH_THOU.mainDivision).toBeCloseTo(1 / 40, 12);
    expect(INCH_HALF_THOU.mainDivision).toBeCloseTo(1 / 40, 12);
  });

  it("reads one thou and half a thou", () => {
    expect(leastCount(INCH_THOU)).toBeCloseTo(0.001, 12);
    expect(leastCount(INCH_HALF_THOU)).toBeCloseTo(0.0005, 12);
  });

  it("spans 0.600 in and 1.225 in respectively", () => {
    expect(spanDivisions(INCH_THOU)).toBe(24);
    expect(vernierSpan(INCH_THOU)).toBeCloseTo(0.6, 12);

    expect(spanDivisions(INCH_HALF_THOU)).toBe(49);
    expect(vernierSpan(INCH_HALF_THOU)).toBeCloseTo(1.225, 12);
  });

  it("reads 1/128 in and 1/64 in on the fractional scales", () => {
    expect(leastCount(INCH_128)).toBe(1 / 128);
    expect(leastCount(INCH_64)).toBe(1 / 64);
  });

  it("agrees with the fraction denominator each fractional scale advertises", () => {
    // ticksPerUnit is what inchFraction renders over; it must be the reciprocal
    // of the least count, or readings would be written in the wrong denominator.
    expect(1 / leastCount(INCH_128)).toBe(INCH_128.ticksPerUnit);
    expect(1 / leastCount(INCH_64)).toBe(INCH_64.ticksPerUnit);
  });

  it("spans 7/16 in on the 1/128 in scale", () => {
    expect(spanDivisions(INCH_128)).toBe(7);
    expect(vernierSpan(INCH_128)).toBe(7 / 16);
  });

  it("converts to millimetres by the exact international inch", () => {
    expect(MILLIMETRES_PER_INCH).toBe(25.4);
    expect(leastCount(INCH_THOU) * MILLIMETRES_PER_INCH).toBeCloseTo(0.0254, 12);
  });
});

describe("other instrument presets", () => {
  it("reads 5 arcminutes on the bevel protractor", () => {
    expect(PROTRACTOR_FIVE_MINUTE.type).toBe(VernierType.EXTENDED);
    expect(spanDivisions(PROTRACTOR_FIVE_MINUTE)).toBe(23);
    expect(leastCount(PROTRACTOR_FIVE_MINUTE) * 60).toBeCloseTo(5, 12);
  });

  it("reads one micron on the vernier micrometer", () => {
    expect(leastCount(MICROMETER_MICRON)).toBeCloseTo(0.001, 12);
  });
});

describe("tick conversion", () => {
  it("round-trips physical values through ticks", () => {
    for (const spec of ALL_SCALE_SPECS) {
      for (let ticks = 0; ticks < 200; ticks++) {
        expect(toTicks(spec, fromTicks(spec, ticks))).toBeCloseTo(ticks, 9);
      }
    }
  });

  it("puts 23.14 mm at 1157 ticks on the 0.02 mm caliper", () => {
    expect(toTicks(METRIC_FIFTIETH, 23.14)).toBeCloseTo(1157, 9);
  });

  it("puts 1 37/128 in at 165 ticks on the fractional caliper", () => {
    expect(toTicks(INCH_128, 1 + 37 / 128)).toBe(165);
  });
});

describe("the preset catalogue", () => {
  it("has unique ids and finds each by id", () => {
    const ids = ALL_SCALE_SPECS.map((spec) => spec.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const spec of ALL_SCALE_SPECS) {
      expect(scaleSpecById(spec.id)).toBe(spec);
    }
  });

  it("returns null for an unknown id", () => {
    expect(scaleSpecById("nosuchscale")).toBeNull();
  });

  it("offers only calipers on the caliper screen", () => {
    for (const spec of CALIPER_SCALE_SPECS) {
      expect(ALL_SCALE_SPECS).toContain(spec);
      expect(spec.format).not.toBe(ReadingFormat.ANGULAR);
    }
  });

  it("keeps every spec internally consistent", () => {
    for (const spec of ALL_SCALE_SPECS) {
      expect(spec.divisions).toBeGreaterThan(1);
      expect(spec.mainDivision).toBeGreaterThan(0);
      expect(spec.range).toBeGreaterThan(vernierSpan(spec));

      // A fractional scale must name the denominator it renders over; a decimal
      // one must offer enough places to show its own least count.
      if (spec.format === ReadingFormat.FRACTIONAL) {
        expect(spec.ticksPerUnit).toBeGreaterThan(0);
      } else if (spec.format === ReadingFormat.DECIMAL) {
        expect(leastCount(spec)).toBeGreaterThanOrEqual(10 ** -spec.decimalPlaces);
      }
    }
  });
});
