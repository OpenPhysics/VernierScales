/**
 * InstrumentsModel.ts
 *
 * Two instruments that are not calipers, to show that the vernier principle owes
 * nothing to calipers in particular:
 *
 *  - a **vernier micrometer**, where the vernier reads a *rotating* thimble scale
 *    and buys a further decimal place (0.001 mm on a 0.01 mm thimble); and
 *  - a **bevel protractor**, whose scale is a circle and whose least count is an
 *    angle, five arcminutes.
 *
 * Each instrument keeps its own {@link VernierScaleModel} because their units
 * differ — millimetres against degrees — and a single model would have to
 * pretend otherwise.
 */

import { Property } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import { MICROMETER_MICRON, PROTRACTOR_FIVE_MINUTE } from "../../common/model/VernierScaleSpec.js";

/** Which instrument is on the bench. */
export const Instrument = {
  MICROMETER: "micrometer",
  PROTRACTOR: "protractor",
} as const;

export type Instrument = (typeof Instrument)[keyof typeof Instrument];

/** Every instrument, in the order the selector lists them. */
export const ALL_INSTRUMENTS: readonly Instrument[] = [Instrument.MICROMETER, Instrument.PROTRACTOR] as const;

/** Starting thimble setting, in millimetres. */
const INITIAL_MICROMETER_MM = 7.373;

/** Starting blade angle, in degrees. 47° 25′ is not a value you can guess. */
const INITIAL_PROTRACTOR_DEG = 47 + 25 / 60;

export class InstrumentsModel implements TModel {
  /** Which instrument the screen is showing. */
  public readonly instrumentProperty = new Property<Instrument>(Instrument.MICROMETER);

  /** The micrometer's sleeve-and-thimble scale. */
  public readonly micrometer = new VernierScaleModel(MICROMETER_MICRON, INITIAL_MICROMETER_MM);

  /** The bevel protractor's circular scale. */
  public readonly protractor = new VernierScaleModel(PROTRACTOR_FIVE_MINUTE, INITIAL_PROTRACTOR_DEG);

  /** Whether to reveal the true value alongside the reading. */
  public readonly showTrueValueProperty = new Property(false);

  /** The scale belonging to whichever instrument is on show. */
  public get activeScale(): VernierScaleModel {
    return this.instrumentProperty.value === Instrument.MICROMETER ? this.micrometer : this.protractor;
  }

  public reset(): void {
    this.instrumentProperty.reset();
    this.showTrueValueProperty.reset();
    this.micrometer.reset();
    this.protractor.reset();
  }

  /** Nothing here integrates; the screen is entirely user-driven. */
  public step(_dt: number): void {
    // Intentionally empty.
  }
}
