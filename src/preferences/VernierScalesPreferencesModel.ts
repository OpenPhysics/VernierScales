/**
 * VernierScalesPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in vernierScalesQueryParameters.
 *
 * The sim has one preference: whether the magnified view of the coincidence
 * starts visible.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import VernierScalesNamespace from "../VernierScalesNamespace.js";
import vernierScalesQueryParameters from "./vernierScalesQueryParameters.js";

export class VernierScalesPreferencesModel {
  /** Whether the magnified view starts visible; initial value from `startMagnified`. */
  public readonly startMagnifiedProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.startMagnifiedProperty = new BooleanProperty(
      vernierScalesQueryParameters.startMagnified,
      tandem ? { tandem: tandem.createTandem("startMagnifiedProperty") } : undefined,
    );
  }

  public reset(): void {
    this.startMagnifiedProperty.reset();
  }
}

VernierScalesNamespace.register("VernierScalesPreferencesModel", VernierScalesPreferencesModel);
