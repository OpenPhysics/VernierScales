/**
 * VernierScaleModel.ts
 *
 * The reactive wrapper around {@link ./vernier.ts}: one readable vernier
 * instrument, as Properties the view can observe. Every screen in this sim owns
 * one of these, which is why it lives in `common/model/`.
 *
 * ── What is the source of truth ───────────────────────────────────────────────
 *
 * {@link measurementProperty} holds the *true* size of whatever is being
 * measured, in canonical units (millimetres for length, degrees for angle) — not
 * in the active scale's own units and not in ticks. Two consequences worth
 * knowing about:
 *
 *  - Switching a caliper from millimetres to inches re-measures the *same
 *    object* rather than reinterpreting the number, which is what a user
 *    flipping the units toggle expects to see.
 *  - The true value is continuous while the reading is quantised, so the
 *    resolution error is a real, observable quantity rather than something the
 *    model has rounded away. {@link readingErrorProperty} exposes it.
 *
 * ── Zero error ────────────────────────────────────────────────────────────────
 *
 * A miscalibrated instrument does not read zero with its jaws shut. That offset
 * is added to what the scales *display* ({@link offsetTicksProperty}) and then
 * subtracted again to recover the true size ({@link readingTicksProperty}), so
 * the sim can show the raw and corrected readings side by side.
 */

import { DerivedProperty, NumberProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import {
  canonicalRange,
  canonicalToTicks,
  leastCount,
  ticksToCanonical,
  type VernierScaleSpec,
} from "./VernierScaleSpec.js";
import {
  coincidentIndex,
  correctForZeroError,
  mainDivisionsRead,
  readingError,
  readingTicks,
  vernierLabelRead,
} from "./vernier.js";

export class VernierScaleModel {
  /** Which instrument scale is active. */
  public readonly specProperty: Property<VernierScaleSpec>;

  /** True size of the measured object, in canonical units (mm, or degrees). */
  public readonly measurementProperty: NumberProperty;

  /** Miscalibration of the instrument, in ticks. Zero for a correctly set tool. */
  public readonly zeroErrorTicksProperty: NumberProperty;

  /**
   * When true, {@link setMeasurement} quantises to the nearest least count.
   * Used by the Caliper screen's "Snap to readable values" control so that jaw
   * and scale drags stay on exactly readable sizes.
   */
  public readonly snapToReadableEnabledProperty: Property<boolean>;

  /** Largest measurement the active scale can take, in canonical units. */
  public readonly measurementRangeProperty: TReadOnlyProperty<number>;

  /**
   * Where the vernier's zero mark sits, in ticks — what the instrument
   * *displays*, so it includes any zero error.
   */
  public readonly offsetTicksProperty: TReadOnlyProperty<number>;

  /** The reading as transcribed off the scales, before correcting for zero error. */
  public readonly rawReadingTicksProperty: TReadOnlyProperty<number>;

  /** The reading after subtracting the zero error — the reported measurement. */
  public readonly readingTicksProperty: TReadOnlyProperty<number>;

  /** Index of the vernier tick that lines up; the view highlights this one. */
  public readonly coincidentIndexProperty: TReadOnlyProperty<number>;

  /** Whole main-scale divisions in the raw reading — the reader's first number. */
  public readonly mainDivisionsReadProperty: TReadOnlyProperty<number>;

  /** The vernier number under the coincident tick — the reader's second number. */
  public readonly vernierLabelReadProperty: TReadOnlyProperty<number>;

  /** Reading minus truth, in ticks. Always within ±½ a least count. */
  public readonly readingErrorProperty: TReadOnlyProperty<number>;

  /** The reported measurement in canonical units, for comparison with the truth. */
  public readonly readingValueProperty: TReadOnlyProperty<number>;

  public constructor(initialSpec: VernierScaleSpec, initialMeasurement: number) {
    this.specProperty = new Property(initialSpec);
    this.measurementProperty = new NumberProperty(initialMeasurement);
    this.zeroErrorTicksProperty = new NumberProperty(0);
    this.snapToReadableEnabledProperty = new Property(false);

    this.measurementRangeProperty = new DerivedProperty([this.specProperty], (spec) => canonicalRange(spec));

    this.offsetTicksProperty = new DerivedProperty(
      [this.specProperty, this.measurementProperty, this.zeroErrorTicksProperty],
      (spec, measurement, zeroErrorTicks) => canonicalToTicks(spec, measurement) + zeroErrorTicks,
    );

    this.rawReadingTicksProperty = new DerivedProperty([this.offsetTicksProperty], (offsetTicks) =>
      readingTicks(offsetTicks),
    );

    this.readingTicksProperty = new DerivedProperty(
      [this.rawReadingTicksProperty, this.zeroErrorTicksProperty],
      (rawReading, zeroErrorTicks) => correctForZeroError(rawReading, zeroErrorTicks),
    );

    this.coincidentIndexProperty = new DerivedProperty(
      [this.offsetTicksProperty, this.specProperty],
      (offsetTicks, spec) => coincidentIndex(offsetTicks, spec.type, spec.divisions),
    );

    this.mainDivisionsReadProperty = new DerivedProperty(
      [this.offsetTicksProperty, this.specProperty],
      (offsetTicks, spec) => mainDivisionsRead(offsetTicks, spec.divisions),
    );

    this.vernierLabelReadProperty = new DerivedProperty(
      [this.offsetTicksProperty, this.specProperty],
      (offsetTicks, spec) => vernierLabelRead(offsetTicks, spec.divisions),
    );

    this.readingErrorProperty = new DerivedProperty([this.offsetTicksProperty], (offsetTicks) =>
      readingError(offsetTicks),
    );

    this.readingValueProperty = new DerivedProperty([this.readingTicksProperty, this.specProperty], (ticks, spec) =>
      ticksToCanonical(spec, ticks),
    );
  }

  /** Set the measured size, clamped to what the active scale can actually take. */
  public setMeasurement(canonicalValue: number): void {
    let value = Math.max(0, Math.min(canonicalValue, this.measurementRangeProperty.value));
    if (this.snapToReadableEnabledProperty.value) {
      const spec = this.specProperty.value;
      value = ticksToCanonical(spec, Math.round(canonicalToTicks(spec, value)));
    }
    this.measurementProperty.value = value;
  }

  /**
   * Nudge the measurement by a whole number of least counts — the step a keyboard
   * user gets from the arrow keys, and the only step size that keeps an exactly
   * readable value exactly readable.
   */
  public stepByLeastCount(steps: number): void {
    const spec = this.specProperty.value;
    const ticks = canonicalToTicks(spec, this.measurementProperty.value);
    this.setMeasurement(ticksToCanonical(spec, Math.round(ticks) + steps));
  }

  /** Nudge the measurement by whole main-scale divisions — the Page Up/Down step. */
  public stepByMainDivision(steps: number): void {
    this.stepByLeastCount(steps * this.specProperty.value.divisions);
  }

  /** Snap the measurement to the nearest exactly readable value. */
  public snapToReadable(): void {
    const spec = this.specProperty.value;
    this.setMeasurement(ticksToCanonical(spec, Math.round(canonicalToTicks(spec, this.measurementProperty.value))));
  }

  /** The active scale's least count, in canonical units. */
  public get canonicalLeastCount(): number {
    const spec = this.specProperty.value;
    return ticksToCanonical(spec, 1) - ticksToCanonical(spec, 0) || leastCount(spec);
  }

  public reset(): void {
    this.specProperty.reset();
    this.measurementProperty.reset();
    this.zeroErrorTicksProperty.reset();
    this.snapToReadableEnabledProperty.reset();
  }
}
