/**
 * readingProperties.ts
 *
 * Reactive glue between the model's numeric readings and the text on screen.
 *
 * Every reading shown anywhere in this sim goes through here, for two reasons.
 * It keeps `Intl.NumberFormat` — and therefore the locale's decimal separator —
 * in one place rather than scattered through four screens; and it makes the
 * readouts depend on {@link localeProperty}, so switching language in
 * Preferences re-renders `23.14 mm` as `23,14 mm` without a reload.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { localeProperty } from "scenerystack/joist";
import { StringManager } from "../../i18n/StringManager.js";
import { formatLeastCount, formatReading, unitSymbol } from "../model/readingFormat.js";
import { leastCount, toSpecUnits, type VernierScaleSpec } from "../model/VernierScaleSpec.js";

/**
 * PhET locale codes use an underscore (`zh_CN`); BCP 47 — and therefore `Intl` —
 * wants a hyphen. Unknown or malformed codes fall back to the browser default
 * rather than throwing, since a bad separator is a cosmetic problem and a thrown
 * RangeError in a readout is not.
 */
const intlLocale = (locale: string): string => locale.replace("_", "-");

/** A reading in ticks, rendered with its unit in the current locale. */
export const createReadingStringProperty = (
  ticksProperty: TReadOnlyProperty<number>,
  specProperty: TReadOnlyProperty<VernierScaleSpec>,
): TReadOnlyProperty<string> =>
  new DerivedProperty([ticksProperty, specProperty, localeProperty], (ticks, spec, locale) =>
    formatReading(ticks, spec, intlLocale(locale)),
  );

/** The active scale's least count, rendered the way its readings are. */
export const createLeastCountStringProperty = (
  specProperty: TReadOnlyProperty<VernierScaleSpec>,
): TReadOnlyProperty<string> =>
  new DerivedProperty([specProperty, localeProperty], (spec, locale) => formatLeastCount(spec, intlLocale(locale)));

/**
 * The whole-main-divisions part of a reading, rendered with its unit — the first
 * number a reader transcribes, taken off the main scale.
 */
export const createMainPartStringProperty = (
  mainDivisionsProperty: TReadOnlyProperty<number>,
  specProperty: TReadOnlyProperty<VernierScaleSpec>,
): TReadOnlyProperty<string> =>
  new DerivedProperty([mainDivisionsProperty, specProperty, localeProperty], (mainDivisions, spec, locale) =>
    formatReading(mainDivisions * spec.divisions, spec, intlLocale(locale)),
  );

/** One vernier division, in the scale's units — the Principle screen's headline number. */
export const createVernierDivisionStringProperty = (
  vernierDivisionProperty: TReadOnlyProperty<number>,
  specProperty: TReadOnlyProperty<VernierScaleSpec>,
): TReadOnlyProperty<string> =>
  new DerivedProperty([vernierDivisionProperty, specProperty, localeProperty], (value, spec, locale) =>
    formatDecimalWithUnit(value, spec, intlLocale(locale)),
  );

/** A raw value in spec units with the spec's unit symbol and decimal places. */
const formatDecimalWithUnit = (value: number, spec: VernierScaleSpec, locale: string): string =>
  `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: spec.decimalPlaces,
    maximumFractionDigits: spec.decimalPlaces,
    useGrouping: false,
  }).format(value)} ${unitSymbol(spec)}`;

/**
 * The localized display name of whichever scale preset is active.
 *
 * Listing every name Property as a dependency looks heavy-handed next to a
 * lookup, but a `DerivedProperty` has to declare what it reads: without the full
 * list the name would go stale when the locale changed and only refresh the next
 * time the spec did.
 */
export const createScaleNameProperty = (
  specProperty: TReadOnlyProperty<VernierScaleSpec>,
): TReadOnlyProperty<string> => {
  const byId = scaleNameProperties();

  return DerivedProperty.deriveAny([specProperty, ...Object.values(byId)], () => {
    const named = byId[specProperty.value.id];

    // The Principle screen synthesizes specs that have no preset name; falling
    // back to the division count keeps the readout meaningful there.
    return named === undefined ? `${specProperty.value.divisions}` : named.value;
  });
};

/** Every preset's display name, keyed by {@link VernierScaleSpec.id}. */
export const scaleNameProperties = (): Record<string, TReadOnlyProperty<string>> => {
  const scales = StringManager.getInstance().getCommonStrings().scales;
  return {
    metricTenth: scales.metricTenthStringProperty,
    metricTwentieth: scales.metricTwentiethStringProperty,
    metricFiftieth: scales.metricFiftiethStringProperty,
    metricHalfMillimetre: scales.metricHalfMillimetreStringProperty,
    inchThou: scales.inchThouStringProperty,
    inchHalfThou: scales.inchHalfThouStringProperty,
    inch128: scales.inch128StringProperty,
    inch64: scales.inch64StringProperty,
    protractorFiveMinute: scales.protractorFiveMinuteStringProperty,
    micrometerMicron: scales.micrometerMicronStringProperty,
  };
};

/**
 * The resolution error, signed, in the scale's own units.
 *
 * Always signed: a reading 0.006 mm *under* the truth is a different lesson from
 * one 0.006 mm over, and an unsigned figure hides which way the rounding went.
 */
export const createReadingErrorValueProperty = (
  readingErrorProperty: TReadOnlyProperty<number>,
  specProperty: TReadOnlyProperty<VernierScaleSpec>,
): TReadOnlyProperty<string> =>
  new DerivedProperty([readingErrorProperty, specProperty, localeProperty], (errorTicks, spec, locale) => {
    const formatted = new Intl.NumberFormat(intlLocale(locale), {
      minimumFractionDigits: spec.decimalPlaces + 1,
      maximumFractionDigits: spec.decimalPlaces + 1,
      signDisplay: "exceptZero",
      useGrouping: false,
    }).format(errorTicks * leastCount(spec));
    return `${formatted} ${unitSymbol(spec)}`;
  });

/** The reading error as a percentage of one least count, e.g. `-38%`. */
export const createErrorPercentProperty = (
  readingErrorProperty: TReadOnlyProperty<number>,
): TReadOnlyProperty<string> =>
  new DerivedProperty([readingErrorProperty, localeProperty], (error, locale) =>
    new Intl.NumberFormat(intlLocale(locale), { style: "percent", maximumFractionDigits: 0 }).format(error),
  );

/** The true (unquantised) size, rendered in the active scale's units. */
export const createTrueValueStringProperty = (
  measurementProperty: TReadOnlyProperty<number>,
  specProperty: TReadOnlyProperty<VernierScaleSpec>,
): TReadOnlyProperty<string> =>
  new DerivedProperty([measurementProperty, specProperty, localeProperty], (measurement, spec, locale) => {
    // One more decimal place than the scale can resolve, so the true value reads
    // as visibly finer than the reading rather than looking identical to it.
    const specValue = toSpecUnits(spec, measurement);
    return `${new Intl.NumberFormat(intlLocale(locale), {
      minimumFractionDigits: spec.decimalPlaces + 1,
      maximumFractionDigits: spec.decimalPlaces + 1,
      useGrouping: false,
    }).format(specValue)} ${unitSymbol(spec)}`;
  });
