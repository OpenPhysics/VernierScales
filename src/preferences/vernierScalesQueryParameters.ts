/**
 * vernierScalesQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) must set `public: true`.
 *
 * ── How to add a query parameter ──────────────────────────────────────────────
 * 1. Add an entry below with a `type`, `defaultValue`, and (if user-facing)
 *    `public: true`. Add `isValidValue` to bound numeric ranges.
 * 2. If it should also be user-editable at runtime, surface it as a preference
 *    in VernierScalesPreferencesModel (initialize that Property from this query parameter).
 *
 * Usage: append e.g. `?startMagnified=false` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import { getGameLevelsSchema } from "scenerystack/vegas";
import VernierScalesNamespace from "../VernierScalesNamespace.js";

/** Levels on the Practice screen; kept in step with the PracticeLevel enumeration. */
const NUMBER_OF_PRACTICE_LEVELS = 3;

const vernierScalesQueryParameters = QueryStringMachine.getAll({
  /**
   * Which Practice-screen levels to offer, numbered from 1. The vegas-standard
   * parameter, so that a teacher can hand out a link to just one level —
   * e.g. `?gameLevels=2` for imperial readings alone.
   */
  gameLevels: getGameLevelsSchema(NUMBER_OF_PRACTICE_LEVELS),

  /**
   * Whether the magnified view of the coincidence starts visible. Turning it off
   * makes the sim harder on purpose: the whole vernier is still there to read,
   * just without the close-up confirmation.
   */
  startMagnified: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },

  /**
   * Whether the true, unquantised value is shown alongside the reading, exposing
   * the ±½ least count that is the instrument's resolution. Applies to the
   * Caliper and Instruments screens, where a continuous "true" size exists.
   */
  showTrueValue: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },

  /**
   * Whether the full-height guide line marking the coincident tick is drawn.
   * Currently the Vernier Principle screen is the only place it appears, but it
   * is a display default rather than a per-screen behaviour, so it lives here.
   */
  showCoincidenceMarker: {
    type: "boolean",
    defaultValue: true,
    public: true,
  },

  /**
   * Whether the Vernier Principle screen offers a choice of vernier geometry
   * (direct, retrograde, extended). Off by default — only the everyday direct
   * vernier is available — so a teacher can opt in via Preferences or this
   * parameter when they want students to compare the three arrangements.
   */
  showVernierGeometry: {
    type: "boolean",
    defaultValue: false,
    public: true,
  },
});

VernierScalesNamespace.register("vernierScalesQueryParameters", vernierScalesQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default vernierScalesQueryParameters;
