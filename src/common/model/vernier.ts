/**
 * vernier.ts
 *
 * Pure tick-arithmetic for vernier scales — no axon Properties, no scenery, no
 * units. The only SceneryStack import is {@link EnumerationValue} for the three
 * vernier geometries. Everything else is a plain function of plain numbers so it
 * can be unit-tested in isolation; the screen models wrap it in Properties, and
 * the views call it to decide which tick to highlight and where to draw it.
 *
 * ── Conventions used everywhere in this simulation ────────────────────────────
 *
 *  - **Natural units: one "tick" is one least count.** Every length in this file
 *    is measured in ticks, so all the interesting quantities are integers and
 *    tick coincidence is decided by integer arithmetic rather than by comparing
 *    floats against an epsilon. Nothing here knows about millimetres, inches or
 *    degrees; {@link VernierScaleSpec} attaches physical units at the boundary.
 *
 *  - **`n` is the number of vernier divisions.** By definition the least count is
 *    one main-scale division divided by `n`, so one main-scale division is
 *    exactly `n` ticks — see {@link mainDivisionTicks}.
 *
 *  - **Offsets are measured from the main scale's zero** to the vernier's zero
 *    mark, in ticks. An offset may be fractional: a real caliper's jaws slide
 *    continuously, and the whole point of a least count is that the *reading*
 *    quantises while the true separation does not.
 *
 *  - **The three vernier types differ in geometry and numbering, never in what
 *    they read.** All of them resolve one main division into `n` parts, so
 *    {@link readingTicks} is deliberately independent of the type. What the type
 *    changes is *which* tick physically lines up ({@link coincidentIndex}) and
 *    what number is printed under it ({@link vernierLabel}).
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

/**
 * How a vernier scale's divisions relate to the main scale's. All three have the
 * same least count, `mainDivision / n`; they differ in how many main divisions
 * the vernier spans, and therefore in how crowded the marks are.
 */
export class VernierType extends EnumerationValue {
  /**
   * `n` vernier divisions span `n - 1` main divisions, so each vernier division
   * is one tick *shorter* than a main division. The common case — a 0.02 mm
   * caliper has 50 divisions spanning 49 mm.
   */
  public static readonly DIRECT = new VernierType();

  /**
   * `n` vernier divisions span `n + 1` main divisions, so each vernier division
   * is one tick *longer* than a main division. The numbering runs backwards so
   * that the reading still comes out forwards; found on some theodolite circles.
   */
  public static readonly RETROGRADE = new VernierType();

  /**
   * `n` vernier divisions span `2n - 1` main divisions — a "Sauter" or long
   * vernier. Same least count as a direct vernier but with the marks spread over
   * twice the length, which is why it is used where the main scale is too fine to
   * judge coincidence by eye: the 0.05 mm caliper (20 divisions over 39 mm) and
   * the 5-arcminute bevel protractor (12 divisions over 23°) are both this type.
   */
  public static readonly EXTENDED = new VernierType();

  public static readonly enumeration = new Enumeration(VernierType);
}

/**
 * Positive remainder. JavaScript's `%` keeps the sign of the dividend, which is
 * wrong for every modular index in this file (a vernier sitting left of the main
 * zero must still name a tick in `[0, n)`).
 */
const positiveModulo = (value: number, modulus: number): number => ((value % modulus) + modulus) % modulus;

/**
 * Length of one main-scale division, in ticks. This is `n` by construction: the
 * least count *is* one main division split `n` ways, so choosing the least count
 * as the unit makes the main division an integer number of them.
 */
export const mainDivisionTicks = (n: number): number => n;

/**
 * How many main divisions the vernier scale spans end to end. This single
 * number is what distinguishes the three types.
 */
export const vernierSpanDivisions = (type: VernierType, n: number): number => {
  switch (type) {
    case VernierType.DIRECT:
      return n - 1;
    case VernierType.RETROGRADE:
      return n + 1;
    case VernierType.EXTENDED:
      return 2 * n - 1;
    default:
      throw new Error(`Unhandled VernierType: ${type}`);
  }
};

/**
 * Length of one vernier division, in ticks.
 *
 * The span is `vernierSpanDivisions` main divisions shared among `n` vernier
 * divisions, so one vernier division measures `span * n / n = span` ticks. That
 * the answer is numerically the same as the span is a happy consequence of
 * measuring in least counts, not a coincidence worth relying on elsewhere.
 */
