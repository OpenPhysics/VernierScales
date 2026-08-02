/**
 * CaliperScreenView.ts
 *
 * The caliper itself at the top, its scales below, and the reading beneath them.
 *
 * The vertical order is the order of the task: see what is being measured, read
 * the scales, arrive at a number. The instrument drawing and the scale views are
 * two views of one model — the jaw gap in the drawing is the same quantity the
 * scales report — so moving either moves both.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { Node, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox, ComboBox } from "scenerystack/sun";
import { CALIPER_SCALE_SPECS, type VernierScaleSpec } from "../../common/model/VernierScaleSpec.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
  VERNIER_SCALES_COMBO_BOX_OPTIONS,
} from "../../common/VernierScalesButtonOptions.js";
import { VernierScalesPanel } from "../../common/VernierScalesPanel.js";
import { ReadingReadoutNode } from "../../common/view/ReadingReadoutNode.js";
import { scaleNameProperties } from "../../common/view/readingProperties.js";
import { ScaleViewsNode } from "../../common/view/ScaleViewsNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VernierScalesPreferencesModel } from "../../preferences/VernierScalesPreferencesModel.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import { CONTROL_PANEL_WIDTH, MAX_ZERO_ERROR_TICKS, SCREEN_VIEW_MARGIN } from "../../VernierScalesConstants.js";
import { ALL_MEASUREMENT_MODES, type CaliperModel, MeasurementMode } from "../model/CaliperModel.js";
import { CaliperNode } from "./CaliperNode.js";
import { CaliperScreenSummaryContent } from "./CaliperScreenSummaryContent.js";

export type CaliperScreenViewOptions = ScreenViewOptions;

/** A control label in the panel's text colour. */
const panelLabel = (stringProperty: TReadOnlyProperty<string>, size = 13): Text =>
  new Text(stringProperty, { font: new PhetFont(size), fill: VernierScalesColors.textColorProperty });

