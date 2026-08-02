/**
 * VernierScalesConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Physics / model values use SI units (metres, seconds, kilograms, …);
 *    note the unit in a comment on each value.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in VernierScalesColors.ts, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 *
 * Remove the example constants below and replace them with the sim's own.
 */

import VernierScalesNamespace from "./VernierScalesNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

// ── Scale drawing (screen pixels) ─────────────────────────────────────────────

/** Length of an ordinary main-scale tick, measured from the coincidence line. */
export const MAIN_TICK_LENGTH = 16;

/** Length of an ordinary vernier tick, measured from the coincidence line. */
export const VERNIER_TICK_LENGTH = 16;

/** How much longer a numbered tick is than an unnumbered one. */
export const MAJOR_TICK_LENGTH_SCALE = 1.6;

/** Stroke width of an ordinary tick. Kept thin so coincidence stays judgeable. */
export const SCALE_TICK_WIDTH = 1.2;

/** Stroke width of the highlighted coincident tick. */
export const COINCIDENT_TICK_WIDTH = 3;

/** Font size for the numbers printed along both scales. */
export const SCALE_LABEL_FONT_SIZE = 11;

/** Height of the wide, whole-vernier scale view. */
export const FULL_SCALE_VIEW_HEIGHT = 112;

/** Height of the magnified confirmation view. */
export const MAGNIFIED_VIEW_HEIGHT = 120;

/** How many main divisions the magnified view spans. Fewer means more zoom. */
export const MAGNIFIED_WINDOW_DIVISIONS = 6;

/** Width shared by the scale views and the panels beneath them. */
export const SCALE_VIEW_WIDTH = 690;

/** Width of the right-hand control column on every screen. */
export const CONTROL_PANEL_WIDTH = 258;

// ── Instrument drawing (screen pixels) ────────────────────────────────────────

/**
 * Length of the caliper beam on screen.
 *
 * Sized so that the beam *plus* a fully extended depth rod still fits the screen:
 * the rod protrudes from the tail by the whole measurement, so the drawing needs
 * room for roughly twice the jaw travel. That caps how large the instrument can
 * be drawn, which is fine — the scales below it are where reading happens.
 */
export const CALIPER_BEAM_LENGTH = 380;

/** Thickness of the caliper beam. */
export const CALIPER_BEAM_HEIGHT = 26;

/** How far the outside jaws project below the beam. */
export const CALIPER_JAW_LENGTH = 70;

/** How far the inside jaws project above the beam. */
export const CALIPER_INSIDE_JAW_LENGTH = 34;

/** Thickness of a jaw at its base. */
export const CALIPER_JAW_WIDTH = 15;

/** Radius of the protractor dial on the Instruments screen. */
export const PROTRACTOR_RADIUS = 168;

// ── Model defaults ────────────────────────────────────────────────────────────

/** Object size the Caliper screen starts with, in millimetres. */
export const DEFAULT_MEASUREMENT_MM = 23.14;

/** Largest zero error the Caliper screen will apply, in least counts. */
export const MAX_ZERO_ERROR_TICKS = 5;

VernierScalesNamespace.register("VernierScalesConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  MAIN_TICK_LENGTH,
  VERNIER_TICK_LENGTH,
  MAJOR_TICK_LENGTH_SCALE,
  SCALE_TICK_WIDTH,
  COINCIDENT_TICK_WIDTH,
  SCALE_LABEL_FONT_SIZE,
  FULL_SCALE_VIEW_HEIGHT,
  MAGNIFIED_VIEW_HEIGHT,
  MAGNIFIED_WINDOW_DIVISIONS,
  SCALE_VIEW_WIDTH,
  CONTROL_PANEL_WIDTH,
  CALIPER_BEAM_LENGTH,
  CALIPER_BEAM_HEIGHT,
  CALIPER_JAW_LENGTH,
  CALIPER_INSIDE_JAW_LENGTH,
  CALIPER_JAW_WIDTH,
  PROTRACTOR_RADIUS,
  DEFAULT_MEASUREMENT_MM,
  MAX_ZERO_ERROR_TICKS,
});
