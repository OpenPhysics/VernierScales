/**
 * createVernierKeyboardListener.ts
 *
 * Shared keyboard path for nudging a {@link VernierScaleModel}: least count on
 * the arrows, main division on Page Up/Down, Home/End for the ends of travel.
 * Keys come from {@link VernierHotkeyData} so the listener and the help dialog
 * stay in lockstep.
 */

import { KeyboardListener } from "scenerystack/scenery";
import type { VernierScaleModel } from "../model/VernierScaleModel.js";
import { VernierHotkeyData } from "./VernierHotkeyData.js";

/** Apply one vernier-motion keystroke to the model. */
export const applyVernierKeyboardInput = (
  model: VernierScaleModel,
  keysPressed: (typeof VernierHotkeyData.KEYBOARD_KEYS)[number],
): void => {
  if (VernierHotkeyData.LEAST_COUNT.hasKeyStroke(keysPressed)) {
    model.stepByLeastCount(keysPressed === "arrowRight" ? 1 : -1);
    return;
  }
  if (VernierHotkeyData.MAIN_DIVISION.hasKeyStroke(keysPressed)) {
    model.stepByMainDivision(keysPressed === "pageUp" ? 1 : -1);
    return;
  }
  if (VernierHotkeyData.ENDS.hasKeyStroke(keysPressed)) {
    model.setMeasurement(keysPressed === "home" ? 0 : model.measurementRangeProperty.value);
  }
};

/** KeyboardListener whose keys are the shared vernier HotkeyData bindings. */
export const createVernierKeyboardListener = (
  model: VernierScaleModel,
): KeyboardListener<typeof VernierHotkeyData.KEYBOARD_KEYS> =>
  new KeyboardListener({
    keys: [...VernierHotkeyData.KEYBOARD_KEYS],
    fire: (_event, keysPressed) => {
      applyVernierKeyboardInput(model, keysPressed);
    },
  });