export class CaliperScreenView extends ScreenView {
  public constructor(
    model: CaliperModel,
    preferences: VernierScalesPreferencesModel,
    providedOptions?: CaliperScreenViewOptions,
  ) {
    const options = optionize<CaliperScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new CaliperScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getCaliperStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getCaliperA11yStrings();

    // ── The instrument ────────────────────────────────────────────────────────
    const caliperNode = new CaliperNode(model.scale, model.measurementModeProperty, {
      sliderAccessibleName: a11y.controls.jawsStringProperty,
      sliderAccessibleHelpText: a11y.controls.jawsHelpStringProperty,
      x: 40,
      y: 62,
    });
    this.addChild(caliperNode);

    // ── The scales ────────────────────────────────────────────────────────────
    const scaleViews = new ScaleViewsNode(model.scale, {
      interactive: true,
      magnifiedVisibleProperty: preferences.startMagnifiedProperty,
      dragAccessibleName: a11y.controls.scaleStringProperty,
      dragAccessibleHelpText: a11y.controls.jawsHelpStringProperty,
      left: SCREEN_VIEW_MARGIN,
      top: 206,
    });
    this.addChild(scaleViews);

    // ── Reading ───────────────────────────────────────────────────────────────
    const readout = new ReadingReadoutNode(model.scale, {
      showTrueValueProperty: model.showTrueValueProperty,
      left: SCREEN_VIEW_MARGIN,
      top: scaleViews.bottom + 16,
    });
    this.addChild(readout);

    // ── Scale preset ──────────────────────────────────────────────────────────
    const names = scaleNameProperties();
    const scaleComboBox = new ComboBox(
      model.scale.specProperty,
      CALIPER_SCALE_SPECS.map((spec: VernierScaleSpec) => ({
        value: spec,
        createNode: () =>
          new Text(names[spec.id] ?? spec.id, { font: new PhetFont(13), fill: LIGHT_SURFACE_TEXT_FILL }),
      })),
      this,
      {
        ...VERNIER_SCALES_COMBO_BOX_OPTIONS,
        accessibleName: a11y.controls.scaleStringProperty,
      },
    );

    // ── Which jaws ────────────────────────────────────────────────────────────
    const modeLabels: Record<MeasurementMode, TReadOnlyProperty<string>> = {
      [MeasurementMode.OUTSIDE]: strings.modes.outsideStringProperty,
      [MeasurementMode.INSIDE]: strings.modes.insideStringProperty,
      [MeasurementMode.DEPTH]: strings.modes.depthStringProperty,
      [MeasurementMode.STEP]: strings.modes.stepStringProperty,
    };
    const modeRadioGroup = new AquaRadioButtonGroup(
      model.measurementModeProperty,
      ALL_MEASUREMENT_MODES.map((mode) => ({
        value: mode,
        createNode: () => panelLabel(modeLabels[mode]),
      })),
      {
        orientation: "vertical",
        align: "left",
        spacing: 7,
        accessibleName: a11y.controls.measurementModeStringProperty,
        radioButtonOptions: { radius: 8 },
      },
    );

    // ── Zero error ────────────────────────────────────────────────────────────
    const zeroErrorControl = new NumberControl(
      strings.zeroErrorStringProperty,
      model.scale.zeroErrorTicksProperty,
      new Range(-MAX_ZERO_ERROR_TICKS, MAX_ZERO_ERROR_TICKS),
      {
        accessibleName: a11y.controls.zeroErrorStringProperty,
        titleNodeOptions: { font: new PhetFont(13), fill: VernierScalesColors.textColorProperty },
        numberDisplayOptions: { textOptions: { font: new PhetFont(13) }, decimalPlaces: 0 },
        delta: 1,
        arrowButtonOptions: FLAT_RECTANGULAR_BUTTON_OPTIONS,
        layoutFunction: NumberControl.createLayoutFunction1(),
      },
    );

    // Only worth explaining while it is actually doing something.
    const zeroErrorHint = new Text(strings.zeroErrorHintStringProperty, {
      font: new PhetFont(11),
      fill: VernierScalesColors.textColorProperty,
      maxWidth: CONTROL_PANEL_WIDTH - 24,
      visibleProperty: new DerivedProperty([model.scale.zeroErrorTicksProperty], (ticks) => ticks !== 0),
    });

    const showTrueValueCheckbox = new Checkbox(
      model.showTrueValueProperty,
      panelLabel(common.showTrueValueStringProperty),
      {
        accessibleName: a11y.controls.showTrueValueStringProperty,
        checkboxColor: VernierScalesColors.textColorProperty,
        checkboxColorBackground: VernierScalesColors.controlSurfaceColorProperty,
        spacing: 8,
      },
    );

    const snapCheckbox = new Checkbox(model.snapToReadableProperty, panelLabel(strings.snapToReadableStringProperty), {
      accessibleName: a11y.controls.snapToReadableStringProperty,
      checkboxColor: VernierScalesColors.textColorProperty,
      checkboxColorBackground: VernierScalesColors.controlSurfaceColorProperty,
      spacing: 8,
    });

    const controlPanel = new VernierScalesPanel(
      new VBox({
        align: "left",
        spacing: 11,
        children: [
          panelLabel(strings.scaleStringProperty, 14),
          scaleComboBox,
          panelLabel(strings.measurementModeStringProperty, 14),
          modeRadioGroup,
          zeroErrorControl,
          zeroErrorHint,
          showTrueValueCheckbox,
          snapCheckbox,
        ],
      }),
      {
        right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
        top: 60,
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

    // Jaws first, then the scales they drive, then the controls that reconfigure
    // the instrument, then Reset All.
    this.addChild(
      new Node({
        pdomOrder: [
          caliperNode.sliderTarget,
          scaleViews.dragTarget,
          scaleComboBox,
          modeRadioGroup,
          zeroErrorControl,
          showTrueValueCheckbox,
          snapCheckbox,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    // No view-side state to reset; everything on screen derives from the model.
  }
}
