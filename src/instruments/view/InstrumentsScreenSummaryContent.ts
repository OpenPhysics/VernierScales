/**
 * InstrumentsScreenSummaryContent.ts
 *
 * The accessible screen summary for the Instruments screen.
 *
 * The live paragraph follows whichever instrument is on the bench, using
 * `DynamicProperty`-style switching over the two models so the description never
 * reports the micrometer's reading while the protractor is showing.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { createMainPartStringProperty, createReadingStringProperty } from "../../common/view/readingProperties.js";
import { StringManager } from "../../i18n/StringManager.js";
import { Instrument, type InstrumentsModel } from "../model/InstrumentsModel.js";

export class InstrumentsScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: InstrumentsModel) {
    const a11y = StringManager.getInstance().getInstrumentsA11yStrings();
    const names = StringManager.getInstance().getInstrumentsStrings().names;

    const instrumentNameProperty = new DerivedProperty(
      [model.instrumentProperty, names.micrometerStringProperty, names.protractorStringProperty],
      (instrument, micrometer, protractor) => (instrument === Instrument.MICROMETER ? micrometer : protractor),
    );

    // Each instrument's parts are built separately and then selected between,
    // because the two scales have different units and different least counts.
    const micrometerMain = createMainPartStringProperty(
      model.micrometer.mainDivisionsReadProperty,
      model.micrometer.specProperty,
    );
    const protractorMain = createMainPartStringProperty(
      model.protractor.mainDivisionsReadProperty,
      model.protractor.specProperty,
    );
    const micrometerReading = createReadingStringProperty(
      model.micrometer.readingTicksProperty,
      model.micrometer.specProperty,
    );
    const protractorReading = createReadingStringProperty(
      model.protractor.readingTicksProperty,
      model.protractor.specProperty,
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsStringProperty, {
        instrument: instrumentNameProperty,
        main: new DerivedProperty(
          [model.instrumentProperty, micrometerMain, protractorMain],
          (instrument, micrometer, protractor) => (instrument === Instrument.MICROMETER ? micrometer : protractor),
        ),
        index: new DerivedProperty(
          [
            model.instrumentProperty,
            model.micrometer.vernierLabelReadProperty,
            model.protractor.vernierLabelReadProperty,
          ],
          (instrument, micrometer, protractor) => (instrument === Instrument.MICROMETER ? micrometer : protractor),
        ),
        reading: new DerivedProperty(
          [model.instrumentProperty, micrometerReading, protractorReading],
          (instrument, micrometer, protractor) => (instrument === Instrument.MICROMETER ? micrometer : protractor),
        ),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
