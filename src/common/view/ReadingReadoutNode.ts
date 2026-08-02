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
 * The headline and the decomposition always follow what the scales *display*
 * ({@link VernierScaleModel.rawReadingTicksProperty}). When a zero error is in
 * play those disagree with the corrected measurement, so a separate "Corrected"
 * line appears — otherwise the equation on screen would not add up.
 *
 * Optionally it also shows the true, unquantised size and the gap between the
 * two — the ±½ least count that *is* the instrument's resolution.
 */

import { DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
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

    // What the scales show — the number the decomposition must equal.
    const rawReadingStringProperty = createReadingStringProperty(model.rawReadingTicksProperty, model.specProperty);
    const correctedReadingStringProperty = createReadingStringProperty(model.readingTicksProperty, model.specProperty);
    const mainPartStringProperty = createMainPartStringProperty(model.mainDivisionsReadProperty, model.specProperty);
    const leastCountStringProperty = createLeastCountStringProperty(model.specProperty);

    const hasZeroErrorProperty = new DerivedProperty(
      [model.zeroErrorTicksProperty],
      (zeroErrorTicks) => zeroErrorTicks !== 0,
    );

    // ── The headline number ───────────────────────────────────────────────────
    // Labelled "Scale reads" only while a zero error is active, so the student
    // can tell the big number apart from the corrected line beneath.
    const rawLabel = new Text(common.rawReadingStringProperty, {
      font: new PhetFont(13),
      fill: VernierScalesColors.textColorProperty,
      visibleProperty: hasZeroErrorProperty,
    });

    const readingText = new Text(rawReadingStringProperty, {
      font: new PhetFont({ size: options.readingFontSize, weight: "bold" }),
      fill: VernierScalesColors.coincidenceColorProperty,
    });

    // ── How it was arrived at ─────────────────────────────────────────────────
    const decompositionText = new Text(
      new PatternStringProperty(common.readingPatternStringProperty, {
        main: mainPartStringProperty,
        index: model.vernierLabelReadProperty,
        leastCount: leastCountStringProperty,
        reading: rawReadingStringProperty,
      }),
      {
        font: new PhetFont(15),
        fill: VernierScalesColors.textColorProperty,
      },
    );

    // Only meaningful when the scales and the true measurement disagree.
    const correctedText = new Text(
      new PatternStringProperty(common.labelPatternStringProperty, {
        label: common.correctedReadingStringProperty,
        value: correctedReadingStringProperty,
      }),
      {
        font: new PhetFont({ size: 15, weight: "bold" }),
        fill: VernierScalesColors.textColorProperty,
        visibleProperty: hasZeroErrorProperty,
      },
    );

    const children: Text[] = [rawLabel, readingText, decompositionText, correctedText];

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
