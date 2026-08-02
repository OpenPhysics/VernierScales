# Vernier Scales

An interactive simulation about reading vernier calipers — and about the vernier principle in
general — built with [SceneryStack](https://scenerystack.org/), Vite 8, TypeScript 7, and Biome 2.

A vernier scale reads a fraction of a division by sliding a second scale, whose divisions are
slightly a different size, against the first. Only one pair of lines ever coincides, and which pair
it is gives you the fraction. This sim takes that one idea and follows it from bare scales to real
instruments.

## Screens

| Screen | What it does |
|---|---|
| **Vernier Principle** | Two bare scales. Choose direct, retrograde or extended geometry and any number of divisions, slide the vernier, and watch the coincidence move. |
| **Caliper** | A caliper measuring a workpiece with its outside jaws, inside jaws, depth rod or step faces, at five different scales, with an optional zero error and a true-value readout. |
| **Instruments** | A vernier micrometer, whose vernier reads a rotating thimble, and a bevel protractor, whose scale is a circle and whose least count is five arcminutes. |
| **Practice** | A drill: the instrument is set, you read it and type the answer. Metric, imperial, and a tier where the tool is miscalibrated. |

Imperial is covered properly: decimal-inch calipers reading 0.001 in and 0.0005 in, and
fractional-inch ones reading 1/128 in and 1/64 in whose answers are reduced mixed fractions.

The physics and the reading procedure are written up for teachers in [`doc/model.md`](doc/model.md).

## Features

- Every reading shown as its decomposition — main-scale part, coincident line, least count — not
  just as a finished number
- Wide and magnified views of the scales, because a vernier is read from the pattern across many
  marks and confirmed at one
- Full keyboard control in the instrument's own increments: arrows move one least count, Page
  Up/Down one main division
- Live screen-reader descriptions that name which line coincides — the one thing a non-visual user
  cannot otherwise get
- English, Spanish, and French localization, with locale-aware decimal separators
- Default and projector color profiles
- Progressive Web App (installable, offline-capable)

## Quick Start

```bash
npm install
npm run icons    # generate PNG icons from public/icons/icon.svg
npm start        # dev server → http://localhost:5173
```

Requires Node 24+.

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run build:single` | Single-file build |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Playwright fuzz smoke (`?fuzz`, default 15s) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run clean` | Remove `dist/` |

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^1 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenPhysics org license](https://github.com/OpenPhysics/.github/blob/main/LICENSE).

## Contributing

See [OpenPhysics contributing guidelines](https://github.com/OpenPhysics/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
