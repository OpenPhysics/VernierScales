/**
 * VernierScaleSpec.ts
 *
 * Where the abstract tick arithmetic of {@link ./vernier.ts} meets physical
 * units. A spec says how big one main-scale division is, how many vernier
 * divisions share it, which of the three geometries the vernier uses, and how the
 * resulting reading should be written down.
 *
 * The presets below are real instruments, not illustrative round numbers — the
 * division counts and spans are the ones stamped on the tools. Two of them are
 * worth pointing out because they justify {@link VernierType.EXTENDED} existing
 * at all: the 0.05 mm caliper spans 39 mm rather than 19 mm, and the bevel
 * protractor spans 23° rather than 11°, both so that the marks are far enough
 * apart to judge coincidence by eye.
 */

import { VernierType, vernierSpanDivisions } from "./vernier.js";

/** How a reading is written down once it has been taken. */
export const ReadingFormat = {
  /** A decimal number, e.g. `23.14`. Locale-aware — the separator is not always a point. */
  DECIMAL: "decimal",
  /** A mixed vulgar fraction, e.g. `1 37/128`. See {@link ./inchFraction.ts}. */
  FRACTIONAL: "fractional",
  /** Degrees and arcminutes, e.g. `47° 25′`. */
  ANGULAR: "angular",
} as const;

export type ReadingFormat = (typeof ReadingFormat)[keyof typeof ReadingFormat];

/** The quantity a scale measures, which fixes the unit symbol and the geometry. */
export const ScaleQuantity = {
  LENGTH_MM: "millimetres",
  LENGTH_IN: "inches",
  ANGLE_DEG: "degrees",
} as const;

export type ScaleQuantity = (typeof ScaleQuantity)[keyof typeof ScaleQuantity];

/** A complete description of one readable vernier instrument scale. */
export type VernierScaleSpec = {
  /** Stable identifier, used for preset selection and as a string key. */
  readonly id: string;

  /**
   * Number the main scale every this many divisions. Chosen so the printed
   * values are the round ones a real instrument carries: every 10 mm on a
   * millimetre scale, every 0.1 in (4 divisions) on a decimal-inch one, every
   * whole inch (16 divisions) on a 1/16 in fractional one.
   */
  readonly mainLabelInterval: number;

  /** Which of the three vernier geometries this scale uses. */
  readonly type: VernierType;

  /** Number of vernier divisions, `n`. The least count is one main division over this. */
  readonly divisions: number;

  /** Size of one main-scale division, in the units named by {@link quantity}. */
  readonly mainDivision: number;

  /** What the scale measures. */
  readonly quantity: ScaleQuantity;

  /** How a reading from this scale is written. */
  readonly format: ReadingFormat;

  /** Decimal places for {@link ReadingFormat.DECIMAL}; ignored otherwise. */
  readonly decimalPlaces: number;

  /**
   * Ticks in one whole unit, for {@link ReadingFormat.FRACTIONAL} — the
   * denominator a reading is expressed over before reduction (128 for a
   * 1/128 in caliper). Ignored for the other formats.
   */
  readonly ticksPerUnit: number;

  /** Full travel of the instrument, in the units named by {@link quantity}. */
  readonly range: number;
};

/** The least count — the finest increment the scale can resolve. */
export const leastCount = (spec: VernierScaleSpec): number => spec.mainDivision / spec.divisions;

/** How many main divisions the vernier spans, for this spec's geometry. */
export const spanDivisions = (spec: VernierScaleSpec): number => vernierSpanDivisions(spec.type, spec.divisions);

/** Physical length (or angle) of the whole vernier scale, in the spec's units. */
export const vernierSpan = (spec: VernierScaleSpec): number => spanDivisions(spec) * spec.mainDivision;

/** Convert a physical measurement in the spec's units into integer-ish ticks. */
export const toTicks = (spec: VernierScaleSpec, value: number): number => value / leastCount(spec);

/** Convert ticks back into the spec's physical units. */
export const fromTicks = (spec: VernierScaleSpec, ticks: number): number => ticks * leastCount(spec);

/** Exact, by definition of the international inch since 1959. */
export const MILLIMETRES_PER_INCH = 25.4;

/**
 * Canonical units — millimetres for length, degrees for angle.
 *
 * Models store measurements canonically rather than in the active scale's own
 * units, so that switching a caliper from millimetres to inches re-reads the
 * *same object* instead of silently reinterpreting 23.14 mm as 23.14 in.
 */
export const canonicalPerSpecUnit = (spec: VernierScaleSpec): number =>
  spec.quantity === ScaleQuantity.LENGTH_IN ? MILLIMETRES_PER_INCH : 1;

