# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm 12** (pinned via `packageManager` in `package.json`). Node **>= 24** is required by `engines`.

```bash
pnpm install       # install; @swc/core's build script is pre-approved in pnpm-workspace.yaml
pnpm dev           # Vite dev server, opens at http://localhost:5173/rick-and-morty/
pnpm lint          # oxlint --max-warnings=0
pnpm lint:fix      # oxlint --fix
pnpm format        # oxfmt (writes in place)
pnpm format:check  # oxfmt --check
pnpm build         # production build -> dist/
pnpm preview       # serve dist/ at http://localhost:4173/rick-and-morty/
pnpm check         # lint + format:check + build, the full gate
pnpm deploy        # builds via predeploy, then gh-pages -d dist
```

There is **no test framework** in this project. Do not assume `pnpm test` exists.

### The toolchain is OXC end to end

Linting is **Oxlint** (`.oxlintrc.json`) and formatting is **oxfmt** (`.oxfmtrc.json`). ESLint and
Prettier were both removed — there is no `.eslintrc.*`, no `.prettierrc*`, and neither package is
installed. Do not reintroduce them.

`oxfmt` is pinned at 0.67.0, which is pre-1.0: expect its output to shift between minor releases.
It formats JS, JSX, CSS, Markdown and JSON, so its coverage matches what Prettier handled here. Its
config was produced by `oxfmt --migrate=prettier`, so the style rules are unchanged.

Note that `oxfmt` reads `.gitignore` and `.prettierignore` for ignore patterns by default; since
this repo has no `.prettierignore`, its exclusions live in `ignorePatterns` inside `.oxfmtrc.json`.

Three rules are deliberately overridden — do not "fix" them back:

- `react/react-in-jsx-scope: off` — the project uses the automatic JSX runtime, so `React` is never imported for JSX alone.
- `react-perf/jsx-no-new-function-as-prop: off` — it fires on every inline handler passed to a plain DOM element, where a fresh closure costs nothing. Inline handlers on **memoised** components are still worth avoiding by hand.
- `import/no-unassigned-import` — allows `**/*.css`, since side-effect CSS imports are how the bundler collects styles.

`max-lines-per-function` is set to 200 to match the repo's file-size target rather than the 50-line default, which no JSX component can meet.

## Architecture

React 19 + Vite 8 (SWC) single-page app listing Rick and Morty characters. Plain JavaScript and JSX — **no TypeScript**, no router, no state library. Types are expressed as JSDoc typedefs and consumed by editors only.

### Layers

Data flows in one direction, and each layer is only allowed to know about the one below it:

```
components/  render only, no fetching, no formatting
   ↓
hooks/       React lifecycle: request state, abort, retry
   ↓
services/    domain: validate payloads, normalise to UI shapes
   ↓
api/         transport: URLs, timeouts, HTTP status, JSON parsing
   ↓
lib/         constants, pure utilities, shape guards
```

- **`api/rickAndMorty.js`** owns everything network-shaped. Every failure — offline, timeout, non-2xx, unparseable body — is normalised into an `ApiError` carrying a `kind` (`timeout | network | http | parse | validation | unknown`). A caller-driven abort is deliberately _re-thrown untouched_ as a `DOMException` so it can be told apart from a real failure by `isAbortError()`.
- **`lib/validations.js`** exports only `isCharacterListResponse`. The narrower guards it composes are private on purpose: validating a fragment of a payload is not a supported operation.
- **`services/charactersService.js`** validates the raw payload and maps it to `Character` / `PageInfo`. It also turns the API's 404-for-an-out-of-range-page into an ordinary empty result, because that is a "nothing here" outcome rather than a failure.
- **`hooks/useCharacters.js`** is the only place React touches the data path. Returns `{ characters, loading, error, pageInfo, status, retry }`.
- **`components/`** are grouped by feature (`Character/`, `Pagination/`, `UI/`, `Layout/`). `CharacterBrowser` is the sole container: it owns the current page number and nothing else.

### Rules that are load-bearing

**No `fetch` inside a component.** If a component needs data, add it to a service and expose it through a hook.

**Never use `AbortSignal.any()` or `AbortSignal.timeout()`.** Both are above the project's browser floor — `any()` is Safari 17.4+, and because it is read at request time it threw a `TypeError` _before_ `fetch` was reached, failing the app with no network activity and no error state. Use `combineSignals()` and `createTimeoutSignal()` from `lib/utils.js`, which are built from `AbortController` alone. `createTimeoutSignal` also returns a `cancel()` that `requestJson` calls in `finally`, so no timer outlives a successful request.

