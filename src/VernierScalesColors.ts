/**
 * VernierScalesColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import VernierScalesColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import VernierScalesColors from "../../VernierScalesColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: VernierScalesColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the VernierScalesColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import VernierScalesNamespace from "./VernierScalesNamespace.js";

const VernierScalesColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(VernierScalesNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(VernierScalesNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(VernierScalesNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(VernierScalesNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(VernierScalesNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Instrument scales ────────────────────────────────────────────────────────
  // A real caliper is read as dark marks on bright steel, and that contrast is
  // what makes coincidence judgeable. The scale face therefore stays light in
  // both profiles, with dark ticks, rather than inverting with the theme.

  /** Face of a scale — the brushed-steel background the marks are engraved into. */
  scaleFaceColorProperty: new ProfileColorProperty(VernierScalesNamespace, "scaleFace", {
    default: "#e8eaed",
    projector: "#fafafa",
  }),

  /**
   * Numbers printed on a scale face. Dark in both profiles, like the ticks: the
   * face stays light whatever the theme, so the sim's general text colour —
   * near-white in default mode — would be all but invisible on it.
   */
  scaleLabelColorProperty: new ProfileColorProperty(VernierScalesNamespace, "scaleLabel", {
    default: "#20242c",
    projector: "#20242c",
  }),

  /** Main-scale tick marks. */
  scaleTickColorProperty: new ProfileColorProperty(VernierScalesNamespace, "scaleTick", {
    default: "#20242c",
    projector: "#20242c",
  }),

  /** Vernier-scale tick marks, distinguished from the main scale by hue. */
  vernierTickColorProperty: new ProfileColorProperty(VernierScalesNamespace, "vernierTick", {
    default: "#1c4f8b",
    projector: "#1c4f8b",
  }),

  /** The coincident tick and its readout — the answer the sim is pointing at. */
  coincidenceColorProperty: new ProfileColorProperty(VernierScalesNamespace, "coincidence", {
    default: "#d81b60",
    projector: "#c2185b",
  }),

  /** Body of the caliper, micrometer or protractor. */
  instrumentBodyColorProperty: new ProfileColorProperty(VernierScalesNamespace, "instrumentBody", {
    default: "#b0b7c3",
    projector: "#c8ced8",
  }),

  /** The sliding jaw / thimble assembly, a shade darker than the fixed body. */
  instrumentSliderColorProperty: new ProfileColorProperty(VernierScalesNamespace, "instrumentSlider", {
    default: "#8d96a5",
    projector: "#a4acba",
  }),

  /** Outline on instrument parts. */
  instrumentStrokeColorProperty: new ProfileColorProperty(VernierScalesNamespace, "instrumentStroke", {
    default: "#3a4150",
    projector: "#5a6270",
  }),

  /** The object being measured, held between the jaws. */
  workpieceColorProperty: new ProfileColorProperty(VernierScalesNamespace, "workpiece", {
    default: "#f0a030",
    projector: "#e08a10",
  }),

  /** Feedback for a correct answer on the Practice screen. */
  correctColorProperty: new ProfileColorProperty(VernierScalesNamespace, "correct", {
    default: "#43a047",
    projector: "#2e7d32",
  }),

  /** Feedback for an incorrect answer on the Practice screen. */
  incorrectColorProperty: new ProfileColorProperty(VernierScalesNamespace, "incorrect", {
    default: "#e53935",
    projector: "#c62828",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(VernierScalesNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(VernierScalesNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(VernierScalesNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),
};

export default VernierScalesColors;
