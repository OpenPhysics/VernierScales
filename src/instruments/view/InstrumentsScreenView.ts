/**
 * InstrumentsScreenView.ts
 *
 * One instrument at a time — micrometer or bevel protractor — with the same
 * scale views and readout the other screens use.
 *
 * Both instruments keep their own model, because their units differ. Only one is
 * visible and only one is in the traversal order at a time, so the screen never
 * offers a keyboard user a control for an instrument they cannot see.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { Node, Text, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox } from "scenerystack/sun";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/VernierScalesButtonOptions.js";
import { VernierScalesPanel } from "../../common/VernierScalesPanel.js";
import { ReadingReadoutNode } from "../../common/view/ReadingReadoutNode.js";
import { ScaleViewsNode } from "../../common/view/ScaleViewsNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VernierScalesPreferencesModel } from "../../preferences/VernierScalesPreferencesModel.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import { CONTROL_PANEL_WIDTH, SCREEN_VIEW_MARGIN } from "../../VernierScalesConstants.js";
import { Instrument, type InstrumentsModel } from "../model/InstrumentsModel.js";
import { InstrumentsScreenSummaryContent } from "./InstrumentsScreenSummaryContent.js";
import { MicrometerNode } from "./MicrometerNode.js";
import { ProtractorNode } from "./ProtractorNode.js";

export type InstrumentsScreenViewOptions = ScreenViewOptions;

/** A control label in the panel's text colour. */
const panelLabel = (stringProperty: TReadOnlyProperty<string>, size = 13): Text =>
  new Text(stringProperty, { font: new PhetFont(size), fill: VernierScalesColors.textColorProperty });

export class InstrumentsScreenView extends ScreenView {
  public constructor(
    model: InstrumentsModel,
    preferences: VernierScalesPreferencesModel,
    providedOptions?: InstrumentsScreenViewOptions,
  ) {
    const options = optionize<InstrumentsScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new InstrumentsScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getInstrumentsStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getInstrumentsA11yStrings();

    const showingMicrometerProperty = new DerivedProperty(
      [model.instrumentProperty],
      (instrument) => instrument === Instrument.MICROMETER,
    );
    const showingProtractorProperty = new DerivedProperty(
      [model.instrumentProperty],
      (instrument) => instrument === Instrument.PROTRACTOR,
    );

    // ── The instruments ───────────────────────────────────────────────────────
    const micrometerNode = new MicrometerNode(model.micrometer, {
      x: 150,
      y: 110,
      visibleProperty: showingMicrometerProperty,
    });
    this.addChild(micrometerNode);

    // The dial's centre is placed far below the screen so only the top of a very
    // large circle is visible — the arc has to look like part of a real dial.
    const protractorNode = new ProtractorNode(model.protractor, {
      x: 390,
      y: 660,
      visibleProperty: showingProtractorProperty,
    });
    this.addChild(protractorNode);

    // ── Scale views, one per instrument ───────────────────────────────────────
    const micrometerScales = new ScaleViewsNode(model.micrometer, {
      interactive: true,
      magnifiedVisibleProperty: preferences.startMagnifiedProperty,
      dragAccessibleName: a11y.controls.scaleStringProperty,
      dragAccessibleHelpText: a11y.controls.scaleHelpStringProperty,
      left: SCREEN_VIEW_MARGIN,
      top: 236,
      visibleProperty: showingMicrometerProperty,
    });
    this.addChild(micrometerScales);

    const protractorScales = new ScaleViewsNode(model.protractor, {
      interactive: true,
      magnifiedVisibleProperty: preferences.startMagnifiedProperty,
      dragAccessibleName: a11y.controls.scaleStringProperty,
      dragAccessibleHelpText: a11y.controls.scaleHelpStringProperty,
      left: SCREEN_VIEW_MARGIN,
      top: 236,
      visibleProperty: showingProtractorProperty,
    });
    this.addChild(protractorScales);

    // ── Readouts ──────────────────────────────────────────────────────────────
    const micrometerReadout = new ReadingReadoutNode(model.micrometer, {
      showTrueValueProperty: preferences.showTrueValueProperty,
      left: SCREEN_VIEW_MARGIN,
      top: micrometerScales.bottom + 14,
      visibleProperty: showingMicrometerProperty,
    });
    this.addChild(micrometerReadout);

    const protractorReadout = new ReadingReadoutNode(model.protractor, {
      showTrueValueProperty: preferences.showTrueValueProperty,
      left: SCREEN_VIEW_MARGIN,
      top: protractorScales.bottom + 14,
      visibleProperty: showingProtractorProperty,
    });
    this.addChild(protractorReadout);

    // ── Controls ──────────────────────────────────────────────────────────────
    const instrumentRadioGroup = new AquaRadioButtonGroup(
      model.instrumentProperty,
      [
        { value: Instrument.MICROMETER, createNode: () => panelLabel(strings.names.micrometerStringProperty) },
        { value: Instrument.PROTRACTOR, createNode: () => panelLabel(strings.names.protractorStringProperty) },
      ],
      {
        orientation: "vertical",
        align: "left",
        spacing: 7,
        accessibleName: a11y.controls.instrumentStringProperty,
        radioButtonOptions: { radius: 8 },
      },
    );

    const micrometerNote = new Text(strings.micrometerNoteStringProperty, {
      font: new PhetFont(11),
      fill: VernierScalesColors.textColorProperty,
      maxWidth: CONTROL_PANEL_WIDTH - 24,
      visibleProperty: showingMicrometerProperty,
    });
    const protractorNote = new Text(strings.protractorNoteStringProperty, {
      font: new PhetFont(11),
      fill: VernierScalesColors.textColorProperty,
      maxWidth: CONTROL_PANEL_WIDTH - 24,
      visibleProperty: showingProtractorProperty,
    });

    const showTrueValueCheckbox = new Checkbox(
      preferences.showTrueValueProperty,
      panelLabel(common.showTrueValueStringProperty),
      {
        accessibleName: a11y.controls.showTrueValueStringProperty,
        checkboxColor: VernierScalesColors.textColorProperty,
        checkboxColorBackground: VernierScalesColors.panelBackgroundColorProperty,
        spacing: 8,
      },
    );

    const controlPanel = new VernierScalesPanel(
      new VBox({
        align: "left",
        spacing: 12,
        children: [
          panelLabel(strings.instrumentStringProperty, 14),
          instrumentRadioGroup,
          micrometerNote,
          protractorNote,
          showTrueValueCheckbox,
        ],
      }),
      {
        right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
        top: 64,
        minWidth: CONTROL_PANEL_WIDTH,
      },
    );
    this.addChild(controlPanel);

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });
    this.addChild(resetAllButton);

    // Both instruments' scale views appear in the order, but an invisible node is
    // skipped by the PDOM, so only the active one is ever reachable.
    this.addChild(
      new Node({
        pdomOrder: [
          micrometerScales.dragTarget,
          protractorScales.dragTarget,
          instrumentRadioGroup,
          showTrueValueCheckbox,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    // No view-side state to reset; everything on screen derives from the model.
  }
}
