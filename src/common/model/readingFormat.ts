/**
 * readingFormat.ts
 *
 * Turns a reading in ticks into the text a user sees, in whichever of the three
 * notations the instrument uses.
 *
 * Decimal readings are formatted with `Intl.NumberFormat` rather than
 * `Number.toFixed`, because the decimal separator is not a point everywhere:
 * the French and Spanish builds of this sim must show `23,14 mm`, and a reading
 * is the one number in the sim a user is explicitly being taught to transcribe.
 * Fractional and angular readings need no such care — `1 37/128` and `47° 25′`
 * are written the same way in every locale this sim ships.
 */

import { formatFractionalInch, parseFractionalInch } from "./inchFraction.js";
import { fromTicks, leastCount, ReadingFormat, ScaleQuantity, type VernierScaleSpec } from "./VernierScaleSpec.js";

/** Arcminutes in a degree. */
const ARCMINUTES_PER_DEGREE = 60;

/**
 * The unit symbol for a scale. Not localized: `mm`, `in` and `°` are the SI and
 * conventional symbols and are left untranslated by design, matching how the
 * rest of the OpenPhysics fleet renders units.
 */
export const unitSymbol = (spec: VernierScaleSpec): string => {
  switch (spec.quantity) {
    case ScaleQuantity.LENGTH_MM:
      return "mm";
    case ScaleQuantity.LENGTH_IN:
      return "in";
    case ScaleQuantity.ANGLE_DEG:
      return "°";
  }
};

/**
 * Format a decimal number for display, honouring the locale's decimal separator.
 *
 * `Intl.NumberFormat` is constructed per call rather than cached: readings change
 * on every drag frame but there are only a handful of live readouts, and caching
 * would have to be keyed on both locale and digit count.
 */
export const formatDecimal = (value: number, decimalPlaces: number, locale: string): string =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
    useGrouping: false,
  }).format(value);

/**
 * Format an angle as whole degrees and arcminutes, e.g. `47° 25′`.
 *
 * A bevel protractor's least count is 5′, so the arcminute part is always a
 * multiple of five and never needs a fractional component.
 */
export const formatAngular = (ticks: number, spec: VernierScaleSpec): string => {
  const totalArcminutes = Math.round(ticks * leastCount(spec) * ARCMINUTES_PER_DEGREE);
  const degrees = Math.floor(Math.abs(totalArcminutes) / ARCMINUTES_PER_DEGREE);
  const arcminutes = Math.abs(totalArcminutes) % ARCMINUTES_PER_DEGREE;
  const sign = totalArcminutes < 0 ? "-" : "";
  return `${sign}${degrees}° ${arcminutes}′`;
};

/**
 * The reading as a bare number, without a unit symbol — the caller appends one
 * so that pattern strings stay in the i18n layer.
 */
export const formatReadingValue = (ticks: number, spec: VernierScaleSpec, locale: string): string => {
  switch (spec.format) {
    case ReadingFormat.DECIMAL:
      return formatDecimal(fromTicks(spec, ticks), spec.decimalPlaces, locale);
    case ReadingFormat.FRACTIONAL:
      return formatFractionalInch(ticks, spec.ticksPerUnit);
    case ReadingFormat.ANGULAR:
      return formatAngular(ticks, spec);
  }
};

/** The reading with its unit symbol, e.g. `23,14 mm`, `1 37/128 in`, `47° 25′`. */
export const formatReading = (ticks: number, spec: VernierScaleSpec, locale: string): string => {
  const value = formatReadingValue(ticks, spec, locale);

  // The degree and arcminute symbols are already part of the angular text.
  return spec.format === ReadingFormat.ANGULAR ? value : `${value} ${unitSymbol(spec)}`;
};

/** The scale's least count, formatted the same way its readings are. */
export const formatLeastCount = (spec: VernierScaleSpec, locale: string): string => formatReading(1, spec, locale);

/**
 * Parse a typed answer back into ticks, for the Practice screen.
 *
 * Decimal input accepts both separators regardless of locale: a student on a
 * French build may well type a point out of habit, and rejecting that would
 * be marking them wrong for the wrong reason. Grouping separators are not
 * accepted, since no reading in this sim reaches four digits.
 *
 * Returns `null` when the text is not a reading at all, so the caller can tell
 * "not yet answered" from "answered incorrectly".
 */
export const parseReading = (text: string, spec: VernierScaleSpec): number | null => {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (spec.format === ReadingFormat.FRACTIONAL) {
    return parseFractionalInch(trimmed, spec.ticksPerUnit);
  }

  if (spec.format === ReadingFormat.ANGULAR) {
    return parseAngular(trimmed, spec);
  }

  const normalized = trimmed.replace(",", ".");
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value / leastCount(spec) : null;
};

/**
 * Parse `47° 25′`, `47 25`, `47d 25m` or a bare `47` into ticks.
 *
 * The prime and degree characters are awkward to type, so plain letters and
 * bare whitespace-separated numbers are accepted too.
 */
const parseAngular = (text: string, spec: VernierScaleSpec): number | null => {
  const match = /^([+-]?\d+)\s*(?:°|d)?(?:\s+(\d+)\s*(?:′|'|m)?)?$/.exec(text);
  if (match === null) {
    return null;
  }

  const degrees = Number(match[1]);
  const arcminutes = match[2] === undefined ? 0 : Number(match[2]);
  if (arcminutes >= ARCMINUTES_PER_DEGREE) {
    return null;
  }

  const magnitude = Math.abs(degrees) + arcminutes / ARCMINUTES_PER_DEGREE;
  const signedDegrees = text.trimStart().startsWith("-") ? -magnitude : magnitude;
  return signedDegrees / leastCount(spec);
};
