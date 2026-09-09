/**
 * Transport layer for the Rick and Morty REST API.
 *
 * This module owns everything network-shaped — URL construction, aborting, timeouts,
 * HTTP status handling and JSON parsing — and nothing domain-shaped. It returns raw
 * decoded payloads; interpreting them is the job of `src/services/`.
 *
 * Every failure mode is normalised into an {@link ApiError} so callers never have to
 * discriminate between a `TypeError` from `fetch`, a `SyntaxError` from `.json()` and
 * a non-2xx response.
 */

import { API_BASE_URL, CHARACTERS_PATH, REQUEST_TIMEOUT_MS } from "../lib/constants.js";
import { buildUrl, combineSignals, createTimeoutSignal } from "../lib/utils.js";

/**
 * Categories of API failure, used to pick a user-facing message and decide whether a
 * retry is worth offering.
 *
 * - `timeout`  — the request exceeded {@link REQUEST_TIMEOUT_MS}.
 * - `network`  — DNS/offline/CORS; the request never produced a response.
 * - `http`     — a response arrived with a non-2xx status.
 * - `parse`    — the body was not valid JSON.
 * - `validation` — the body was valid JSON but not the shape we expect.
 * - `unknown`  — anything else.
 *
 * @typedef {"timeout" | "network" | "http" | "parse" | "validation" | "unknown"} ApiErrorKind
 */

/**
 * Error type raised by every function in this module.
 *
 * @augments Error
 */
export class ApiError extends Error {
  /**
   * @param {ApiErrorKind} kind - Failure category.
   * @param {string} message - Developer-facing description.
   * @param {{ status?: number, cause?: unknown }} [options] - Extra context.
   */
  constructor(kind, message, { status, cause } = {}) {
    super(message, { cause });
    this.name = "ApiError";
    /** @type {ApiErrorKind} */
    this.kind = kind;
    /** @type {number | undefined} HTTP status code, when one was received. */
    this.status = status;
  }
}

/**
 * Reports whether an error represents a deliberate cancellation rather than a failure.
 *
 * Callers use this to stay silent when a request was aborted because the user moved on,
 * instead of showing an error state for work nobody is waiting on any more.
 *
 * @param {unknown} error - Value caught from an API call.
 * @returns {boolean} `true` when the request was cancelled by the caller's signal.
 */
export function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Performs a GET request and decodes a JSON body.
 *
 * The caller's `signal` is combined with an independent timeout signal, so a request is
 * cancelled by whichever fires first. A caller-driven abort propagates untouched (so it
 * can be recognised by {@link isAbortError}); a timeout is converted into an
 * {@link ApiError} of kind `timeout`.
 *
 * Combination goes through {@link combineSignals} rather than `AbortSignal.any()`, which
 * is unavailable below Safari 17.4 and would throw before `fetch` was reached. The
 * timeout timer is always cleared in `finally`, including on the success path.
 *
 * @param {string} url - Absolute URL to request.
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options] - Request options.
 * @returns {Promise<unknown>} The decoded JSON body.
 * @throws {ApiError} For every failure other than a caller-driven abort.
 * @throws {DOMException} `AbortError`, when the caller's own signal aborts.
 */
async function requestJson(url, { signal, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const timeout = createTimeoutSignal(timeoutMs);
  const combinedSignal = combineSignals([signal, timeout.signal]);

  try {
    let response;

    try {
      response = await fetch(url, {
        signal: combinedSignal,
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      // The caller cancelled: let it through untouched so the hook can ignore it.
      if (signal?.aborted) {
        throw error;
      }

      if (timeout.signal.aborted) {
        throw new ApiError("timeout", `Request to ${url} timed out after ${timeoutMs}ms`, {
          cause: error,
        });
      }

      throw new ApiError("network", `Network request to ${url} failed`, { cause: error });
    }

    if (!response.ok) {
      throw new ApiError("http", `Request to ${url} failed with status ${response.status}`, {
        status: response.status,
      });
    }

    try {
      return await response.json();
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      if (timeout.signal.aborted) {
        throw new ApiError("timeout", `Request to ${url} timed out after ${timeoutMs}ms`, {
          cause: error,
        });
      }

      throw new ApiError("parse", `Response from ${url} was not valid JSON`, { cause: error });
    }
  } finally {
    // Runs on success too, so the pending timer never outlives the request.
    timeout.cancel();
  }
}

/**
 * Fetches one page of the character collection.
 *
 * @param {number} page - 1-based page number.
 * @param {{ signal?: AbortSignal }} [options] - Request options.
 * @returns {Promise<unknown>} The raw, unvalidated response body.
 * @throws {ApiError} On timeout, network failure, non-2xx status or unparseable body.
 */
export function fetchCharacterPage(page, { signal } = {}) {
  return requestJson(buildUrl(API_BASE_URL, CHARACTERS_PATH, { page }), { signal });
}
