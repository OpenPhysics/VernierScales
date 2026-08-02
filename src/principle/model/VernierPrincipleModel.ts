/**
 * VernierPrincipleModel.ts
 *
 * The abstract screen: two bare scales, no instrument around them. The user
 * chooses the vernier geometry and how many divisions it has, then slides it
 * along the main scale and watches which tick lines up.
 *
 * This is the only screen where the scale is *synthesized* rather than picked
 * from the real-instrument presets, because its point is that the vernier
 * principle is a relationship between two division sizes and nothing else.
 */

import { DerivedProperty, NumberProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import { createPrincipleSpec, leastCount, type VernierScaleSpec } from "../../common/model/VernierScaleSpec.js";
import { VernierType, vernierDivisionTicks } from "../../common/model/vernier.js";

/** Where the vernier starts, in millimetres — a deliberately unreadable value. */
const INITIAL_OFFSET_MM = 12.7;

/** Divisions the screen starts with: few enough to count, enough to be interesting. */
const INITIAL_DIVISIONS = 10;

export class VernierPrincipleModel implements TModel {
  /** Which of the three vernier geometries is on show. */
  public readonly vernierTypeProperty = new Property<VernierType>(VernierType.DIRECT);

  /** How many divisions the vernier has — the `n` that sets the least count. */
  public readonly divisionsProperty = new NumberProperty(INITIAL_DIVISIONS);

  /** Whether to draw the guide line marking the coincidence. */
  public readonly showConvergenceProperty = new Property(true);

  /** The scale being read. Its spec is rebuilt whenever the choices above change. */
  public readonly scale: VernierScaleModel;

  /** One vernier division, in millimetres — the number the geometry is really about. */
  public readonly vernierDivisionProperty: TReadOnlyProperty<number>;

  /** One main division minus one vernier division; equals the least count, always. */
  public readonly leastCountProperty: TReadOnlyProperty<number>;

  public constructor() {
    this.scale = new VernierScaleModel(createPrincipleSpec(VernierType.DIRECT, INITIAL_DIVISIONS), INITIAL_OFFSET_MM);

    // The spec is a function of the two choices, so rebuild it rather than
    // mutate: VernierScaleSpec is deeply readonly and every derived Property
    // downstream keys off the spec instance.
    const rebuildSpec = (): void => {
      this.scale.specProperty.value = createPrincipleSpec(this.vernierTypeProperty.value, this.divisionsProperty.value);
    };
    this.vernierTypeProperty.lazyLink(rebuildSpec);
    this.divisionsProperty.lazyLink(rebuildSpec);

    this.vernierDivisionProperty = new DerivedProperty(
      [this.scale.specProperty],
      (spec: VernierScaleSpec) => vernierDivisionTicks(spec.type, spec.divisions) * leastCount(spec),
    );

    this.leastCountProperty = new DerivedProperty([this.scale.specProperty], (spec: VernierScaleSpec) =>
      leastCount(spec),
    );
  }

  public reset(): void {
    // Reset the choices first — each rebuilds the spec — then let the scale's own
    // reset have the last word on the measurement.
    this.vernierTypeProperty.reset();
    this.divisionsProperty.reset();
    this.showConvergenceProperty.reset();
    this.scale.reset();
    this.scale.specProperty.value = createPrincipleSpec(VernierType.DIRECT, INITIAL_DIVISIONS);
  }

  /** Nothing here integrates; the screen is entirely user-driven. */
  public step(_dt: number): void {
    // Intentionally empty.
  }
}
