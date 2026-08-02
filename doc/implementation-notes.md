# Implementation Notes - Vernier Scales

Developer-facing notes on the architecture. The vernier principle and the instruments
themselves are documented for educators in [model.md](./model.md).

## Architecture Overview

Four-screen SceneryStack simulation. The shared core is a pure tick-arithmetic library
plus one reactive instrument model; each screen wraps that model in its own UI.

```
main.ts
  ├─ VernierPrincipleScreen   bare scales — geometry and division count are free
  ├─ CaliperScreen            caliper + workpiece (four jaw modes, five scales)
  ├─ InstrumentsScreen        micrometer (rotating thimble) + bevel protractor
  └─ PracticeScreen           drill: read the instrument, type the answer

src/common/model/
  ├─ vernier.ts               pure tick maths — no axon, no units, no SceneryStack
  ├─ VernierScaleSpec.ts      units, ten real-instrument presets, unit conversion
  ├─ VernierScaleModel.ts     reactive instrument: offset, reading, zero error, steps
  ├─ inchFraction.ts          exact reduction / format / parse of mixed inch fractions
  └─ readingFormat.ts         reading → text in decimal / fraction / angular; parse answers

src/common/view/
  ├─ VernierScaleNode.ts      the two combs, coincidence highlight, drag + keyboard
  ├─ ScaleViewsNode.ts        wide view + magnified view, paired
  ├─ ReadingReadoutNode.ts    reading shown as its decomposition
  ├─ readingProperties.ts     locale-aware reactive strings (all Intl use lives here)
  └─ VernierKeyboardHelpSection.ts   shared "Move the Vernier" help section

src/caliper/ · src/instruments/ · src/principle/ · src/practice/
  each: model/, view/, *Screen.ts, keyboard help, screen summary
```

Data flows Model → View through AXON `Property` objects. The view never integrates
physics; the model never imports scenery. Pure maths in `vernier.ts` /
`inchFraction.ts` / `readingFormat.ts` / `VernierScaleSpec.ts` has no axon dependency
and is fully unit-tested.

## Key design decisions

- **Everything is measured in ticks.** One tick is one least count. Coincidence is
  decided by integer arithmetic, not float comparison against an epsilon.
  `VernierScaleSpec` attaches physical units at the boundary; `VernierScaleModel`
  wraps the whole thing in Properties.
- **`coincidentIndex` is derived from the reading, never rounded independently.**
  `Math.round` breaks half-ties toward +∞, so `round(-x) ≠ -round(x)`; computing the
  two separately made a retrograde vernier highlight the line printed "8" while the
  readout said "9". There is a regression test named for this.
- **The three vernier types differ in geometry and numbering, never in what they
  read.** `readingTicks` is deliberately independent of `VernierType`.
- **True value and reading are separate.** `measurementProperty` holds the continuous
  true size in canonical units (mm or degrees). The reading quantises. That gap is
  the instrument's resolution (`readingErrorProperty`), exposed by "Show true value"
  on the Caliper screen — not an artefact to round away.
- **Zero error is added to the display and subtracted from the report.**
  `offsetTicksProperty` includes it (what the scales show); `readingTicksProperty`
  corrects it (what you should write down). The Practice screen's third tier drills
  that correction.
- **Caliper modes are four dimensions of one workpiece**, not four objects. Switching
  jaws swaps which dimension is read without resetting the others.
- **Practice questions snap to whole least counts.** A question whose true answer
  falls between readable values has no correct response to type. Resolution error is
  taught on the Caliper screen, not used as marking noise here.
- **Practice never highlights coincidence and is not draggable**
  (`highlightCoincidence: false`) — both would hand the student the answer.
- **Every user-visible number goes through `readingProperties.ts`**, keyed off
  `localeProperty`, so `23.14 mm` becomes `23,14 mm` in French/Spanish. Do not use
  `toFixed` for a value a user is meant to read off.

## Common components

- `VernierScalesPanel` — pre-themed panel; all control panels use it so projector-mode
  switching is automatic.
- `VernierScalesButtonOptions` / `VERNIER_SCALES_COMBO_BOX_OPTIONS` — flat button and
  combo-box option bundles (see `CLAUDE.md`).

## View pitfalls specific to this sim

- **Scale faces follow the colour profile** — dark in default mode, light in
  projector, with ticks in the inverse shade (`scaleFaceColorProperty`,
  `scaleTickColorProperty`, `scaleLabelColorProperty`). Use these dedicated
  properties so marks track the face; the general `textColorProperty` does not.
- **Never pass `visible: false` alongside a `visibleProperty`.** Scenery applies
  `visible` after `visibleProperty` and writes it through, silently setting the
  caller's Property to false. Use a constant `new BooleanProperty(false)` instead.

## Accessibility

Each screen has a `*ScreenSummaryContent` with a live `currentDetailsContent`
`DerivedProperty` that names which vernier line coincides — the one thing a
non-visual user cannot otherwise get — plus explicit `pdomOrder` and keyboard help
(shared `VernierKeyboardHelpSection` for vernier motion). The Practice answer field
is a real PDOM `<input>` mirrored into a Property (`AnswerFieldNode`).

Full checklist: [Baton/ACCESSIBILITY.md](https://github.com/OpenPhysics/Baton/blob/main/ACCESSIBILITY.md).

## Testing

Fleet-standard Vitest layout under root `tests/`, mirroring `src/`.

| Path | Covers |
|---|---|
| `tests/vernier.test.ts` | Tick arithmetic: geometry, coincidence, resolution, zero error |
| `tests/inchFraction.test.ts` | Fraction reduction, mixed-number formatting, parsing |
| `tests/VernierScaleSpec.test.ts` | Presets against the numbers stamped on the real tools |
| `tests/readingFormat.test.ts` | Locale separators, angular format, round trips |
| `tests/VernierScaleModel.test.ts` | Reactive state: unit switching, zero error, keyboard steps |
| `tests/PracticeModel.test.ts` | Question generation, marking, the tally |
| `tests/memory-leak.test.ts` | WeakRef + `forceGC` dispose regression (fleet pattern) |
| `tests/fuzz/fuzz.spec.ts` | Playwright fuzz smoke via joist `?fuzz` |

Run `npm test`.

## Multi-screen simulations

Already four screens. To add another, see [`multi-screen.md`](./multi-screen.md) §
"adding a second screen by hand": mirror an existing screen folder, add screen-name
and `a11y.<screen>` keys to all three locale files, add a `StringManager` getter, add
an icon factory in `VernierScalesScreenIcons.ts`, and register it in `main.ts`.
(`scaffold-screens` was a one-shot template script and has been removed.)

## PWA

After `npm run build`, the sim is installable offline via Workbox
(`dist/manifest.webmanifest`).
