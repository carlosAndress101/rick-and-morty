import EmptyState from "../UI/EmptyState.jsx";
import ErrorState from "../UI/ErrorState.jsx";
import CharacterGrid from "./CharacterGrid.jsx";
import CharacterSkeleton from "./CharacterSkeleton.jsx";

/**
 * Picks the one content state that applies to the current request.
 *
 * Extracted from the container so the branching lives in a component whose whole job is
 * choosing between mutually exclusive states, and the container stays about page state.
 *
 * @param {object} props
 * @param {import("../../services/charactersService.js").Character[]} props.characters
 * @param {boolean} props.loading - Whether a request is in flight.
 * @param {import("../../hooks/useCharacters.js").CharactersError | null} props.error
 * @param {() => void} props.onRetry - Re-runs the failed request.
 * @returns The content state that applies.
 */
function CharacterResults({ characters, loading, error, onRetry }) {
  if (error) {
    return <ErrorState message={error.message} onRetry={onRetry} />;
  }

  // Nothing loaded yet and nothing to keep on screen: this is the first load.
  if (loading && characters.length === 0) {
    return <CharacterSkeleton />;
  }

  if (characters.length === 0) {
    return <EmptyState />;
  }

  return <CharacterGrid characters={characters} busy={loading} />;
}

export default CharacterResults;
