/**
 * VernierScalesPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in vernierScalesQueryParameters, and is the
 * single source of truth for the display default it controls — the screens pass
 * it straight to the view node that renders it, the same way startMagnified is
 * passed as the magnified view's visibleProperty.
 *
 * Because these are display preferences (not model state), they are reset by
 * the Preferences dialog, not by the screens' Reset All buttons.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import VernierScalesNamespace from "../VernierScalesNamespace.js";
import vernierScalesQueryParameters from "./vernierScalesQueryParameters.js";

export class VernierScalesPreferencesModel {
  /** Whether the magnified view starts visible; initial value from `startMagnified`. */
  public readonly startMagnifiedProperty: BooleanProperty;

  /** Whether the true value is revealed; initial value from `showTrueValue`. */
  public readonly showTrueValueProperty: BooleanProperty;

  /** Whether the coincident-line guide is drawn; initial value from `showCoincidenceMarker`. */
  public readonly showCoincidenceMarkerProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.startMagnifiedProperty = new BooleanProperty(
      vernierScalesQueryParameters.startMagnified,
      tandem ? { tandem: tandem.createTandem("startMagnifiedProperty") } : undefined,
    );
    this.showTrueValueProperty = new BooleanProperty(
      vernierScalesQueryParameters.showTrueValue,
      tandem ? { tandem: tandem.createTandem("showTrueValueProperty") } : undefined,
    );
    this.showCoincidenceMarkerProperty = new BooleanProperty(
      vernierScalesQueryParameters.showCoincidenceMarker,
      tandem ? { tandem: tandem.createTandem("showCoincidenceMarkerProperty") } : undefined,
    );
  }

  public reset(): void {
    this.startMagnifiedProperty.reset();
    this.showTrueValueProperty.reset();
    this.showCoincidenceMarkerProperty.reset();
  }
}

VernierScalesNamespace.register("VernierScalesPreferencesModel", VernierScalesPreferencesModel);
