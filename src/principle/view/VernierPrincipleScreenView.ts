/**
 * VernierPrincipleScreenView.ts
 *
 * Two bare scales and the controls that shape them. No instrument, no jaws —
 * just the relationship the rest of the sim is built on.
 */

import { DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { Node, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, Checkbox } from "scenerystack/sun";
import {
  PRINCIPLE_DIVISIONS_RANGE,
  spanDivisions,
  type VernierScaleSpec,
} from "../../common/model/VernierScaleSpec.js";
import { VernierType } from "../../common/model/vernier.js";
import {
  FLAT_RECTANGULAR_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
} from "../../common/VernierScalesButtonOptions.js";
import { VernierScalesPanel } from "../../common/VernierScalesPanel.js";
import { ReadingReadoutNode } from "../../common/view/ReadingReadoutNode.js";
import {
  createLeastCountStringProperty,
  createVernierDivisionStringProperty,
} from "../../common/view/readingProperties.js";
import { ScaleViewsNode } from "../../common/view/ScaleViewsNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VernierScalesPreferencesModel } from "../../preferences/VernierScalesPreferencesModel.js";
import VernierScalesColors from "../../VernierScalesColors.js";
import { CONTROL_PANEL_WIDTH, SCREEN_VIEW_MARGIN } from "../../VernierScalesConstants.js";
import type { VernierPrincipleModel } from "../model/VernierPrincipleModel.js";
import { VernierPrincipleScreenSummaryContent } from "./VernierPrincipleScreenSummaryContent.js";

export type VernierPrincipleScreenViewOptions = ScreenViewOptions;

/** A radio-button or panel label in the panel's text colour. */
const panelLabel = (stringProperty: TReadOnlyProperty<string>, size = 13): Text =>
  new Text(stringProperty, { font: new PhetFont(size), fill: VernierScalesColors.textColorProperty });

export class VernierPrincipleScreenView extends ScreenView {
  public constructor(
    model: VernierPrincipleModel,
    preferences: VernierScalesPreferencesModel,
    providedOptions?: VernierPrincipleScreenViewOptions,
  ) {
    const options = optionize<VernierPrincipleScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new VernierPrincipleScreenSummaryContent(model, preferences),
      },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getPrincipleStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getVernierPrincipleA11yStrings();

    // ── The scales ────────────────────────────────────────────────────────────
    const scaleViews = new ScaleViewsNode(model.scale, {
      interactive: true,
      magnifiedVisibleProperty: preferences.startMagnifiedProperty,
      dragAccessibleName: a11y.controls.vernierStringProperty,
      dragAccessibleHelpText: a11y.controls.vernierHelpStringProperty,
      coincidenceMarkerVisibleProperty: preferences.showCoincidenceMarkerProperty,
      left: SCREEN_VIEW_MARGIN,
      top: 70,
    });
    this.addChild(scaleViews);

    // ── Reading ───────────────────────────────────────────────────────────────
    const readout = new ReadingReadoutNode(model.scale, {
      left: SCREEN_VIEW_MARGIN,
      top: scaleViews.bottom + 20,
    });
    this.addChild(readout);

    // ── Geometry selector (opt-in via Preferences / ?showVernierGeometry) ─────
    // Off by default: only the everyday direct vernier is available. Turning the
    // preference on reveals the radio buttons so students can compare geometries.
    preferences.showVernierGeometryProperty.link((show) => {
      if (!show) {
        model.vernierTypeProperty.value = VernierType.DIRECT;
      }
    });

    const typeRadioGroup = new AquaRadioButtonGroup(
      model.vernierTypeProperty,
      [
        { value: VernierType.DIRECT, createNode: () => panelLabel(common.vernierTypes.directStringProperty) },
        { value: VernierType.RETROGRADE, createNode: () => panelLabel(common.vernierTypes.retrogradeStringProperty) },
        { value: VernierType.EXTENDED, createNode: () => panelLabel(common.vernierTypes.extendedStringProperty) },
      ],
      {
        orientation: "vertical",
        align: "left",
        spacing: 7,
        accessibleName: a11y.controls.vernierTypeStringProperty,
        radioButtonOptions: { radius: 8 },
      },
    );

    // Switching geometry is this screen's main teaching moment, so the change is
    // stated in words as well as shown — the visual difference between a direct
    // and an extended vernier is easy to see but hard to name.
    const typeDescription = new Text(
      new DerivedProperty(
        [
          model.vernierTypeProperty,
          strings.directDescriptionStringProperty,
          strings.retrogradeDescriptionStringProperty,
          strings.extendedDescriptionStringProperty,
        ],
        (type, direct, retrograde, extended) => {
          switch (type) {
            case VernierType.DIRECT:
              return direct;
            case VernierType.RETROGRADE:
              return retrograde;
            case VernierType.EXTENDED:
              return extended;
            default:
              throw new Error(`Unhandled VernierType: ${type}`);
          }
        },
      ),
      {
        font: new PhetFont(12),
        fill: VernierScalesColors.textColorProperty,
        maxWidth: CONTROL_PANEL_WIDTH - 24,
      },
    );

    const geometryControls = new VBox({
      align: "left",
      spacing: 12,
      visibleProperty: preferences.showVernierGeometryProperty,
      children: [
        new Text(strings.geometryStringProperty, {
          font: new PhetFont({ size: 14, weight: "bold" }),
          fill: VernierScalesColors.textColorProperty,
        }),
        typeRadioGroup,
        typeDescription,
      ],
    });

    // ── Division count ────────────────────────────────────────────────────────
    const divisionsControl = new NumberControl(
      strings.divisionsStringProperty,
      model.divisionsProperty,
      new Range(PRINCIPLE_DIVISIONS_RANGE.min, PRINCIPLE_DIVISIONS_RANGE.max),
      {
        accessibleName: a11y.controls.divisionsStringProperty,
        titleNodeOptions: { font: new PhetFont(13), fill: VernierScalesColors.textColorProperty },
        numberDisplayOptions: { textOptions: { font: new PhetFont(13) }, decimalPlaces: 0 },
        delta: 1,
        arrowButtonOptions: FLAT_RECTANGULAR_BUTTON_OPTIONS,
        layoutFunction: NumberControl.createLayoutFunction1(),
      },
    );

    // ── Derived facts about the current geometry ──────────────────────────────
    const spanText = new Text(
      new PatternStringProperty(strings.spanPatternStringProperty, {
        count: model.divisionsProperty,
        span: new DerivedProperty([model.scale.specProperty], (spec: VernierScaleSpec) => spanDivisions(spec)),
      }),
      { font: new PhetFont(12), fill: VernierScalesColors.textColorProperty, maxWidth: CONTROL_PANEL_WIDTH - 24 },
    );

    const vernierDivisionText = new Text(
      new PatternStringProperty(common.labelPatternStringProperty, {
        label: strings.vernierDivisionStringProperty,
        value: createVernierDivisionStringProperty(model.vernierDivisionProperty, model.scale.specProperty),
      }),
      { font: new PhetFont(12), fill: VernierScalesColors.textColorProperty },
    );

    const leastCountText = new Text(
      new PatternStringProperty(common.labelPatternStringProperty, {
        label: common.leastCountStringProperty,
        value: createLeastCountStringProperty(model.scale.specProperty),
      }),
      { font: new PhetFont(12), fill: VernierScalesColors.textColorProperty },
    );

    // ── Coincidence marker toggle ─────────────────────────────────────────────
    const showCoincidenceCheckbox = new Checkbox(
      preferences.showCoincidenceMarkerProperty,
      panelLabel(strings.showCoincidenceStringProperty),
      {
        accessibleName: a11y.controls.showCoincidenceStringProperty,
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
          geometryControls,
          divisionsControl,
          spanText,
          vernierDivisionText,
          leastCountText,
          showCoincidenceCheckbox,
        ],
      }),
      {
        right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
        top: 70,
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

    // Traversal order: the scales first, since reading them is the task, then
    // the controls that reshape them, then Reset All. The geometry radios drop
    // out of the PDOM when their parent is hidden.
    this.addChild(
      new Node({
        pdomOrder: [scaleViews.dragTarget, typeRadioGroup, divisionsControl, showCoincidenceCheckbox, resetAllButton],
      }),
    );
  }

  public reset(): void {
    // No view-side state to reset; everything on screen derives from the model.
  }
}
