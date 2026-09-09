import { memo } from "react";

import { AVATAR_SIZE } from "../../lib/constants.js";

/**
 * Maps a character's life status onto a Bootstrap badge variant.
 *
 * Defined at module scope so the lookup is not rebuilt on every render.
 *
 * @type {Readonly<Record<string, string>>}
 */
const STATUS_VARIANTS = Object.freeze({
  Alive: "text-bg-success",
  Dead: "text-bg-danger",
  unknown: "text-bg-secondary",
});

/**
 * Presentational card for a single character.
 *
 * Pure render — it receives data and renders it, with no fetching or state of its own.
 * Memoised because the grid re-renders on every page change while individual character
 * objects are stable references from the service layer.
 *
 * @param {object} props
 * @param {import("../../services/charactersService.js").Character} props.character
 * @returns The rendered character card.
 */
function CharacterCard({ character }) {
  const { name, image, species, status, origin } = character;
  const statusVariant = STATUS_VARIANTS[status] ?? STATUS_VARIANTS.unknown;

  return (
    <article className="character-card">
      <img
        className="character-card__image"
        src={image}
        alt={`Portrait of ${name}`}
        width={AVATAR_SIZE.width}
        height={AVATAR_SIZE.height}
        loading="lazy"
        decoding="async"
      />

      <div className="character-card__body">
        <h2 className="character-card__name">{name}</h2>

        <p className="character-card__meta">
          <span className={`badge ${statusVariant}`}>{status}</span>
          <span className="character-card__species">{species}</span>
        </p>

        <p className="character-card__origin">
          <span className="character-card__label">Origin</span>
          {origin}
        </p>
      </div>
    </article>
  );
}

export default memo(CharacterCard);
