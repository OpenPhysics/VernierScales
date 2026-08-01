/**
 * inchFraction.ts
 *
 * Pure, dependency-free arithmetic for imperial readings expressed as mixed
 * fractions — "1 37/128 in" rather than "1.289 in".
 *
 * Fractional-inch calipers are their own reading skill, and the arithmetic they
 * need is not the arithmetic decimal readings need. A 1/128 in vernier (a 1/16 in
 * main scale divided eight ways) produces numerators from 0 to 127, and a reader
 * is expected to reduce: 32/128 is written 1/4, and 64/128 is written 1/2. Every
 * function here works in the same integer ticks as {@link ./vernier.ts} so that
 * the reduction stays exact — floats cannot represent 1/128 in a way that
 * survives repeated division, and "is this 3/8 or 47/128?" is exactly the
 * question a student is being asked.
 *
 * Nothing here is locale-dependent: a vulgar fraction is written the same way in
 * every locale this sim ships. Decimal readings are *not* handled here precisely
 * because they do need locale-aware separators.
 */

/** Greatest common divisor of two non-negative integers, by Euclid. */
const greatestCommonDivisor = (a: number, b: number): number => (b === 0 ? a : greatestCommonDivisor(b, a % b));

/** A reading split into a whole part and a proper, fully reduced fraction. */
export type MixedNumber = {
  /** True when the whole value is negative; `whole`, `numerator` are magnitudes. */
  readonly negative: boolean;
  /** Whole units (whole inches, for an inch scale). Never negative. */
  readonly whole: number;
  /** Numerator of the reduced proper fraction; zero when the value is a whole number. */
  readonly numerator: number;
  /** Denominator of the reduced proper fraction; one when the value is a whole number. */
  readonly denominator: number;
};

/**
 * Reduce `numerator / denominator` to lowest terms. A zero numerator reduces to
 * `0/1` so that callers never have to special-case it.
 */
export const reduceFraction = (numerator: number, denominator: number): { numerator: number; denominator: number } => {
  if (numerator === 0) {
    return { numerator: 0, denominator: 1 };
  }
  const divisor = greatestCommonDivisor(Math.abs(numerator), Math.abs(denominator));
  return { numerator: numerator / divisor, denominator: denominator / divisor };
};

/**
 * Split a reading of `ticks` least counts into a mixed number, given that one
 * whole unit spans `ticksPerUnit` of them.
 *
 * For a 1/128 in caliper `ticksPerUnit` is 128, so 165 ticks becomes
 * `1 37/128` and 160 ticks becomes `1 1/4`.
 */
export const toMixedNumber = (ticks: number, ticksPerUnit: number): MixedNumber => {
  const magnitude = Math.abs(ticks);
  const whole = Math.floor(magnitude / ticksPerUnit);
  const { numerator, denominator } = reduceFraction(magnitude % ticksPerUnit, ticksPerUnit);
  return { negative: ticks < 0, whole, numerator, denominator };
};

/** The inverse of {@link toMixedNumber}: how many ticks a mixed number represents. */
export const fromMixedNumber = (mixed: MixedNumber, ticksPerUnit: number): number => {
  const magnitude = mixed.whole * ticksPerUnit + (mixed.numerator * ticksPerUnit) / mixed.denominator;
  return mixed.negative ? -magnitude : magnitude;
};

/**
 * Render a mixed number the way it is written on a shop drawing: `1 37/128`,
 * `3/8`, `2`, `-1/16`. The unit symbol is the caller's business — this returns
 * the number alone so that string assembly stays with the i18n layer.
 */
export const formatMixedNumber = (mixed: MixedNumber): string => {
  const sign = mixed.negative ? "-" : "";
  const fraction = `${mixed.numerator}/${mixed.denominator}`;

  // A whole number prints without a fraction; a value below one prints without a
  // leading zero, matching how fractional dimensions are conventionally written.
  if (mixed.numerator === 0) {
    return `${sign}${mixed.whole}`;
  }
  if (mixed.whole === 0) {
    return `${sign}${fraction}`;
  }
  return `${sign}${mixed.whole} ${fraction}`;
};

/** Convenience: ticks straight to a display string. */
export const formatFractionalInch = (ticks: number, ticksPerUnit: number): string =>
  formatMixedNumber(toMixedNumber(ticks, ticksPerUnit));

/**
 * Parse a typed fractional-inch answer back into ticks, for the Practice screen.
 *
 * Accepts the forms a student is likely to type — `1 37/128`, `1-37/128`,
 * `37/128`, `2`, with any surrounding whitespace and an optional leading sign —
 * and deliberately accepts unreduced input (`32/128` is a correct reading, just
 * not a tidy one; whether to *insist* on reduction is a pedagogical choice that
 * belongs in the screen, not the parser).
 *
 * Returns `null` for anything unparseable, including a zero denominator, so the
 * caller can distinguish "wrong" from "not a number at all".
 */
export const parseFractionalInch = (text: string, ticksPerUnit: number): number | null => {
  const match = /^([+-]?)\s*(?:(\d+)(?:\s+|-)(\d+)\/(\d+)|(\d+)\/(\d+)|(\d+))$/.exec(text.trim());
  if (match === null) {
    return null;
  }

  const [, sign, mixedWhole, mixedNumerator, mixedDenominator, bareNumerator, bareDenominator, bareWhole] = match;

  let whole = 0;
  let numerator = 0;
  let denominator = 1;
  if (mixedWhole !== undefined) {
    whole = Number(mixedWhole);
    numerator = Number(mixedNumerator);
    denominator = Number(mixedDenominator);
  } else if (bareNumerator !== undefined) {
    numerator = Number(bareNumerator);
    denominator = Number(bareDenominator);
  } else {
    whole = Number(bareWhole);
  }

  if (denominator === 0) {
    return null;
  }

  // A denominator finer than the instrument, or one that does not divide it,
  // cannot name a tick — 1/3 in is not a reading any vernier can produce.
  const fractionTicks = (numerator * ticksPerUnit) / denominator;
  if (!Number.isInteger(fractionTicks)) {
    return null;
  }

  const magnitude = whole * ticksPerUnit + fractionTicks;
  return sign === "-" ? -magnitude : magnitude;
};