/** Canonical value (mm or degrees) → the spec's own units. */
export const toSpecUnits = (spec: VernierScaleSpec, canonicalValue: number): number =>
  canonicalValue / canonicalPerSpecUnit(spec);

/** The spec's own units → canonical (mm or degrees). */
export const fromSpecUnits = (spec: VernierScaleSpec, specValue: number): number =>
  specValue * canonicalPerSpecUnit(spec);

/** Canonical value straight to ticks of this scale's least count. */
export const canonicalToTicks = (spec: VernierScaleSpec, canonicalValue: number): number =>
  toTicks(spec, toSpecUnits(spec, canonicalValue));

/** Ticks of this scale's least count straight to a canonical value. */
export const ticksToCanonical = (spec: VernierScaleSpec, ticks: number): number =>
  fromSpecUnits(spec, fromTicks(spec, ticks));

/** The scale's full travel, in canonical units. */
export const canonicalRange = (spec: VernierScaleSpec): number => fromSpecUnits(spec, spec.range);

// ── Metric calipers ───────────────────────────────────────────────────────────

/** Student caliper: 10 divisions over 9 mm. The one every textbook draws first. */
export const METRIC_TENTH: VernierScaleSpec = {
  id: "metricTenth",
  mainLabelInterval: 10,
  type: VernierType.DIRECT,
  divisions: 10,
  mainDivision: 1,
  quantity: ScaleQuantity.LENGTH_MM,
  format: ReadingFormat.DECIMAL,
  decimalPlaces: 1,
  ticksPerUnit: 0,
  range: 150,
};

/**
 * Workshop caliper reading 0.05 mm: 20 divisions spanning **39** mm, not 19.
 * An extended vernier, chosen so consecutive vernier marks sit ~1.95 mm apart
 * instead of ~0.95 mm.
 */
export const METRIC_TWENTIETH: VernierScaleSpec = {
  id: "metricTwentieth",
  mainLabelInterval: 10,
  type: VernierType.EXTENDED,
  divisions: 20,
  mainDivision: 1,
  quantity: ScaleQuantity.LENGTH_MM,
  format: ReadingFormat.DECIMAL,
  decimalPlaces: 2,
  ticksPerUnit: 0,
  range: 150,
};

/** The usual precision caliper: 50 divisions over 49 mm, reading 0.02 mm. */
export const METRIC_FIFTIETH: VernierScaleSpec = {
  id: "metricFiftieth",
  mainLabelInterval: 10,
  type: VernierType.DIRECT,
  divisions: 50,
  mainDivision: 1,
  quantity: ScaleQuantity.LENGTH_MM,
  format: ReadingFormat.DECIMAL,
  decimalPlaces: 2,
  ticksPerUnit: 0,
  range: 150,
};

/** Half-millimetre main scale, 20 divisions over 19 of them: 0.025 mm. */
export const METRIC_HALF_MM: VernierScaleSpec = {
  id: "metricHalfMillimetre",
  mainLabelInterval: 20,
  type: VernierType.DIRECT,
  divisions: 20,
  mainDivision: 0.5,
  quantity: ScaleQuantity.LENGTH_MM,
  format: ReadingFormat.DECIMAL,
  decimalPlaces: 3,
  ticksPerUnit: 0,
  range: 150,
};

// ── Imperial calipers ─────────────────────────────────────────────────────────

/**
 * The standard decimal-inch caliper. The main scale divides the inch into 40, so
 * one main division is 0.025 in and every fourth mark is a numbered tenth; 25
 * vernier divisions span 24 of them (0.600 in) to read 0.001 in — one "thou".
 */
export const INCH_THOU: VernierScaleSpec = {
  id: "inchThou",
  mainLabelInterval: 4,
  type: VernierType.DIRECT,
  divisions: 25,
  mainDivision: 0.025,
  quantity: ScaleQuantity.LENGTH_IN,
  format: ReadingFormat.DECIMAL,
  decimalPlaces: 3,
  ticksPerUnit: 0,
  range: 6,
};

/**
 * Toolroom decimal-inch caliper reading half a thou: the same 0.025 in main
 * scale, but 50 vernier divisions spanning 49 of them (1.225 in).
 */
export const INCH_HALF_THOU: VernierScaleSpec = {
  id: "inchHalfThou",
  mainLabelInterval: 4,
  type: VernierType.DIRECT,
  divisions: 50,
  mainDivision: 0.025,
  quantity: ScaleQuantity.LENGTH_IN,
  format: ReadingFormat.DECIMAL,
  decimalPlaces: 4,
  ticksPerUnit: 0,
  range: 6,
};

/**
 * Fractional-inch caliper: a 1/16 in main scale with 8 vernier divisions
 * spanning 7 of them, reading 1/128 in. Readings are written as reduced mixed
 * fractions, which is a genuinely different skill from reading the decimal
 * scales above and the reason {@link ./inchFraction.ts} exists.
 */
