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

import { EnumerationProperty } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import { Enumeration, EnumerationValue } from "scenerystack/phet-core";
import { VernierScaleModel } from "../../common/model/VernierScaleModel.js";
import { MICROMETER_MICRON, PROTRACTOR_FIVE_MINUTE } from "../../common/model/VernierScaleSpec.js";

/** Which instrument is on the bench. */
export class Instrument extends EnumerationValue {
  public static readonly MICROMETER = new Instrument();
  public static readonly PROTRACTOR = new Instrument();

  public static readonly enumeration = new Enumeration(Instrument);
}

/** Starting thimble setting, in millimetres. */
const INITIAL_MICROMETER_MM = 7.373;

/** Starting blade angle, in degrees. 47° 25′ is not a value you can guess. */
const INITIAL_PROTRACTOR_DEG = 47 + 25 / 60;

export class InstrumentsModel implements TModel {
  /** Which instrument the screen is showing. */
  public readonly instrumentProperty = new EnumerationProperty(Instrument.MICROMETER);

  /** The micrometer's sleeve-and-thimble scale. */
  public readonly micrometer = new VernierScaleModel(MICROMETER_MICRON, INITIAL_MICROMETER_MM);

  /** The bevel protractor's circular scale. */
  public readonly protractor = new VernierScaleModel(PROTRACTOR_FIVE_MINUTE, INITIAL_PROTRACTOR_DEG);

  /** The scale belonging to whichever instrument is on show. */
  public get activeScale(): VernierScaleModel {
    return this.instrumentProperty.value === Instrument.MICROMETER ? this.micrometer : this.protractor;
  }

  public reset(): void {
    this.instrumentProperty.reset();
    this.micrometer.reset();
    this.protractor.reset();
  }

  /** Nothing here integrates; the screen is entirely user-driven. */
  public step(_dt: number): void {
    // Intentionally empty.
  }
}
