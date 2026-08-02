/**
 * PracticeKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * This screen has no draggable vernier — the instrument is set for you to read —
 * so the standard actions are the whole story.
 */

import { BasicActionsKeyboardHelpSection, TwoColumnKeyboardHelpContent } from "scenerystack/scenery-phet";

export class PracticeKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super([new BasicActionsKeyboardHelpSection()], []);
  }
}