export const vernierDivisionTicks = (type: VernierType, n: number): number => vernierSpanDivisions(type, n);

/**
 * Total length of the vernier scale, in ticks, from its zero mark to its last.
 */
export const vernierLengthTicks = (type: VernierType, n: number): number => n * vernierDivisionTicks(type, n);

/**
 * Position of vernier tick `index` in ticks, measured from the main scale's zero,
 * when the vernier's zero sits at `offsetTicks`.
 */
export const vernierTickPosition = (offsetTicks: number, index: number, type: VernierType, n: number): number =>
  offsetTicks + index * vernierDivisionTicks(type, n);

/**
 * Whether the vernier's numbering runs opposite to the main scale's.
 *
 * A retrograde vernier's divisions are *longer* than the main scale's, so the
 * tick that lines up moves the wrong way as the vernier advances. Printing the
 * numbers in reverse cancels that out, which is the only reason a scale whose
 * geometry runs backwards can still be read forwards.
 */
export const hasReversedNumbering = (type: VernierType): boolean => type === VernierType.RETROGRADE;

/**
 * The number printed beneath vernier tick `index` — what a reader actually
 * transcribes when that tick is the one that lines up.
 *
 * Forward for direct and extended verniers, mirrored for a retrograde one.
 */
export const vernierLabel = (index: number, type: VernierType, n: number): number =>
  hasReversedNumbering(type) ? positiveModulo(-index, n) : positiveModulo(index, n);

/**
 * The value the instrument reads, in ticks, for a true offset of `offsetTicks`.
 *
 * A vernier resolves to one least count and no finer, so reading is simply
 * rounding to the nearest tick. This is independent of {@link VernierType} —
 * all three resolve a main division into the same `n` parts — and independent of
 * `n` as well, once the offset is already expressed in ticks.
 */
export const readingTicks = (offsetTicks: number): number => Math.round(offsetTicks);

/**
 * How many whole main-scale divisions the reading contains — the number a reader
 * takes off the main scale, just before the vernier's zero mark.
 *
 * Derived from the rounded reading rather than from the raw offset, so that a
 * vernier zero sitting a whisker below a main mark carries into the next
 * division instead of reporting a full division too few.
 */
export const mainDivisionsRead = (offsetTicks: number, n: number): number => Math.floor(readingTicks(offsetTicks) / n);

/**
 * The vernier number a reader transcribes — the fractional part of the reading,
 * counted in least counts.
 *
 * Consistent with {@link coincidentIndex} by construction: the label under the
 * tick that lines up is always this number.
 */
export const vernierLabelRead = (offsetTicks: number, n: number): number =>
  positiveModulo(readingTicks(offsetTicks), n);

/**
 * Index of the vernier tick that best lines up with a main-scale tick — the one
 * the view highlights and the reader's eye lands on.
 *
 * Because one vernier division differs from one main division by exactly one
 * tick, vernier tick `k` sits `k` ticks away (modulo `n`) from the main-scale
 * grid — ahead of it for a direct or extended vernier, behind it for a
 * retrograde one. Finding the closest therefore costs a rounding, not a search.
 *
 * Deliberately derived from {@link vernierLabelRead} rather than by rounding the
 * offset independently: the highlighted tick and the reported reading must never
 * disagree, and rounding twice does not guarantee that. `Math.round` breaks a
 * half-tick tie towards +∞, so for a retrograde vernier `round(-x)` is not
 * `-round(x)` — an offset of exactly 18.5 ticks highlighted the tick printed "8"
 * while the readout said "9". Inverting the label is exact for every offset.
 */
export const coincidentIndex = (offsetTicks: number, type: VernierType, n: number): number => {
  const label = vernierLabelRead(offsetTicks, n);
  return hasReversedNumbering(type) ? positiveModulo(-label, n) : label;
};

/**
 * The error the vernier's finite resolution introduces, in ticks: reading minus
 * truth. Always within ±½ a least count, which is the sim's operational
 * definition of "resolution".
 */
export const readingError = (offsetTicks: number): number => readingTicks(offsetTicks) - offsetTicks;

/**
 * Correct a raw reading for an instrument whose jaws do not read zero when
 * closed. Zero error is *subtracted*: a caliper reading +0.03 mm closed reports
 * every length 0.03 mm too long.
 */
export const correctForZeroError = (rawReadingTicks: number, zeroErrorTicks: number): number =>
  rawReadingTicks - zeroErrorTicks;
