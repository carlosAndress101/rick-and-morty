import { Component } from "react";

/**
 * Last-resort boundary for render-time crashes.
 *
 * The data path already normalises failures into an `ErrorState`, so this only catches
 * genuine bugs. Without it, such a bug unmounts the whole tree and leaves a blank page
 * with no way back; here the user at least gets an explanation and a reload.
 *
 * Must remain a class: React exposes no hook equivalent of `componentDidCatch`.
 *
 * @augments Component
 */
class ErrorBoundary extends Component {
  state = { hasError: false };

  /**
   * Flips the boundary into its fallback state during the render phase.
   *
   * @returns {{ hasError: boolean }} The next state.
   */
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  /**
   * Reports the crash so it is visible in the console and to any monitoring hook.
   *
   * @param {Error} error - The thrown error.
   * @param {{ componentStack: string }} info - React's component stack.
   */
  componentDidCatch(error, info) {
    console.error("Unhandled rendering error:", error, info.componentStack);
  }

  /** Clears the fallback and remounts the subtree. */
  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section className="state-panel" role="alert">
        <h2 className="state-panel__title">This page crashed</h2>
        <p className="state-panel__message">
          An unexpected error stopped the app from rendering. Reloading usually fixes it.
        </p>
        <button type="button" className="btn btn-info" onClick={this.handleReset}>
          Reload the view
        </button>
      </section>
    );
  }
}

export default ErrorBoundary;
