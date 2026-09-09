import CharacterCard from "./CharacterCard.jsx";

/**
 * Responsive grid of character cards.
 *
 * Keyed by the API's stable `id` rather than array position, so React reuses DOM nodes
 * correctly when the page changes underneath it.
 *
 * @param {object} props
 * @param {import("../../services/charactersService.js").Character[]} props.characters
 * @param {boolean} [props.busy=false] - When true the grid is dimmed and marked
 *   `aria-busy` because a newer page is on its way. The current characters stay mounted
 *   so the layout does not collapse mid-navigation.
 * @returns The rendered character grid.
 */
function CharacterGrid({ characters, busy = false }) {
  return (
    <div className={`character-grid${busy ? " character-grid--busy" : ""}`} aria-busy={busy}>
      {characters.map((character) => (
        <CharacterCard key={character.id} character={character} />
      ))}
    </div>
  );
}

export default CharacterGrid;
