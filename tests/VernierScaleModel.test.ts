/**
 * VernierScaleModel.test.ts
 *
 * Tests for the reactive instrument model.
 *
 * The cases worth having here are the ones about *state*, which the pure
 * functions cannot cover: that changing units re-measures the same object rather
 * than reinterpreting the number, that a zero error moves the displayed scale
 * and is then undone in the reported reading, and that the keyboard steps land
 * on exactly readable values.
 */

import { describe, expect, it } from "vitest";
import { VernierScaleModel } from "../src/common/model/VernierScaleModel.js";
import {
  INCH_THOU,
  METRIC_FIFTIETH,
  METRIC_TENTH,
  MILLIMETRES_PER_INCH,
} from "../src/common/model/VernierScaleSpec.js";

describe("reading a measurement", () => {
  it("decomposes 23.14 mm on the 0.02 mm caliper", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 23.14);
    expect(model.readingTicksProperty.value).toBe(1157);
    expect(model.mainDivisionsReadProperty.value).toBe(23);
    expect(model.vernierLabelReadProperty.value).toBe(7);
    expect(model.coincidentIndexProperty.value).toBe(7);
  });

  it("keeps the reading error within half a least count for any size", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 0);
    for (let step = 0; step < 500; step++) {
      model.setMeasurement(step * 0.137);
      expect(Math.abs(model.readingErrorProperty.value)).toBeLessThanOrEqual(0.5 + 1e-9);
    }
  });

  it("clamps to the instrument's travel", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 0);
    model.setMeasurement(-10);
    expect(model.measurementProperty.value).toBe(0);
    model.setMeasurement(10_000);
    expect(model.measurementProperty.value).toBe(model.measurementRangeProperty.value);
  });
});

describe("switching units", () => {
  it("re-measures the same object rather than reinterpreting the number", () => {
    // A 25.4 mm bar is exactly one inch, whichever scale is fitted.
    const model = new VernierScaleModel(METRIC_FIFTIETH, MILLIMETRES_PER_INCH);
    expect(model.readingValueProperty.value).toBeCloseTo(MILLIMETRES_PER_INCH, 6);

    model.specProperty.value = INCH_THOU;
    expect(model.measurementProperty.value).toBeCloseTo(MILLIMETRES_PER_INCH, 9);
    expect(model.readingTicksProperty.value).toBe(1000);
  });

  it("recomputes the least count when the scale changes", () => {
    const model = new VernierScaleModel(METRIC_TENTH, 23.1);
    expect(model.readingTicksProperty.value).toBe(231);

    model.specProperty.value = METRIC_FIFTIETH;
    expect(model.readingTicksProperty.value).toBe(1155);
  });
});

describe("zero error", () => {
  it("shifts what the scales display and is undone in the reading", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 23.14);
    model.zeroErrorTicksProperty.value = 3;

    // The scales now show three least counts too many …
    expect(model.rawReadingTicksProperty.value).toBe(1160);
    expect(model.offsetTicksProperty.value).toBeCloseTo(1160, 6);

    // … but the reported measurement corrects for it.
    expect(model.readingTicksProperty.value).toBe(1157);
  });

  it("works the same way for a negative zero error", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 23.14);
    model.zeroErrorTicksProperty.value = -4;
    expect(model.rawReadingTicksProperty.value).toBe(1153);
    expect(model.readingTicksProperty.value).toBe(1157);
  });

  it("moves the coincident tick, since that is what the instrument shows", () => {
    const model = new VernierScaleModel(METRIC_TENTH, 2.4);
    expect(model.coincidentIndexProperty.value).toBe(4);

    model.zeroErrorTicksProperty.value = 3;
    expect(model.coincidentIndexProperty.value).toBe(7);
  });
});

describe("keyboard-sized steps", () => {
  it("moves one least count at a time", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 23.14);
    model.stepByLeastCount(1);
    expect(model.readingTicksProperty.value).toBe(1158);
    model.stepByLeastCount(-3);
    expect(model.readingTicksProperty.value).toBe(1155);
  });

  it("moves one main division at a time", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 23.14);
    model.stepByMainDivision(1);
    expect(model.readingTicksProperty.value).toBe(1157 + 50);
    expect(model.mainDivisionsReadProperty.value).toBe(24);
  });

  it("lands on exactly readable values even starting from an unreadable one", () => {
    // This is what makes keyboard control worth having: the error goes to zero
    // and stays there, which a pointer drag cannot promise.
    const model = new VernierScaleModel(METRIC_FIFTIETH, 23.137);
    expect(model.readingErrorProperty.value).not.toBe(0);

    model.stepByLeastCount(1);
    for (let step = 0; step < 20; step++) {
      expect(model.readingErrorProperty.value).toBeCloseTo(0, 9);
      model.stepByLeastCount(1);
    }
  });

  it("does not walk past the ends of the scale", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 0);
    model.stepByLeastCount(-5);
    expect(model.measurementProperty.value).toBe(0);
  });
});

describe("snapping", () => {
  it("moves to the nearest exactly readable value", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 23.137);
    model.snapToReadable();
    expect(model.readingErrorProperty.value).toBeCloseTo(0, 9);
    expect(model.readingTicksProperty.value).toBe(1157);
  });

  it("quantises every setMeasurement while snap-to-readable is enabled", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 0);
    model.snapToReadableEnabledProperty.value = true;
    model.setMeasurement(23.137);
    expect(model.readingErrorProperty.value).toBeCloseTo(0, 9);
    expect(model.readingTicksProperty.value).toBe(1157);

    model.setMeasurement(10.011);
    expect(model.readingErrorProperty.value).toBeCloseTo(0, 9);
    expect(model.measurementProperty.value).toBeCloseTo(10.02, 9);
  });

  it("leaves continuous values alone while snap-to-readable is off", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 0);
    model.setMeasurement(23.137);
    expect(model.measurementProperty.value).toBeCloseTo(23.137, 9);
    expect(model.readingErrorProperty.value).not.toBe(0);
  });
});

describe("reset", () => {
  it("restores the spec, the measurement and the zero error", () => {
    const model = new VernierScaleModel(METRIC_FIFTIETH, 23.14);
    model.specProperty.value = INCH_THOU;
    model.setMeasurement(40);
    model.zeroErrorTicksProperty.value = 2;

    model.reset();

    expect(model.specProperty.value).toBe(METRIC_FIFTIETH);
    expect(model.measurementProperty.value).toBeCloseTo(23.14, 9);
    expect(model.zeroErrorTicksProperty.value).toBe(0);
  });
});
