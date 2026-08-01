/**
 * VernierScalesButtonOptions.ts
 *
 * Shared flat button appearance for the sim. Rectangular and round push buttons
 * default to SceneryStack's 3-D appearance; pass these options (or spread them
 * into nested button options) for a flat look everywhere.
 */

import type { PlayPauseStepButtonGroupOptions, TimeControlNodeOptions } from "scenerystack/scenery-phet";
import { ButtonNode, type ComboBoxOptions } from "scenerystack/sun";
import VernierScalesColors from "../VernierScalesColors.js";

export const FLAT_BUTTON_APPEARANCE_OPTIONS = {
  buttonAppearanceStrategy: ButtonNode.FlatAppearanceStrategy,
} as const;

/** Text on flat push buttons and combo-box items (always on a light control surface). */
export const LIGHT_SURFACE_TEXT_FILL = VernierScalesColors.controlSurfaceTextColorProperty;

/**
 * Combo-box chrome for panels. Item labels must use {@link LIGHT_SURFACE_TEXT_FILL}, not
 * {@link VernierScalesColors.textColorProperty} — that color is for labels on the dark panel fill.
 */
export const VERNIER_SCALES_COMBO_BOX_OPTIONS = {
  buttonFill: VernierScalesColors.controlSurfaceColorProperty,
  listFill: VernierScalesColors.controlSurfaceColorProperty,
  buttonStroke: VernierScalesColors.panelBorderColorProperty,
  listStroke: VernierScalesColors.panelBorderColorProperty,
} satisfies Pick<ComboBoxOptions, "buttonFill" | "listFill" | "buttonStroke" | "listStroke">;

/** Options for RectangularPushButton and NumberControl arrow buttons. */
export const FLAT_RECTANGULAR_BUTTON_OPTIONS = FLAT_BUTTON_APPEARANCE_OPTIONS;

/** Options for ResetAllButton (extends RoundPushButton). */
export const FLAT_RESET_ALL_BUTTON_OPTIONS = FLAT_BUTTON_APPEARANCE_OPTIONS;

/** Nested options for TimeControlNode play / pause / step round buttons. */
export const FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS = {
  playPauseButtonOptions: FLAT_BUTTON_APPEARANCE_OPTIONS,
  stepForwardButtonOptions: FLAT_BUTTON_APPEARANCE_OPTIONS,
  stepBackwardButtonOptions: FLAT_BUTTON_APPEARANCE_OPTIONS,
} satisfies PlayPauseStepButtonGroupOptions;

/**
 * Speed radio labels for TimeControlNode. SceneryStack Text defaults to black, which
 * is low-contrast on the sim's dark Default-mode panels.
 */
export const TIME_CONTROL_SPEED_RADIO_OPTIONS = {
  speedRadioButtonGroupOptions: {
    labelOptions: { fill: VernierScalesColors.textColorProperty },
  },
} satisfies Pick<TimeControlNodeOptions, "speedRadioButtonGroupOptions">;
