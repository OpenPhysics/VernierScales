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
import VernierScalesNamespace from "../VernierScalesNamespace.js";

const vernierScalesQueryParameters = QueryStringMachine.getAll({
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
});

VernierScalesNamespace.register("vernierScalesQueryParameters", vernierScalesQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default vernierScalesQueryParameters;
