/**
 * Successful response that contained no records.
 *
 * Distinct from {@link ErrorState}: nothing failed, so no retry is offered.
 *
 * Carries no `aria-live`. It only ever mounts as the result of a page change that the
 * feature's polite status region already announces, so a live region here would make a
 * screen reader say two things about one event.
 *
 * @param {object} props
 * @param {string} [props.title="No characters here"] - Heading for the state.
 * @param {string} [props.message] - Supporting explanation.
 * @returns The rendered empty-state panel.
 */
function EmptyState({
  title = "No characters here",
  message = "This page of the multiverse is empty. Try going back a page.",
}) {
  return (
    <section className="state-panel">
      <h2 className="state-panel__title">{title}</h2>
      <p className="state-panel__message">{message}</p>
    </section>
  );
}

export default EmptyState;
