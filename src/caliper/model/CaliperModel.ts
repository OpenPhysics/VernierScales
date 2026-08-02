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

import { NumberProperty, Property } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import { CALIPER_SCALE_SPECS, METRIC_FIFTIETH } from "../../common/model/VernierScaleSpec.js";
import { DEFAULT_MEASUREMENT_MM } from "../../VernierScalesConstants.js";

/** Which pair of jaws (or the depth rod) is doing the measuring. */
export const MeasurementMode = {
  /** The big lower jaws, closing on an outside dimension. */
  OUTSIDE: "outside",
  /** The small upper jaws, opening inside a bore. */
  INSIDE: "inside",
  /** The rod that extends from the tail of the beam into a blind hole. */
  DEPTH: "depth",
  /** The end face of the beam against the end of the slider, across a shoulder. */
  STEP: "step",
} as const;

export type MeasurementMode = (typeof MeasurementMode)[keyof typeof MeasurementMode];

/** Every mode, in the order the selector lists them. */
export const ALL_MEASUREMENT_MODES: readonly MeasurementMode[] = [
  MeasurementMode.OUTSIDE,
  MeasurementMode.INSIDE,
  MeasurementMode.DEPTH,
  MeasurementMode.STEP,
] as const;

/** Starting size of each dimension of the workpiece, in millimetres. */
const INITIAL_DIMENSIONS_MM: Record<MeasurementMode, number> = {
  [MeasurementMode.OUTSIDE]: DEFAULT_MEASUREMENT_MM,
  [MeasurementMode.INSIDE]: 16.6,
  [MeasurementMode.DEPTH]: 31.45,
  [MeasurementMode.STEP]: 8.72,
};

export class CaliperModel implements TModel {
  /** The caliper's scales. */
  public readonly scale: VernierScaleModel;

  /** Which jaws are in use. */
  public readonly measurementModeProperty = new Property<MeasurementMode>(MeasurementMode.OUTSIDE);

  /**
   * Whether the jaws snap to exactly readable sizes. Lives on the scale so that
   * every `setMeasurement` call — jaw drag, scale drag, keyboard — honours it.
   */
  public readonly snapToReadableProperty: Property<boolean>;

  /** Size of each dimension of the workpiece, in millimetres. */
  private readonly dimensionProperties: Record<MeasurementMode, NumberProperty>;

  public constructor() {
    this.scale = new VernierScaleModel(METRIC_FIFTIETH, INITIAL_DIMENSIONS_MM[MeasurementMode.OUTSIDE]);
    this.snapToReadableProperty = this.scale.snapToReadableEnabledProperty;

    this.dimensionProperties = {
      [MeasurementMode.OUTSIDE]: new NumberProperty(INITIAL_DIMENSIONS_MM[MeasurementMode.OUTSIDE]),
      [MeasurementMode.INSIDE]: new NumberProperty(INITIAL_DIMENSIONS_MM[MeasurementMode.INSIDE]),
      [MeasurementMode.DEPTH]: new NumberProperty(INITIAL_DIMENSIONS_MM[MeasurementMode.DEPTH]),
      [MeasurementMode.STEP]: new NumberProperty(INITIAL_DIMENSIONS_MM[MeasurementMode.STEP]),
    };

    // Keep the active dimension and the scale's measurement in step. Only one of
    // the two links can fire at a time — a mode change writes the stored size in,
    // a jaw drag writes the new size out — so there is no feedback loop to break.
    this.measurementModeProperty.lazyLink((mode) => {
      this.scale.setMeasurement(this.dimensionProperties[mode].value);
    });
    this.scale.measurementProperty.lazyLink((measurement) => {
      this.dimensionProperties[this.measurementModeProperty.value].value = measurement;
    });
  }

  /** The dimension currently under the jaws, in millimetres. */
  public get activeDimension(): number {
    return this.dimensionProperties[this.measurementModeProperty.value].value;
  }

  /** The scale presets this screen offers. */
  public get availableSpecs(): readonly (typeof CALIPER_SCALE_SPECS)[number][] {
    return CALIPER_SCALE_SPECS;
  }

  public reset(): void {
    this.measurementModeProperty.reset();
    this.snapToReadableProperty.reset();
    for (const mode of ALL_MEASUREMENT_MODES) {
      this.dimensionProperties[mode].reset();
    }
    this.scale.reset();
    this.scale.setMeasurement(INITIAL_DIMENSIONS_MM[MeasurementMode.OUTSIDE]);
  }

  /** Nothing here integrates; the screen is entirely user-driven. */
  public step(_dt: number): void {
    // Intentionally empty.
  }
}
