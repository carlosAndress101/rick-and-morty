import { useCallback, useState } from "react";

import { useCharacters } from "../../hooks/useCharacters.js";
import { FIRST_PAGE } from "../../lib/constants.js";
import { clamp, scrollToTop } from "../../lib/utils.js";
import Pagination from "../Pagination/Pagination.jsx";
import CharacterResults from "./CharacterResults.jsx";

/**
 * Builds the sentence announced in the feature's polite live region.
 *
 * Failures are deliberately **not** announced here. `ErrorState` is a `role="alert"` with
 * `aria-live="assertive"`, so an error already interrupts the screen reader; repeating it
 * politely from this region produced two announcements for one event.
 *
 * @param {object} args
 * @param {boolean} args.loading - Whether a request is in flight.
 * @param {boolean} args.hasError - Whether the last request failed. When true this region
 *   stays silent and leaves the announcement to `ErrorState`.
 * @param {number} args.page - Current 1-based page number.
 * @param {number | null} args.totalPages - Total pages, or `null` before the first load.
 * @returns {string} A message describing the current state of the grid, or an empty
 *   string when there is nothing for this region to say.
 */
function buildStatusMessage({ loading, hasError, page, totalPages }) {
  if (hasError) {
    return "";
  }

  if (loading) {
    return `Loading page ${page}`;
  }

  return totalPages ? `Showing page ${page} of ${totalPages}` : `Showing page ${page}`;
}

/**
 * Container for the character browser.
 *
 * Owns the single piece of state the feature needs — the current page number — and
 * delegates everything else: loading to {@link useCharacters}, state selection to
 * {@link CharacterResults}, rendering to the presentational components below them.
 * Nothing here fetches or formats data.
 *
 * @returns The rendered character browser.
 */
function CharacterBrowser() {
  const [page, setPage] = useState(FIRST_PAGE);
  const { characters, loading, error, pageInfo, retry } = useCharacters(page);

  const totalPages = pageInfo?.pages ?? null;
  const isPaginated = totalPages !== null;
  const hasCharacters = characters.length > 0;

  /**
   * Moves to another page, clamped to the range the API reported.
   *
   * Bounds are derived from `page` rather than from `pageInfo.hasNext`, because
   * `pageInfo` still describes the *loaded* page during a transition and would lag the
   * user's position by one render.
   *
   * @param {number} nextPage - Requested 1-based page number.
   */
  const handlePageChange = useCallback(
    (nextPage) => {
      const target = clamp(nextPage, FIRST_PAGE, totalPages ?? nextPage);

      if (target === page) {
        return;
      }

      setPage(target);
      scrollToTop();
    },
    [page, totalPages],
  );

  // Shared by the top and bottom pagination bars so they can never disagree.
  const paginationProps = {
    page,
    totalPages: totalPages ?? 0,
    hasPrevious: page > FIRST_PAGE,
    hasNext: isPaginated && page < totalPages,
    disabled: loading,
    onPageChange: handlePageChange,
  };

  return (
    <>
      {/*
        Single polite live region for loading and success. Page transitions and completion
        are announced without the visual UI having to steal focus. Errors are owned by
        ErrorState's assertive role="alert", so exactly one announcement fires per event.
      */}
      <p className="visually-hidden" role="status" aria-live="polite">
        {buildStatusMessage({ loading, hasError: Boolean(error), page, totalPages })}
      </p>

      {isPaginated ? <Pagination {...paginationProps} label="Character pagination, top" /> : null}

      <CharacterResults characters={characters} loading={loading} error={error} onRetry={retry} />

      {isPaginated && hasCharacters ? (
        <Pagination {...paginationProps} label="Character pagination, bottom" />
      ) : null}
    </>
  );
}

export default CharacterBrowser;
