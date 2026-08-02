/**
 * VernierKeyboardHelpSection.ts
 *
 * The keyboard-help section describing how to move a vernier.
 *
 * The steps documented here are the instrument's own increments, not pixels: one
 * least count on the arrow keys and one main division on Page Up and Page Down.
 * That is worth stating plainly in the dialog, because it means a keyboard user
 * always lands on an exactly readable value — an advantage a mouse user does not
 * get, and one they would otherwise have to discover by accident.
 */

import {
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  TextKeyNode,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class VernierKeyboardHelpSection extends KeyboardHelpSection {
  public constructor() {
    const strings = StringManager.getInstance().getKeyboardHelpStrings();

    super(strings.titleStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        strings.leastCountStringProperty,
        KeyboardHelpIconFactory.leftRightArrowKeysRowIcon(),
      ),
      KeyboardHelpSectionRow.labelWithIcon(
        strings.mainDivisionStringProperty,
        KeyboardHelpIconFactory.pageUpPageDownRowIcon(),
      ),
      KeyboardHelpSectionRow.labelWithIcon(
        strings.endsStringProperty,
        KeyboardHelpIconFactory.iconRow([TextKeyNode.home(), TextKeyNode.end()]),
      ),
    ]);
  }
}