**The supported browser floor is Safari 16 / Chrome 107 / Edge 107 / Firefox 102**, declared in `vite.config.js` as `build.target`. It is an explicit browser list rather than a bare `es2022` level so the matrix is enforced by the build. Raising any entry is a compatibility decision.

**Concurrency is handled by cancellation, not by ignoring results.** `useCharacters` keeps the in-flight `AbortController` in a ref and aborts it before starting the next request. This is why a slow page-1 response can never overwrite a fast page-2 response. `retry` calls the same `load` function rather than bumping a token, which keeps the effect's dependency array honest — the previous token-based version tripped `react/exhaustive-effect-dependencies`.

**Pagination bounds come from `page` + `pageInfo.pages`, never from `pageInfo.hasNext`.** During a transition `pageInfo` still describes the _loaded_ page, so using its flags would lag the user's position by one render. The service still exposes `hasPrevious`/`hasNext` as part of its metadata contract; the UI just doesn't drive buttons off them.

**No magic page counts.** The original code hardcoded `page >= 42`. The API reports `info.pages` (currently 42); everything derives from it.

**One announcement per event.** `ErrorState` is the single error announcement (`role="alert"` + `aria-live="assertive"`). The feature's polite `role="status"` region returns an empty string while `error` is set, and `EmptyState` carries no live region at all, because both only ever mount as the result of a page change the status region already narrates. Adding a second live region for the same event makes a screen reader say it twice.

**Loading keeps the previous page on screen.** The reducer's `start` action deliberately preserves `characters` and `pageInfo`. The grid is dimmed and marked `aria-busy` instead of being unmounted, so page height and scroll position stay stable. A full skeleton (`CharacterSkeleton`) is only shown when there is genuinely nothing to keep — the first load.

**Programmatic scrolling must go through `scrollToTop()` in `lib/utils.js`.** A `prefers-reduced-motion` CSS rule cannot override the `behavior` option of a JS `scrollTo`, so the check has to happen in JS.

### Styling

Bootstrap 5 is kept, but only for `container`, `btn`/`btn-info`/`btn-outline-info`, `badge`/`text-bg-*` and `visually-hidden`. The grid is native CSS Grid (`auto-fill`/`minmax`), not Bootstrap's `.row`/`.col-*`.

Local CSS lives in `src/styles/` and is imported _after_ Bootstrap in `main.jsx` so it wins on equal specificity:

- `base.css` — design tokens (`--app-*`), document defaults, page chrome, focus rings, and the Bootstrap CSS-variable overrides that bring button contrast up to WCAG AA on the dark surface.
- `components.css` — one block per component, class names mirroring the JSX.
- `utilities.css` — global preference overrides. Only add a utility here if something actually uses it.

Components carry semantic class names (`character-card__name`), not long inline utility strings.

### Deployment

`pnpm deploy` runs `predeploy` (build) then pushes `dist/` to the `gh-pages` branch.

`vite.config.js` sets `base: "/rick-and-morty/"` because the app is a GitHub Pages **project** site served from a sub-path. This is a root-relative path, not the absolute `https://carlosAndress101.github.io/...` URL that used to be there: it resolves to identical URLs once deployed, but it also lets `vite dev` and `vite preview` work locally instead of pointing assets at the live github.io host. Keep the trailing slash. If you change the repository name, change this too.

`VITE_API_BASE_URL` overrides the API root (see `.env.example`). `import.meta.env` is optional-chained in `lib/constants.js` so these modules can also be imported by a plain Node script.

### Conventions

- Every exported component, hook, service, API function and utility carries JSDoc. Non-obvious decisions are explained inline with the _why_, not the _what_.
- JSDoc must not reference React's types (`import("react").ReactElement` and friends). `@types/react` and `@types/react-dom` are not installed — this is a JavaScript-only project and they contributed nothing to the build, lint, format or bundle. The trade-off is that editors no longer type-check JSX props; describe return values in prose instead of reaching for a type that cannot resolve.
- Import extensions are explicit (`./foo.js`, `./Foo.jsx`).
- Double quotes, semicolons, 100-column width — enforced by `oxfmt`, not by hand.
