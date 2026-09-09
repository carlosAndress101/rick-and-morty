/**
 * Page chrome: skip link, banner header, main landmark and content info footer.
 *
 * Holds every landmark in one place so pages compose into a predictable document
 * outline for assistive technology.
 *
 * @param {object} props
 * @param {string} props.title - Page title, rendered as the sole `<h1>`.
 * @param {string} [props.subtitle] - Optional supporting line under the title.
 * @param {*} props.children - Main content.
 * @returns The rendered page chrome.
 */
function Layout({ title, subtitle, children }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="app-header">
        <div className="container">
          <h1 className="app-header__title">{title}</h1>
          {subtitle ? <p className="app-header__subtitle">{subtitle}</p> : null}
        </div>
      </header>

      <main id="main-content" className="app-main" tabIndex={-1}>
        <div className="container">{children}</div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p className="app-footer__text">
            Data from{" "}
            <a
              className="app-footer__link"
              href="https://rickandmortyapi.com"
              target="_blank"
              rel="noreferrer"
            >
              The Rick and Morty API
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
