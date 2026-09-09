/**
 * Recoverable-failure state with a retry affordance.
 *
 * Announced assertively so a screen reader user learns the load failed even when focus
 * is elsewhere on the page.
 *
 * @param {object} props
 * @param {string} props.message - User-facing explanation of what went wrong.
 * @param {() => void} props.onRetry - Invoked when the user asks to try again.
 * @param {string} [props.title="Something went wrong"] - Heading for the state.
 * @returns The rendered error panel.
 */
function ErrorState({ message, onRetry, title = "Something went wrong" }) {
  return (
    <section className="state-panel" role="alert" aria-live="assertive">
      <h2 className="state-panel__title">{title}</h2>
      <p className="state-panel__message">{message}</p>
      <button type="button" className="btn btn-info" onClick={onRetry}>
        Try again
      </button>
    </section>
  );
}

export default ErrorState;
