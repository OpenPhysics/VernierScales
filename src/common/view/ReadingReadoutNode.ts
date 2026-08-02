/**
 * ReadingReadoutNode.ts
 *
 * The reading, shown the way a reader arrives at it rather than as a finished
 * number: the whole main-scale divisions, plus the coincident vernier line times
 * the least count, equals the measurement.
 *
 * Showing the decomposition rather than just the answer is the point. A student
 * who can only read the total has learned nothing transferable; one who can see
 * where each part came from can read an instrument this sim does not contain.
 *
 * Optionally it also shows the true, unquantised size and the gap between the
 * two — the ±½ least count that *is* the instrument's resolution.
 */

import { PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { optionize } from "scenerystack/phet-core";
import { Text, VBox, type VBoxOptions } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import type { VernierScaleModel } from "../model/VernierScaleModel.js";
import {
  createErrorPercentProperty,
  createLeastCountStringProperty,
  createMainPartStringProperty,
  createReadingErrorValueProperty,
  createReadingStringProperty,
  createTrueValueStringProperty,
} from "./readingProperties.js";

type SelfOptions = {
  /** When set, the true value and resolution error appear while it is true. */
  showTrueValueProperty?: TReadOnlyProperty<boolean> | null;

  /** Font size of the headline reading. */
  readingFontSize?: number;
};

export type ReadingReadoutNodeOptions = SelfOptions & VBoxOptions;

export class ReadingReadoutNode extends VBox {
  public constructor(model: VernierScaleModel, providedOptions?: ReadingReadoutNodeOptions) {
    const options = optionize<ReadingReadoutNodeOptions, SelfOptions, VBoxOptions>()(
      {
        showTrueValueProperty: null,
        readingFontSize: 26,
        spacing: 4,
        align: "left",
      },
      providedOptions,
    );

    const common = StringManager.getInstance().getCommonStrings();

    const readingStringProperty = createReadingStringProperty(model.readingTicksProperty, model.specProperty);
    const mainPartStringProperty = createMainPartStringProperty(model.mainDivisionsReadProperty, model.specProperty);
    const leastCountStringProperty = createLeastCountStringProperty(model.specProperty);

    // ── The headline number ───────────────────────────────────────────────────
    const readingText = new Text(readingStringProperty, {
      font: new PhetFont({ size: options.readingFontSize, weight: "bold" }),
      fill: VernierScalesColors.coincidenceColorProperty,
    });

    // ── How it was arrived at ─────────────────────────────────────────────────
    const decompositionText = new Text(
      new PatternStringProperty(common.readingPatternStringProperty, {
        main: mainPartStringProperty,
        index: model.vernierLabelReadProperty,
        leastCount: leastCountStringProperty,
        reading: readingStringProperty,
      }),
      {
        font: new PhetFont(15),
        fill: VernierScalesColors.textColorProperty,
      },
    );

    const children: Text[] = [readingText, decompositionText];

    // ── The truth behind the reading ──────────────────────────────────────────
    if (options.showTrueValueProperty !== null) {
      const trueValueText = new Text(
        new PatternStringProperty(common.labelPatternStringProperty, {
          label: common.trueValueStringProperty,
          value: createTrueValueStringProperty(model.measurementProperty, model.specProperty),
        }),
        {
          font: new PhetFont(14),
          fill: VernierScalesColors.textColorProperty,
          visibleProperty: options.showTrueValueProperty,
        },
      );

      const errorText = new Text(
        new PatternStringProperty(common.labelPatternStringProperty, {
          label: common.readingErrorStringProperty,
          value: new PatternStringProperty(common.errorPatternStringProperty, {
            value: createReadingErrorValueProperty(model.readingErrorProperty, model.specProperty),
            percent: createErrorPercentProperty(model.readingErrorProperty),
          }),
        }),
        {
          font: new PhetFont(14),
          fill: VernierScalesColors.textColorProperty,
          visibleProperty: options.showTrueValueProperty,
        },
      );

      children.push(trueValueText, errorText);
    }

    options.children = children;
    super(options);
  }
}
