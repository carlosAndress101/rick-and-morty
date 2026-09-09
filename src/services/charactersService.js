/**
 * Domain layer for characters.
 *
 * Sits between the transport (`src/api/`) and React (`src/hooks/`). It validates raw
 * payloads, normalises them into the shape the UI consumes, and translates
 * domain-meaningful HTTP statuses into ordinary results.
 *
 * Keeping this separate from the API client means the UI never sees a raw API payload,
 * and swapping the endpoint or its response format touches one file.
 */

import { ApiError, fetchCharacterPage } from "../api/rickAndMorty.js";
import { isCharacterListResponse } from "../lib/validations.js";

/**
 * A character as consumed by the UI.
 *
 * @typedef {object} Character
 * @property {number} id - Stable unique identifier, used as the React key.
 * @property {string} name - Character name.
 * @property {string} image - Absolute URL of the avatar.
 * @property {string} species - Species, e.g. `"Human"`.
 * @property {string} status - Life status: `"Alive"`, `"Dead"` or `"unknown"`.
 * @property {string} origin - Origin location name, or `"Unknown"` when absent.
 */

/**
 * Pagination metadata for the character collection.
 *
 * @typedef {object} PageInfo
 * @property {number} page - The page these results belong to.
 * @property {number} pages - Total number of pages available.
 * @property {number} count - Total number of characters across all pages.
 * @property {boolean} hasPrevious - Whether a previous page exists.
 * @property {boolean} hasNext - Whether a next page exists.
 */

/**
 * One page of characters plus its metadata.
 *
 * @typedef {object} CharacterPage
 * @property {Character[]} characters - Characters on this page, possibly empty.
 * @property {PageInfo} pageInfo - Pagination metadata for this page.
 */

/**
 * Pagination metadata used when the API reports that a page holds nothing.
 * @type {PageInfo}
 */
const EMPTY_PAGE_INFO = {
  page: 1,
  pages: 0,
  count: 0,
  hasPrevious: false,
  hasNext: false,
};

/**
 * Converts a validated API character into the UI's {@link Character} shape.
 *
 * `origin` is flattened from a nested object to a string, and its documented
 * `"unknown"` sentinel is normalised for display.
 *
 * @param {Record<string, any>} raw - A validated raw character entry.
 * @returns {Character} The normalised character.
 */
function toCharacter(raw) {
  const originName = raw.origin?.name;

  return {
    id: raw.id,
    name: raw.name,
    image: raw.image,
    species: raw.species,
    status: raw.status,
    origin: !originName || originName === "unknown" ? "Unknown" : originName,
  };
}

/**
 * Loads and normalises one page of characters.
 *
 * The API answers 404 for a page beyond the end of the collection. That is a legitimate
 * "nothing here" outcome rather than a failure, so it resolves to an empty page and the
 * UI renders an empty state instead of an error.
 *
 * @param {number} page - 1-based page number.
 * @param {{ signal?: AbortSignal }} [options] - Request options.
 * @returns {Promise<CharacterPage>} The page's characters and metadata.
 * @throws {ApiError} On transport failure, or of kind `validation` when the payload
 *   does not match the expected shape.
 * @throws {DOMException} `AbortError`, when the caller's signal aborts.
 */
export async function getCharacterPage(page, { signal } = {}) {
  let payload;

  try {
    payload = await fetchCharacterPage(page, { signal });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return { characters: [], pageInfo: { ...EMPTY_PAGE_INFO, page } };
    }

    throw error;
  }

  if (!isCharacterListResponse(payload)) {
    throw new ApiError("validation", `Character page ${page} did not match the expected shape`);
  }

  const { info, results } = payload;

  return {
    characters: results.map((entry) => toCharacter(entry)),
    pageInfo: {
      page,
      pages: info.pages,
      count: info.count,
      hasPrevious: page > 1,
      hasNext: page < info.pages,
    },
  };
}
