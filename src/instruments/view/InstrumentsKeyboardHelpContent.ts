/**
 * InstrumentsKeyboardHelpContent.ts
 *
 * Content for the keyboard-help dialog (the "?" button in the navigation bar).
 * The vernier section documents the instrument-sized steps the arrow and page keys
 * take; the basic-actions section covers the standard sim controls.
 */

import { BasicActionsKeyboardHelpSection, TwoColumnKeyboardHelpContent } from "scenerystack/scenery-phet";
import { VernierKeyboardHelpSection } from "../../common/view/VernierKeyboardHelpSection.js";

export class InstrumentsKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super([new VernierKeyboardHelpSection()], [new BasicActionsKeyboardHelpSection()]);
  }
}
