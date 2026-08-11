# CLAUDE.md — Vernier Scales

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenPhysics/.github/CLAUDE.md](https://github.com/OpenPhysics/.github/blob/main/CLAUDE.md).

## Project

Four-screen simulation teaching how to read a vernier caliper, and the vernier principle in
general. Forked from `SceneryStackTemplate`; the rename/scaffold scripts have been removed.

| Screen | What it is for |
|---|---|
| Vernier Principle (`src/principle/`) | Two bare scales. Choose the geometry and the division count and watch the coincidence move. |
| Caliper (`src/caliper/`) | A caliper measuring a workpiece with any of its four jaw sets, at any of five scales, with an optional zero error. |
| Instruments (`src/instruments/`) | A vernier micrometer and a bevel protractor — the vernier on a rotating drum and on a circle. |
| Practice (`src/practice/`) | A `vegas` game. Choose a level, read five instruments, type the answers, score. |

## The one idea to hold onto

**Everything is measured in "ticks": one tick is one least count.** `src/common/model/vernier.ts`
knows nothing about millimetres, inches or degrees — it works in integers, so deciding which
vernier line coincides is integer arithmetic rather than a float comparison against an epsilon.
`VernierScaleSpec` attaches physical units at the boundary; `VernierScaleModel` wraps the whole
thing in Properties.

Three consequences worth knowing before changing anything:

- **`coincidentIndex` is derived from the reading, never rounded independently.** `Math.round`
  breaks half-ties toward +∞, so `round(-x) ≠ -round(x)`; computing the two separately made a
  retrograde vernier highlight the line printed "8" while the readout said "9". There is a
  regression test named for this.
- **The three vernier types differ in geometry and numbering, never in what they read.**
  `readingTicks` is deliberately independent of `VernierType`.
- **True value and reading are separate.** The jaws move continuously; the reading quantises. That
  gap is the instrument's resolution, exposed by "Show true value" on the Caliper screen — it is
  not an artefact to round away.

## Key files

| File | Purpose |
|---|---|
| `src/common/model/vernier.ts` | Tick arithmetic. `VernierType` is an `EnumerationValue`; otherwise no Properties, no units, no scenery. |
| `src/common/model/VernierScaleSpec.ts` | Units, presets for ten real instruments, unit conversion |
| `src/common/model/VernierScaleModel.ts` | The reactive instrument: offset, reading, zero error, keyboard steps |
| `src/common/model/inchFraction.ts` | Exact reduction, formatting and parsing of mixed inch fractions |
| `src/common/model/readingFormat.ts` | Reading → text in all three notations; parsing typed answers |
| `src/common/view/VernierScaleNode.ts` | The two combs, the highlight, drag and keyboard input |
| `src/common/view/VernierHotkeyData.ts` | Shared vernier HotkeyData bindings (arrows / Page / Home·End) |
| `src/common/view/createVernierKeyboardListener.ts` | Listener + step helper derived from those bindings |
| `src/common/view/ScaleViewsNode.ts` | Wide view + magnified view, paired |
| `src/common/view/ReadingReadoutNode.ts` | The reading shown as its decomposition |
| `src/common/view/readingProperties.ts` | Locale-aware reactive strings (all `Intl` use lives here) |
| `src/common/view/VernierKeyboardHelpSection.ts` | Shared "Move the Vernier" help section (`fromHotkeyData`) |
| `src/common/view/metalFills.ts` | Gradients and knurling shared by the instrument drawings |
| `src/caliper/view/CaliperNode.ts` | Graduated beam, forged jaws, vernier plate; jaw gap equals the measurement |
| `src/instruments/view/MicrometerNode.ts` | C-frame, spindle, rotating thimble |
| `src/instruments/view/ProtractorNode.ts` | Circular vernier on a dial, read against a fixed blade |
| `src/practice/model/PracticeModel.ts` | The game: `GameState` machine, levels, challenges, scoring |
| `src/practice/view/PracticeLevelSelectionNode.ts` | vegas level-selection UI, best scores as stars |
| `src/practice/view/PracticeChallengeNode.ts` | One challenge; Check / Try Again / Show Answer / Next |
| `src/practice/view/PracticeStatusBar.ts` | vegas `FiniteStatusBar` in the sim's palette |
| `src/practice/view/AnswerFieldNode.ts` | A real PDOM `<input>` mirrored into a Property |
| `src/VernierScalesColors.ts` | All `ProfileColorProperty` instances |
| `src/VernierScalesConstants.ts` | Named numeric constants (layout px, model defaults) |
| `src/i18n/StringManager.ts` | Singleton localized string accessor |

## Conventions specific to this sim

- **Scale faces follow the colour profile**: dark in default mode, light in projector, with ticks
  and numbers in the inverse shade (`scaleFaceColorProperty`, `scaleTickColorProperty`,
  `scaleLabelColorProperty`). Always use these dedicated properties for anything drawn on a scale
  face so the marks track the face; do not substitute the sim's general `textColorProperty`.
- **Instrument metal is not a scale face.** The caliper's beam and plate and the micrometer's sleeve
  and thimble are light in *both* profiles, so anything engraved on them uses
  `instrumentStrokeColorProperty` (dark in both) — a `scaleTickColorProperty` mark would vanish
  there in default mode. Highlights and shadows are derived from the body colours in
  `common/view/metalFills.ts` rather than added to the palette.
- **Never pass `visible: false` alongside a `visibleProperty`.** Scenery applies `visible` after
  `visibleProperty` and writes it through, silently setting the caller's Property to false. Use a
  constant `new BooleanProperty(false)` instead.
- **Every reading goes through `readingProperties.ts`**, which keys off `localeProperty` so that
  `23.14 mm` becomes `23,14 mm` in the French and Spanish builds. Do not use `toFixed` for a value
  a user is meant to read off.
- **The Practice screen does not highlight the coincident line** (`highlightCoincidence: false`) and
  its scales are not draggable. Both would hand the student the answer.
- **The Practice screen is a PhET game built on `vegas`**, not a free-running drill. `GameState` in
  `PracticeModel` is the single source of truth for what is on screen — level selection, a challenge,
  or a level result — and the view derives every visibility from it rather than keeping state of its
  own. Scoring is the PhET standard: two points first try, one on the second, none after. Levels are
  numbered from 1 because `LevelSelectionButtonGroup` and the `gameLevels` query parameter both
  assume it. Text that is not a reading at all is not an attempt: it costs nothing and does not move
  the state machine, because a typo is not evidence about reading a vernier.
- Screen folders are concept-named (`principle/`, not `principle-screen/`).

## Compliance carve-outs

None. Root `VernierScalesConstants.ts`, `*Colors.ts`, `*Namespace.ts`, standard screen layout and
full a11y wiring all pass Baton's compliance check as-is.


### `package.json` overrides

JSON cannot carry comments, so the rationale for forced transitive pins lives here. Prefer
**tilde (`~`) or exact** versions — caret (`^`) lets minors drift under what is meant to be a
hard pin. Dependabot ignores these three names (see `.github/dependabot.yml`) so it does not
open PRs that fight the overrides. Revisit when SceneryStack drops or re-pins them upstream.

| Override | Pin | Why |
|---|---|---|
| `lodash` | `~4.18.1` | SceneryStack declares `~4.17.12`. Bump clears Dependabot/npm advisories patched in 4.18.x (e.g. GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh). |
| `three` | `~0.125.2` | SceneryStack declares `^0.104.0`. Floor is 0.125.0 for GHSA-fq6p-x6j3-cmmq (ReDoS). Staying on the 0.125 line avoids a larger API jump; **0.125.x still has open CVEs** (e.g. XSS GHSA-7vvq-7r29-5vg3, fixed only in ≥0.137.0). Remove this override if/when SceneryStack stops depending on `three` or pins a patched line itself. LightPropagation keeps a higher `three` pin — do not force 0.125 there. |
| `brace-expansion` | `~5.0.9` | Transitive via `vite-plugin-pwa` / Workbox. Clears npm audit (originally GHSA-mh99-v99m-4gvg; keep ≥5.0.9 for GHSA-rgw5-rvv9-x895). |

## Testing

Fleet-standard Vitest layout under root `tests/`, mirroring `src/`.

| Path | Covers |
|---|---|
| `tests/vernier.test.ts` | Tick arithmetic: geometry, coincidence, resolution, zero error |
| `tests/inchFraction.test.ts` | Fraction reduction, mixed-number formatting, parsing |
| `tests/VernierScaleSpec.test.ts` | The presets against the numbers stamped on the real tools |
| `tests/readingFormat.test.ts` | Locale separators, angular format, round trips |
| `tests/VernierScaleModel.test.ts` | Reactive state: unit switching, zero error, keyboard steps |
| `tests/PracticeModel.test.ts` | Challenge generation, marking, the state machine, scoring |
| `tests/memory-leak.test.ts` | WeakRef + `forceGC` dispose regression (fleet pattern) |
| `tests/fuzz/fuzz.spec.ts` | Playwright fuzz smoke via joist `?fuzz` |

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

`npm run release` intentionally skips `npm test` in some sims — append `&& npm test` before the version bump so a release cannot ship a failing suite.

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run build:single` | Single-file build mode |
| `npm run check` | TypeScript (`tsc --noEmit` + scripts and test projects) |
| `npm run lint` / `npm run fix` | Biome check / auto-fix |
| `npm test` | Vitest unit tests |
| `npm run test:fuzz` / `test:fuzz:quick` | Playwright fuzz smoke (10 s for the quick one) |
| `npm run icons` | Regenerate PWA icons |

Requires Node 24+.

## Adding a screen

`scaffold-screens` was a one-shot template script and has been removed. Add a screen by hand
following [`doc/multi-screen.md`](doc/multi-screen.md) § "adding a second screen by hand": mirror an
existing screen folder, add the screen-name and `a11y.<screen>` keys to all three locale files, add
a `StringManager` getter, add an icon factory in `VernierScalesScreenIcons.ts`, and register it in
`src/main.ts`.

## PWA

After `npm run build`, the sim is installable offline via Workbox (`dist/manifest.webmanifest`).
