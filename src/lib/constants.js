/**
 * Application-wide constants.
 *
 * Every value that would otherwise appear as a magic number or inline string in a
 * component lives here, so behaviour can be tuned in one place.
 */

/**
 * Base URL of the Rick and Morty REST API.
 *
 * Overridable through the `VITE_API_BASE_URL` environment variable (see `.env.example`)
 * so the app can be pointed at a mock or proxy without a code change.
 *
 * `import.meta.env` is optional-chained so these modules can also be imported by a plain
 * Node process (a test runner, a script) where Vite has not injected it.
 *
 * @type {string}
 */
export const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL ?? "https://rickandmortyapi.com/api";

/**
 * Path of the character collection endpoint, relative to {@link API_BASE_URL}.
 * @type {string}
 */
export const CHARACTERS_PATH = "/character";

/**
 * Milliseconds before an in-flight request is aborted.
 *
 * The public API is fast but unauthenticated and occasionally rate limited; without a
 * ceiling a stalled connection would leave the UI in a permanent loading state.
 *
 * @type {number}
 */
export const REQUEST_TIMEOUT_MS = 10_000;

/**
 * First (1-based) page number of the character collection.
 * @type {number}
 */
export const FIRST_PAGE = 1;

/**
 * Number of placeholder cards rendered while the first page loads.
 *
 * Matches the API's default page size so the skeleton occupies the same space as the
 * real grid and the page does not shift when data arrives.
 *
 * @type {number}
 */
export const SKELETON_COUNT = 20;

/**
 * Intrinsic pixel dimensions of a character avatar returned by the API.
 *
 * Rendered as `width`/`height` attributes so the browser can reserve the correct box
 * before the image loads, which removes cumulative layout shift.
 *
 * @type {{ width: number, height: number }}
 */
export const AVATAR_SIZE = { width: 300, height: 300 };

/**
 * Human-readable messages for each {@link import('../api/rickAndMorty.js').ApiErrorKind}.
 * @type {Readonly<Record<string, string>>}
 */
export const ERROR_MESSAGES = Object.freeze({
  timeout: "The request took too long to complete. The API may be busy right now.",
  network: "We couldn't reach the Rick and Morty API. Check your internet connection.",
  http: "The Rick and Morty API responded with an error.",
  parse: "The API returned a response we couldn't read.",
  validation: "The API returned data in an unexpected format.",
  unknown: "Something went wrong while loading characters.",
});
