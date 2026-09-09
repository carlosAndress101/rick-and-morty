import { SKELETON_COUNT } from "../../lib/constants.js";
import { range } from "../../lib/utils.js";

/**
 * Placeholder grid shown during the very first load.
 *
 * Mirrors the real grid's column layout and card dimensions so the page does not shift
 * when data replaces it. Hidden from assistive technology — the surrounding live region
 * already announces that content is loading, and echoing empty boxes adds nothing.
 *
 * @param {object} props
 * @param {number} [props.count=SKELETON_COUNT] - Number of placeholder cards.
 * @returns The rendered placeholder grid.
 */
function CharacterSkeleton({ count = SKELETON_COUNT }) {
  return (
    <div className="character-grid" aria-hidden="true">
      {range(count).map((placeholderId) => (
        <div key={placeholderId} className="character-card character-card--skeleton">
          <div className="skeleton skeleton--image" />
          <div className="character-card__body">
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--line skeleton--short" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default CharacterSkeleton;
