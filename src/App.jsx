import CharacterBrowser from "./components/Character/CharacterBrowser.jsx";
import Layout from "./components/Layout/Layout.jsx";
import ErrorBoundary from "./components/UI/ErrorBoundary.jsx";

/**
 * Application root.
 *
 * Composes the page chrome with the one feature this app has. Feature state lives in
 * {@link CharacterBrowser}, not here, so adding a second feature does not mean
 * untangling this component.
 *
 * @returns The composed application tree.
 */
function App() {
  return (
    <Layout title="Rick and Morty" subtitle="Browse every character across the multiverse">
      <ErrorBoundary>
        <CharacterBrowser />
      </ErrorBoundary>
    </Layout>
  );
}

export default App;
