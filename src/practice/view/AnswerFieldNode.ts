/**
 * AnswerFieldNode.ts
 *
 * The box a student types their reading into.
 *
 * ── Why this is a real `<input>` ──────────────────────────────────────────────
 *
 * Scenery draws to a canvas, so a text field has to be faked one way or another.
 * The approach here is to make the node's parallel-DOM element an actual
 * `<input type="text">` and mirror its value into a Property, rather than to
 * accumulate keystrokes from a `KeyboardListener` into a string of our own. That
 * buys a great deal for very little code: caret handling, selection, clipboard,
 * mobile on-screen keyboards, IME input, and — the reason it matters most here —
 * a screen reader that announces the field as a text box the user can type in,
 * because it genuinely is one.
 *
 * The visible rectangle and text are decoration painted to match; the input
 * element itself is positioned over them by scenery's PDOM layer.
 */

import { DerivedProperty, type StringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { optionize } from "scenerystack/phet-core";
import { Node, type NodeOptions, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import VernierScalesColors from "../../VernierScalesColors.js";

type SelfOptions = {
  /** Width of the visible field. */
  fieldWidth?: number;

  /** Height of the visible field. */
  fieldHeight?: number;

  /** Placeholder shown, greyed, while the field is empty. */
  placeholderProperty?: TReadOnlyProperty<string> | null;
};

export type AnswerFieldNodeOptions = SelfOptions & NodeOptions;

export class AnswerFieldNode extends Node {
  public constructor(answerTextProperty: StringProperty, providedOptions?: AnswerFieldNodeOptions) {
    const options = optionize<AnswerFieldNodeOptions, SelfOptions, NodeOptions>()(
      {
        fieldWidth: 168,
        fieldHeight: 34,
        placeholderProperty: null,
        tagName: "input",
        inputType: "text",
        focusable: true,
      },
      providedOptions,
    );
    super(options);

    const background = new Rectangle(0, 0, options.fieldWidth, options.fieldHeight, {
      fill: VernierScalesColors.controlSurfaceColorProperty,
      stroke: VernierScalesColors.panelBorderColorProperty,
      cornerRadius: 4,
    });
    this.addChild(background);

    const valueText = new Text(answerTextProperty, {
      font: new PhetFont(17),
      fill: VernierScalesColors.controlSurfaceTextColorProperty,
      left: 8,
      centerY: options.fieldHeight / 2,
      maxWidth: options.fieldWidth - 16,
    });
    this.addChild(valueText);

    if (options.placeholderProperty !== null) {
      this.addChild(
        new Text(options.placeholderProperty, {
          font: new PhetFont({ size: 15, style: "italic" }),
          fill: VernierScalesColors.controlSurfaceTextColorProperty,
          opacity: 0.5,
          left: 8,
          centerY: options.fieldHeight / 2,
          maxWidth: options.fieldWidth - 16,
          visibleProperty: new DerivedProperty([answerTextProperty], (text) => text.length === 0),
        }),
      );
    }

    // DOM → model. `inputValue` is typed loosely because the PDOM also uses it
    // for numbers and for translated strings, so it is narrowed here.
    this.addInputListener({
      input: () => {
        const value = this.inputValue;
        answerTextProperty.value = typeof value === "string" ? value : String(value ?? "");
      },
    });

    // Model → DOM, so that clearing the field for a new question actually clears
    // what the user sees. Writing the value the user just typed straight back is
    // harmless: it is the value already in the element.
    answerTextProperty.link((text) => {
      this.inputValue = text;
    });
  }
}
