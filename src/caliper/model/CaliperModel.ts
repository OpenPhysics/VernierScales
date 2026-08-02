/**
 * CaliperModel.ts
 *
 * A vernier caliper measuring a workpiece, in any of the four ways a caliper can
 * be used. The scale itself is a {@link VernierScaleModel}; this model adds the
 * instrument around it — which jaws are in use, what is being measured, and
 * whether the tool is correctly zeroed.
 *
 * ── One workpiece, four dimensions ────────────────────────────────────────────
 *
 * The four measurement modes are not four different objects; they are four
 * dimensions of the same part, and each keeps its own size. Switching modes
 * therefore swaps which dimension the caliper reads rather than resetting the
 * measurement, which is how the real workflow goes: you check a bore, then a
 * depth, then an outside diameter, on one part.
 */

import { EnumerationProperty, NumberProperty, type Property } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import { CALIPER_SCALE_SPECS, METRIC_FIFTIETH } from "../../common/model/VernierScaleSpec.js";
import { DEFAULT_MEASUREMENT_MM } from "../../VernierScalesConstants.js";

/** Which pair of jaws (or the depth rod) is doing the measuring. */
export class MeasurementMode extends EnumerationValue {
  /** The big lower jaws, closing on an outside dimension. */
  public static readonly OUTSIDE = new MeasurementMode();

  /** The small upper jaws, opening inside a bore. */
  public static readonly INSIDE = new MeasurementMode();

  /** The rod that extends from the tail of the beam into a blind hole. */
  public static readonly DEPTH = new MeasurementMode();

  /** The end face of the beam against the end of the slider, across a shoulder. */
  public static readonly STEP = new MeasurementMode();

  public static readonly enumeration = new Enumeration(MeasurementMode);
}

/** Starting size of each dimension of the workpiece, in millimetres. */
const INITIAL_OUTSIDE_MM = DEFAULT_MEASUREMENT_MM;
const INITIAL_INSIDE_MM = 16.6;
const INITIAL_DEPTH_MM = 31.45;
const INITIAL_STEP_MM = 8.72;

export class CaliperModel implements TModel {
  /** The caliper's scales. */
  public readonly scale: VernierScaleModel;

  /** Which jaws are in use. */
  public readonly measurementModeProperty = new EnumerationProperty(MeasurementMode.OUTSIDE);

  /**
   * Whether the jaws snap to exactly readable sizes. Lives on the scale so that
   * every `setMeasurement` call — jaw drag, scale drag, keyboard — honours it.
   */
  public readonly snapToReadableProperty: Property<boolean>;

  /** Size of each dimension of the workpiece, in millimetres. */
  private readonly outsideDimensionProperty = new NumberProperty(INITIAL_OUTSIDE_MM);
  private readonly insideDimensionProperty = new NumberProperty(INITIAL_INSIDE_MM);
  private readonly depthDimensionProperty = new NumberProperty(INITIAL_DEPTH_MM);
  private readonly stepDimensionProperty = new NumberProperty(INITIAL_STEP_MM);

  public constructor() {
    this.scale = new VernierScaleModel(METRIC_FIFTIETH, INITIAL_OUTSIDE_MM);
    this.snapToReadableProperty = this.scale.snapToReadableEnabledProperty;

    // Keep the active dimension and the scale's measurement in step. Only one of
    // the two links can fire at a time — a mode change writes the stored size in,
    // a jaw drag writes the new size out — so there is no feedback loop to break.
    this.measurementModeProperty.lazyLink((mode) => {
      this.scale.setMeasurement(this.dimensionPropertyFor(mode).value);
    });
    this.scale.measurementProperty.lazyLink((measurement) => {
      this.dimensionPropertyFor(this.measurementModeProperty.value).value = measurement;
    });
  }

  /** The dimension currently under the jaws, in millimetres. */
  public get activeDimension(): number {
    return this.dimensionPropertyFor(this.measurementModeProperty.value).value;
  }

  /** The scale presets this screen offers. */
  public get availableSpecs(): readonly (typeof CALIPER_SCALE_SPECS)[number][] {
    return CALIPER_SCALE_SPECS;
  }

  public reset(): void {
    this.measurementModeProperty.reset();
    this.snapToReadableProperty.reset();
    this.outsideDimensionProperty.reset();
    this.insideDimensionProperty.reset();
    this.depthDimensionProperty.reset();
    this.stepDimensionProperty.reset();
    this.scale.reset();
    this.scale.setMeasurement(INITIAL_OUTSIDE_MM);
  }

  /** Nothing here integrates; the screen is entirely user-driven. */
  public step(_dt: number): void {
    // Intentionally empty.
  }

  private dimensionPropertyFor(mode: MeasurementMode): NumberProperty {
    switch (mode) {
      case MeasurementMode.OUTSIDE:
        return this.outsideDimensionProperty;
      case MeasurementMode.INSIDE:
        return this.insideDimensionProperty;
      case MeasurementMode.DEPTH:
        return this.depthDimensionProperty;
      case MeasurementMode.STEP:
        return this.stepDimensionProperty;
      default:
        throw new Error(`Unhandled MeasurementMode: ${mode}`);
    }
  }
}
