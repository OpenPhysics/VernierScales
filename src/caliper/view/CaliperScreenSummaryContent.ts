/**
 * CaliperScreenSummaryContent.ts
 *
 * The accessible screen summary for the Caliper screen.
 *
 * The live paragraph names the jaws in use, the scale fitted, and the two
 * numbers that make up the reading. Coincidence cannot be seen without sight, so
 * saying which line coincides is not a courtesy here — it is the measurement.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import {
  createMainPartStringProperty,
  createReadingStringProperty,
  createScaleNameProperty,
} from "../../common/view/readingProperties.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { CaliperModel } from "../model/CaliperModel.js";
import { MeasurementMode } from "../model/CaliperModel.js";

export class CaliperScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: CaliperModel) {
    const a11y = StringManager.getInstance().getCaliperA11yStrings();
    const modes = StringManager.getInstance().getCaliperStrings().modes;

    const modeNameProperty = new DerivedProperty(
      [
        model.measurementModeProperty,
        modes.outsideStringProperty,
        modes.insideStringProperty,
        modes.depthStringProperty,
        modes.stepStringProperty,
      ],
      (mode, outside, inside, depth, step) => {
        switch (mode) {
          case MeasurementMode.OUTSIDE:
            return outside;
          case MeasurementMode.INSIDE:
            return inside;
          case MeasurementMode.DEPTH:
            return depth;
          case MeasurementMode.STEP:
            return step;
        }
      },
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsStringProperty, {
        mode: modeNameProperty,
        scale: createScaleNameProperty(model.scale.specProperty),
        main: createMainPartStringProperty(model.scale.mainDivisionsReadProperty, model.scale.specProperty),
        index: model.scale.vernierLabelReadProperty,
        reading: createReadingStringProperty(model.scale.readingTicksProperty, model.scale.specProperty),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
