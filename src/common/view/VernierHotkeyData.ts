/**
 * VernierHotkeyData.ts
 *
 * Single source of truth for vernier keyboard shortcuts. Both the
 * {@link createVernierKeyboardListener} (what fires) and
 * {@link VernierKeyboardHelpSection} (what is documented) derive from these
 * HotkeyData instances so the help dialog cannot drift from behavior.
 */

import { HotkeyData } from "scenerystack/scenery";

const LEAST_COUNT_KEYS = ["arrowLeft", "arrowRight"] as const;
const MAIN_DIVISION_KEYS = ["pageUp", "pageDown"] as const;
const ENDS_KEYS = ["home", "end"] as const;

export const VernierHotkeyData = {
  /** Flat key list for a single KeyboardListener covering all vernier motion. */
  KEYBOARD_KEYS: [...LEAST_COUNT_KEYS, ...MAIN_DIVISION_KEYS, ...ENDS_KEYS] as const,

  LEAST_COUNT: new HotkeyData({
    keys: [...LEAST_COUNT_KEYS],
    repoName: "vernier-scales",
    binderName: "Move by one least count",
  }),

  MAIN_DIVISION: new HotkeyData({
    keys: [...MAIN_DIVISION_KEYS],
    repoName: "vernier-scales",
    binderName: "Move by one main division",
  }),

  ENDS: new HotkeyData({
    keys: [...ENDS_KEYS],
    repoName: "vernier-scales",
    binderName: "Jump to zero or to full scale",
  }),
} as const;