export const INCH_128: VernierScaleSpec = {
  id: "inch128",
  mainLabelInterval: 16,
  type: VernierType.DIRECT,
  divisions: 8,
  mainDivision: 1 / 16,
  quantity: ScaleQuantity.LENGTH_IN,
  format: ReadingFormat.FRACTIONAL,
  decimalPlaces: 0,
  ticksPerUnit: 128,
  range: 6,
};

/** Coarser fractional rule: a 1/8 in main scale, 8 vernier divisions, 1/64 in. */
export const INCH_64: VernierScaleSpec = {
  id: "inch64",
  mainLabelInterval: 8,
  type: VernierType.DIRECT,
  divisions: 8,
  mainDivision: 1 / 8,
  quantity: ScaleQuantity.LENGTH_IN,
  format: ReadingFormat.FRACTIONAL,
  decimalPlaces: 0,
  ticksPerUnit: 64,
  range: 6,
};

// ── Other instruments ─────────────────────────────────────────────────────────

/**
 * Bevel protractor: 12 vernier divisions spanning **23°**, reading 5 arcminutes.
 * Extended, for the same legibility reason as the 0.05 mm caliper — and a
 * circular scale, which shows the vernier principle owes nothing to straightness.
 */
export const PROTRACTOR_FIVE_MINUTE: VernierScaleSpec = {
  id: "protractorFiveMinute",
  mainLabelInterval: 10,
  type: VernierType.EXTENDED,
  divisions: 12,
  mainDivision: 1,
  quantity: ScaleQuantity.ANGLE_DEG,
  format: ReadingFormat.ANGULAR,
  decimalPlaces: 0,
  ticksPerUnit: 0,
  range: 360,
};

/** Vernier micrometer: a 0.01 mm thimble read to 0.001 mm by a sleeve vernier. */
export const MICROMETER_MICRON: VernierScaleSpec = {
  id: "micrometerMicron",
  mainLabelInterval: 10,
  type: VernierType.DIRECT,
  divisions: 10,
  mainDivision: 0.01,
  quantity: ScaleQuantity.LENGTH_MM,
  format: ReadingFormat.DECIMAL,
  decimalPlaces: 3,
  ticksPerUnit: 0,
  range: 25,
};

/** Every preset, in the order they should appear in a selector. */
export const ALL_SCALE_SPECS: readonly VernierScaleSpec[] = [
  METRIC_TENTH,
  METRIC_TWENTIETH,
  METRIC_FIFTIETH,
  METRIC_HALF_MM,
  INCH_THOU,
  INCH_HALF_THOU,
  INCH_128,
  INCH_64,
  PROTRACTOR_FIVE_MINUTE,
  MICROMETER_MICRON,
] as const;

/** Presets the Caliper screen offers. */
export const CALIPER_SCALE_SPECS: readonly VernierScaleSpec[] = [
  METRIC_TENTH,
  METRIC_TWENTIETH,
  METRIC_FIFTIETH,
  INCH_THOU,
  INCH_128,
] as const;

/**
 * Decimal places needed to write this scale's least count exactly, capped at
 * four. A tenth vernier needs one place, a fiftieth needs two, and an eighth
 * needs three (0.125); counts that do not divide a power of ten — a twelfth,
 * say — simply get the cap.
 */
const placesForLeastCount = (divisions: number): number => {
  for (let places = 1; places < 4; places++) {
    const scaled = 10 ** places / divisions;
    if (Math.abs(scaled - Math.round(scaled)) < 1e-9) {
      return places;
    }
  }
  return 4;
};

/**
 * Build a scale for the Vernier Principle screen, where the user chooses the
 * geometry and the division count directly rather than picking a real tool.
 *
 * The main division is one millimetre so that readings stay concrete and
 * familiar; nothing else about the screen depends on the unit.
 */
export const createPrincipleSpec = (type: VernierType, divisions: number): VernierScaleSpec => ({
  id: `principle-${type}-${divisions}`,
  mainLabelInterval: 5,
  type,
  divisions,
  mainDivision: 1,
  quantity: ScaleQuantity.LENGTH_MM,
  format: ReadingFormat.DECIMAL,
  decimalPlaces: placesForLeastCount(divisions),
  ticksPerUnit: 0,
  range: 120,
});

/** Smallest and largest division counts the Principle screen offers. */
export const PRINCIPLE_DIVISIONS_RANGE = { min: 4, max: 30 } as const;

/** Look a preset up by {@link VernierScaleSpec.id}. */
export const scaleSpecById = (id: string): VernierScaleSpec | null =>
  ALL_SCALE_SPECS.find((spec) => spec.id === id) ?? null;
