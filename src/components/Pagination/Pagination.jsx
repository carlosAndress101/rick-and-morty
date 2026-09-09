/**
 * Pagination controls driven entirely by API metadata.
 *
 * Every bound comes from the `pageInfo` the API reported for the current page; there are
 * no hardcoded page counts, so the control stays correct if the collection grows.
 *
 * @param {object} props
 * @param {number} props.page - Current 1-based page number.
 * @param {number} props.totalPages - Total pages available, from the API.
 * @param {boolean} props.hasPrevious - Whether a previous page exists.
 * @param {boolean} props.hasNext - Whether a next page exists.
 * @param {boolean} [props.disabled=false] - Disables every control, e.g. while loading.
 * @param {(page: number) => void} props.onPageChange - Requests a different page.
 * @param {string} [props.label="Character pagination"] - Accessible name of the nav landmark.
 * @returns The rendered pagination nav, or `null` when there is nothing to page through.
 */
function Pagination({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  disabled = false,
  onPageChange,
  label = "Character pagination",
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav className="pagination-bar" aria-label={label}>
      <div className="pagination-bar__group">
        <button
          type="button"
          className="btn btn-outline-info"
          onClick={() => onPageChange(1)}
          disabled={disabled || !hasPrevious}
          aria-label="Go to first page"
        >
          <span aria-hidden="true">«</span> First
        </button>

        <button
          type="button"
          className="btn btn-info"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || !hasPrevious}
          aria-label={`Go to previous page, page ${page - 1}`}
        >
          <span aria-hidden="true">‹</span> Previous
        </button>
      </div>

      <p className="pagination-bar__status">
        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
      </p>

      <div className="pagination-bar__group">
        <button
          type="button"
          className="btn btn-info"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || !hasNext}
          aria-label={`Go to next page, page ${page + 1}`}
        >
          Next <span aria-hidden="true">›</span>
        </button>

        <button
          type="button"
          className="btn btn-outline-info"
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || !hasNext}
          aria-label={`Go to last page, page ${totalPages}`}
        >
          Last <span aria-hidden="true">»</span>
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
