# Rick and Morty — Character Browser

A small, fast single-page app for browsing every character in the Rick and Morty
multiverse, built on [The Rick and Morty API](https://rickandmortyapi.com).

**Live:** https://carlosAndress101.github.io/rick-and-morty/

<!-- Screenshot: replace with a capture of the character grid at 1440px. -->
<!-- ![Character grid](docs/screenshot-grid.png) -->

<!-- Screenshot: replace with a capture of the loading skeleton. -->
<!-- ![Loading skeleton](docs/screenshot-skeleton.png) -->

---

## Tech stack

| Layer      | Choice                   | Why                                                                 |
| ---------- | ------------------------ | ------------------------------------------------------------------- |
| UI         | React 19                 | Automatic JSX runtime, `createRoot`, no legacy APIs                 |
| Build      | Vite 8 + SWC             | Sub-100ms production builds                                         |
| Styling    | Bootstrap 5 + scoped CSS | Bootstrap for buttons/badges only; layout is native CSS Grid        |
| Linting    | Oxlint (OXC)             | Rust-based; lints the whole repo in milliseconds                    |
| Formatting | oxfmt                    | Same OXC toolchain as the linter; formats JS, JSX, CSS, MD and JSON |
| Packages   | pnpm 12                  | Strict, content-addressed, fast                                     |
| Hosting    | GitHub Pages             | Static, free, `gh-pages` branch                                     |

No TypeScript, no router, no state library, no data-fetching library. Types are JSDoc.

## Architecture

Strict one-way dependencies — each layer only knows about the one beneath it.

```
┌─────────────────────────────────────────────────────────┐
│ components/   render only — no fetching, no formatting  │
│   Layout · CharacterBrowser · CharacterResults          │
│   CharacterGrid · CharacterCard · Pagination · UI       │
└───────────────────────────┬─────────────────────────────┘
                            │ props
┌───────────────────────────▼─────────────────────────────┐
│ hooks/useCharacters       React lifecycle               │
│   request state · abort previous · retry                │
└───────────────────────────┬─────────────────────────────┘
                            │ Character[] · PageInfo
┌───────────────────────────▼─────────────────────────────┐
│ services/charactersService   domain                     │
│   validate payload · normalise · 404 → empty page       │
└───────────────────────────┬─────────────────────────────┘
                            │ raw JSON
┌───────────────────────────▼─────────────────────────────┐
│ api/rickAndMorty          transport                     │
│   URL building · timeout · abort · status · parse       │
│   every failure → ApiError { kind }                     │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│ lib/   constants · pure utils · runtime shape guards    │
└─────────────────────────────────────────────────────────┘
```

The rule that keeps this honest: **no component ever calls `fetch`**.

## Project tree

```
.
├── public/favicon.svg
├── src/
│   ├── api/rickAndMorty.js          # transport, ApiError, timeouts, abort
│   ├── components/
│   │   ├── Character/
│   │   │   ├── CharacterBrowser.jsx # container: owns the page number
│   │   │   ├── CharacterResults.jsx # picks the applicable content state
│   │   │   ├── CharacterGrid.jsx
│   │   │   ├── CharacterCard.jsx    # memoised
│   │   │   └── CharacterSkeleton.jsx
│   │   ├── Layout/Layout.jsx        # skip link, landmarks, footer
│   │   ├── Pagination/Pagination.jsx
│   │   └── UI/
│   │       ├── EmptyState.jsx
│   │       ├── ErrorState.jsx
│   │       └── ErrorBoundary.jsx
│   ├── hooks/useCharacters.js
│   ├── lib/
│   │   ├── constants.js             # all tunables; no magic numbers elsewhere
│   │   ├── utils.js                 # clamp, buildUrl, range, scrollToTop
│   │   └── validations.js           # runtime shape guards
│   ├── services/charactersService.js
│   ├── styles/{base,components,utilities}.css
│   ├── App.jsx
│   └── main.jsx
├── .oxlintrc.json
├── pnpm-workspace.yaml              # pnpm 12 repo settings (allowBuilds)
└── vite.config.js
```

## Installation

Requires **Node >= 24** and **pnpm 12**.

```bash
git clone https://github.com/carlosAndress101/rick-and-morty.git
cd rick-and-morty
pnpm install
```

Optionally, point the app at a different backend:

```bash
cp .env.example .env.local   # then edit VITE_API_BASE_URL
```

## Development

```bash
pnpm dev
```

Opens http://localhost:5173/rick-and-morty/ — note the sub-path, which mirrors the
GitHub Pages deployment so local and production behave identically.

## Linting and formatting

```bash
pnpm lint          # oxlint, zero-warning policy
pnpm lint:fix      # auto-fix what Oxlint can
pnpm format        # oxfmt, writes in place
pnpm format:check  # oxfmt --check (CI-friendly)
pnpm check         # lint + format:check + build
```

Linting and formatting are both OXC — there is no ESLint and no Prettier in this
project. Rule choices and the three deliberate overrides are documented in
[CLAUDE.md](./CLAUDE.md#the-toolchain-is-oxc-end-to-end).

`oxfmt` is pre-1.0 (0.67.0), so its output may shift between minor releases; the version
is caret-ranged like the rest of the toolchain.

## Build

```bash
pnpm build     # -> dist/
pnpm preview   # serve dist/ at http://localhost:4173/rick-and-morty/
```

## Deploy

```bash
pnpm deploy
```

`predeploy` builds automatically, then `gh-pages` publishes `dist/` to the `gh-pages`
branch. `vite.config.js` sets `base: "/rick-and-morty/"` because this is a GitHub Pages
_project_ site served from a sub-path — if you rename the repository, update that value.

## Browser support

| Browser                  | Minimum   | Status |
| ------------------------ | --------- | ------ |
| Chrome                   | 107       | ✅     |
| Edge                     | 107       | ✅     |
| Firefox                  | 102 (ESR) | ✅     |
| Safari                   | 16        | ✅     |
| iOS Safari               | 16        | ✅     |
| Android Chromium WebView | 107       | ✅     |

Enforced by `build.target` in `vite.config.js`, not merely asserted. The binding
constraint is Safari 16.

The app deliberately avoids `AbortSignal.any()` (Safari 17.4+) and
`AbortSignal.timeout()` (Safari 16.0), using `combineSignals()` and
`createTimeoutSignal()` from `src/lib/utils.js` instead — both built from
`AbortController` alone.

**Known limitation:** JavaScript is required; there is no server-rendered fallback. A
`<noscript>` message explains this.

## Accessibility

Targets WCAG 2.1 AA.

- Skip link to `#main-content`; `banner` / `main` / `contentinfo` landmarks.
- Pagination is a `<nav>` with an accessible name; every button has an `aria-label`
  naming its destination page, and decorative chevrons are `aria-hidden`.
- One announcement per event: a polite `role="status"` region narrates loading and
  completion, and falls silent on failure so the error panel's `role="alert"` /
  `aria-live="assertive"` is the only thing that speaks.
- The grid is marked `aria-busy` while a new page loads; skeletons are `aria-hidden`
  because the live region already conveys the state.
- Single `<h1>`; character names are `<h2>`. Species and origin are text, not headings —
  the original markup used `<h3>` for data.
- Every avatar has a descriptive `alt`, plus intrinsic `width`/`height` so nothing shifts.
- 3px high-contrast `:focus-visible` ring on all interactive elements.
- Button and badge colours re-tuned via Bootstrap CSS variables for AA contrast on dark.
- `prefers-reduced-motion` collapses transitions and animations, and also switches
  programmatic scrolling from smooth to instant.

## Performance

- `react-bootstrap` removed — it was carried for a single `Spinner`. That deleted the
  dependency and its transitive tree (`@restart/ui`, `dom-helpers`, `prop-types`,
  `uncontrollable`, …).
- `CharacterCard` is memoised; the service returns stable character objects.
- Avatars use `loading="lazy"`, `decoding="async"` and intrinsic dimensions → no CLS.
- `preconnect` / `dns-prefetch` to the API host so the request starts during JS parse.
- Requests carry a 10s timeout and are aborted on page change and unmount.
- Build targets an explicit browser list (Safari 16 floor); no sourcemaps shipped.

Production bundle: **200.64 kB JS (63.23 kB gzip)**, **235.13 kB CSS (32.18 kB gzip)**,
built in ~91 ms.

## Future improvements

- **Drop Bootstrap.** Only `container`, `btn*`, `badge`/`text-bg-*` and `visually-hidden`
  are still used. Reimplementing them locally is ~60 lines of CSS and would cut the
  stylesheet from ~32 kB gzip to ~3 kB — by far the largest remaining win.
- **Add a test runner.** Vitest + Testing Library. The service layer is pure and already
  covers timeout, abort, network, parse and validation branches worth asserting.
- **Search and filters.** The API supports `?name=`, `?status=`, `?species=`; the service
  layer is already shaped to take them.
- **URL-synced pagination**, so a page can be linked and survives a refresh.
- **Character detail view**, which is the point at which a router earns its place.
- **CI**: run `pnpm check` on pull requests, and deploy from a workflow instead of a
  developer's machine.
- **Husky + lint-staged** for a pre-commit gate — deliberately omitted for now to keep the
  dependency count low.
