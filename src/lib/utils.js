/**
 * Small, dependency-free helpers shared across layers.
 */

/**
 * Constrains a number to an inclusive range.
 *
 * @param {number} value - Value to constrain.
 * @param {number} min - Lower bound, returned when `value` is smaller.
 * @param {number} max - Upper bound, returned when `value` is larger.
 * @returns {number} `value` clamped to `[min, max]`.
 *
 * @example
 * clamp(0, 1, 42); // 1
 * clamp(99, 1, 42); // 42
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Builds an absolute URL from a base, a path and a set of query parameters.
 *
 * Parameters whose value is `null` or `undefined` are omitted, so callers can pass
 * optional filters without branching.
 *
 * @param {string} baseUrl - Absolute base URL, e.g. `https://rickandmortyapi.com/api`.
 * @param {string} path - Path appended to the base, e.g. `/character`.
 * @param {Record<string, string | number | null | undefined>} [params] - Query parameters.
 * @returns {string} The serialised absolute URL.
 *
 * @example
 * buildUrl("https://api.test", "/character", { page: 2 });
 * // "https://api.test/character?page=2"
 */
export function buildUrl(baseUrl, path, params = {}) {
  const url = new URL(`${baseUrl}${path}`);

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

/**
 * Creates a range of consecutive integers.
 *
 * Used to render a fixed number of skeleton placeholders without relying on array
 * indices as React keys.
 *
 * @param {number} length - How many integers to produce.
 * @param {number} [start=0] - First integer in the range.
 * @returns {number[]} An array of `length` consecutive integers.
 */
export function range(length, start = 0) {
  return Array.from({ length }, (_, index) => start + index);
}

/**
 * Reports whether the user has asked the operating system to reduce motion.
 *
 * Defaults to `false` in environments without `matchMedia`, so callers keep their
 * animated behaviour rather than silently degrading.
 *
 * Private: {@link scrollToTop} is the only consumer, and exporting this would invite
 * callers to re-implement the preference check instead of using the helper that honours it.
 *
 * @returns {boolean} `true` when animations should be suppressed.
 */
function prefersReducedMotion() {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Scrolls the window back to the top of the document.
 *
 * Smooth by default, but instant when the user has requested reduced motion — a CSS
 * media query cannot override the `behavior` option of a programmatic scroll.
 *
 * @returns {void}
 */
export function scrollToTop() {
  globalThis.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

/**
 * Creates an {@link AbortSignal} that aborts after a delay, plus a way to cancel it.
 *
 * Deliberately built from `AbortController` + `setTimeout` rather than
 * `AbortSignal.timeout()`. Two reasons:
 *
 * 1. **Reach.** `AbortSignal.timeout()` landed in Safari 16.0, Chrome 103 and Firefox
 *    100. This construction works everywhere `AbortController` does (Safari 12.1+).
 * 2. **No dangling timer.** A signal from `AbortSignal.timeout()` cannot be cancelled, so
 *    its timer keeps the callback — and everything it closes over — alive for the full
 *    duration even after the request has already succeeded. `cancel()` clears it.
 *
 * The abort reason is a `TimeoutError` `DOMException`, matching what
 * `AbortSignal.timeout()` produces, so callers can discriminate it from a caller-driven
 * `AbortError` in exactly the same way.
 *
 * @param {number} timeoutMs - Delay in milliseconds before the signal aborts.
 * @returns {{ signal: AbortSignal, cancel: () => void }} The signal, and a `cancel`
 *   function that clears the pending timer. `cancel` is safe to call more than once and
 *   after the signal has already aborted.
 *
 * @example
 * const timeout = createTimeoutSignal(10_000);
 * try {
 *   await fetch(url, { signal: timeout.signal });
 * } finally {
 *   timeout.cancel();
 * }
 */
export function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();

  const timerId = setTimeout(() => {
    controller.abort(new DOMException(`Timed out after ${timeoutMs}ms`, "TimeoutError"));
  }, timeoutMs);

  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timerId),
  };
}

/**
 * Combines several {@link AbortSignal}s into one that aborts as soon as any of them does.
 *
 * This is a hand-rolled replacement for `AbortSignal.any()`, which is **not** available
 * in Safari or iOS Safari below 17.4, Firefox below 124, Chrome below 116, or the
 * Chromium WebViews those versions shipped in. Because `AbortSignal.any` is read at
 * request time, using it directly threw a `TypeError` on those browsers *before* `fetch`
 * was ever called, so the app failed with no network activity and no error state.
 *
 * This implementation uses only `AbortController` and `addEventListener`, both available
 * since Safari 12.1 / Chrome 66 / Firefox 57.
 *
 * Memory behaviour: a listener is attached to each source signal, and every one of them
 * is removed the moment the combined signal aborts — whichever source triggered it. A
 * source that is already aborted short-circuits without any listener being attached at
 * all. Nothing is left registered on a long-lived signal after it has fired.
 *
 * `null` and `undefined` entries are skipped, so callers can pass an optional signal
 * without branching.
 *
 * @param {Array<AbortSignal | null | undefined>} signals - Signals to combine.
 * @returns {AbortSignal} A standard `AbortSignal` that aborts with the reason of
 *   whichever source aborted first. If every entry is nullish, the returned signal simply
 *   never aborts on its own.
 *
 * @example
 * const timeout = createTimeoutSignal(10_000);
 * const signal = combineSignals([callerSignal, timeout.signal]);
 */
export function combineSignals(signals) {
  const controller = new AbortController();
  const sources = signals.filter((signal) => signal != null);

  // An already-aborted source wins immediately; attaching listeners would be pointless
  // because "abort" has already fired on it and will not fire again.
  const alreadyAborted = sources.find((signal) => signal.aborted);

  if (alreadyAborted) {
    controller.abort(alreadyAborted.reason);
    return controller.signal;
  }

  /** @type {Array<() => void>} Detach functions, one per attached listener. */
  const detachers = [];

  for (const source of sources) {
    const handleAbort = () => controller.abort(source.reason);

    source.addEventListener("abort", handleAbort);
    detachers.push(() => source.removeEventListener("abort", handleAbort));
  }

  // Fires once, no matter which source aborted, so no listener outlives the combination.
  controller.signal.addEventListener(
    "abort",
    () => {
      for (const detach of detachers) {
        detach();
      }
      detachers.length = 0;
    },
    { once: true },
  );

  return controller.signal;
}
