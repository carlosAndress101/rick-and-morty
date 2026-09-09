/**
 * React binding for the characters domain.
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

import { isAbortError } from "../api/rickAndMorty.js";
import { ERROR_MESSAGES } from "../lib/constants.js";
import { getCharacterPage } from "../services/charactersService.js";

/**
 * Lifecycle of a page request.
 *
 * @typedef {"loading" | "success" | "error"} CharactersStatus
 */

/**
 * A failure shaped for display.
 *
 * @typedef {object} CharactersError
 * @property {import("../api/rickAndMorty.js").ApiErrorKind} kind - Failure category.
 * @property {string} message - Message safe to show to a user.
 */

/**
 * @typedef {object} CharactersState
 * @property {CharactersStatus} status - Current request lifecycle state.
 * @property {import("../services/charactersService.js").Character[]} characters
 * @property {import("../services/charactersService.js").PageInfo | null} pageInfo
 * @property {CharactersError | null} error
 */

/** @type {CharactersState} */
const INITIAL_STATE = {
  status: "loading",
  characters: [],
  pageInfo: null,
  error: null,
};

/**
 * Reduces request lifecycle events into {@link CharactersState}.
 *
 * `start` deliberately preserves `characters` and `pageInfo` from the previous page.
 * That is what lets the UI keep showing the page the user is looking at — dimmed and
 * marked busy — instead of blanking the grid on every navigation.
 *
 * @param {CharactersState} state - Previous state.
 * @param {{ type: "start" } | { type: "success", payload: import("../services/charactersService.js").CharacterPage } | { type: "failure", payload: CharactersError }} action
 * @returns {CharactersState} Next state.
 */
function charactersReducer(state, action) {
  switch (action.type) {
    case "start":
      return { ...state, status: "loading", error: null };
    case "success":
      return {
        status: "success",
        characters: action.payload.characters,
        pageInfo: action.payload.pageInfo,
        error: null,
      };
    case "failure":
      return { ...state, status: "error", error: action.payload };
    default:
      return state;
  }
}

/**
 * Translates a thrown value into a user-facing {@link CharactersError}.
 *
 * @param {unknown} error - Value caught from the service layer.
 * @returns {CharactersError} A displayable error.
 */
function toDisplayError(error) {
  const kind = error?.kind && ERROR_MESSAGES[error.kind] ? error.kind : "unknown";
  return { kind, message: ERROR_MESSAGES[kind] };
}

/**
 * Loads a page of characters and tracks its lifecycle.
 *
 * Concurrency is handled by aborting the previous request whenever `page` changes or the
 * component unmounts. Because a superseded request is cancelled rather than merely
 * ignored, a slow response for page 1 can never overwrite a fast response for page 2,
 * and no state update is attempted after unmount.
 *
 * @param {number} page - 1-based page number to load. Changing it starts a new request.
 * @returns {{
 *   characters: import("../services/charactersService.js").Character[],
 *   loading: boolean,
 *   error: CharactersError | null,
 *   pageInfo: import("../services/charactersService.js").PageInfo | null,
 *   status: CharactersStatus,
 *   retry: () => void
 * }} Characters for the page, its lifecycle flags, pagination metadata, and a `retry`
 *   callback that re-runs the current request.
 *
 * @example
 * const { characters, loading, error, pageInfo, retry } = useCharacters(page);
 */
export function useCharacters(page) {
  const [state, dispatch] = useReducer(charactersReducer, INITIAL_STATE);

  /**
   * Controller for the request currently in flight, so it can be aborted when a newer
   * one starts or the component unmounts.
   *
   * @type {{ current: AbortController | null }}
   */
  const controllerRef = useRef(null);

  /**
   * Starts a request for `targetPage`, cancelling whatever was already running.
   *
   * Because the superseded request is aborted rather than merely ignored, a slow
   * response for page 1 can never overwrite a fast response for page 2, and no state
   * update is attempted after unmount.
   *
   * Never rejects: every failure is folded into the reducer as a `failure` action.
   *
   * @param {number} targetPage - 1-based page number to load.
   * @returns {Promise<void>} Resolves once the request has settled or been cancelled.
   */
  const load = useCallback(async (targetPage) => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    dispatch({ type: "start" });

    try {
      const payload = await getCharacterPage(targetPage, { signal: controller.signal });

      if (!controller.signal.aborted) {
        dispatch({ type: "success", payload });
      }
    } catch (error) {
      // A cancelled request was superseded or unmounted; nobody is waiting on it.
      if (controller.signal.aborted || isAbortError(error)) {
        return;
      }

      dispatch({ type: "failure", payload: toDisplayError(error) });
    }
  }, []);

  useEffect(() => {
    void load(page);

    return () => controllerRef.current?.abort();
  }, [load, page]);

  /** Re-runs the request for the page currently being viewed. */
  const retry = useCallback(() => {
    void load(page);
  }, [load, page]);

  return useMemo(
    () => ({
      characters: state.characters,
      loading: state.status === "loading",
      error: state.error,
      pageInfo: state.pageInfo,
      status: state.status,
      retry,
    }),
    [state, retry],
  );
}
