/**
 * Runtime shape checks for API payloads.
 *
 * The app talks to a third-party API it does not control, so responses are validated
 * before they reach React. This keeps malformed data from surfacing as a render-time
 * crash ("cannot read property 'name' of undefined") deep inside the component tree.
 *
 * {@link isCharacterListResponse} is the only export: the narrower guards it composes are
 * implementation detail, and exporting them would invite callers to validate a fragment
 * of a payload rather than the whole thing.
 */

/**
 * Narrows an unknown value to a non-null plain object.
 *
 * @param {unknown} value - Value to test.
 * @returns {boolean} `true` when `value` is a non-null, non-array object.
 */
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks that a value is a finite number.
 *
 * @param {unknown} value - Value to test.
 * @returns {boolean} `true` when `value` is a finite number.
 */
function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Validates a single character entry from the API.
 *
 * Only the fields the UI actually renders are required; unknown extra fields are
 * allowed so the API can evolve without breaking the app.
 *
 * @param {unknown} value - Candidate character object.
 * @returns {boolean} `true` when the value can be rendered as a character card.
 */
function isCharacter(value) {
  return (
    isObject(value) &&
    isFiniteNumber(value.id) &&
    typeof value.name === "string" &&
    typeof value.image === "string" &&
    typeof value.species === "string" &&
    typeof value.status === "string"
  );
}

/**
 * Validates the pagination metadata block returned under `info`.
 *
 * @param {unknown} value - Candidate `info` object.
 * @returns {boolean} `true` when the value carries usable pagination metadata.
 */
function isPageInfo(value) {
  return isObject(value) && isFiniteNumber(value.count) && isFiniteNumber(value.pages);
}

/**
 * Validates a full character-collection response.
 *
 * @param {unknown} value - Candidate response body.
 * @returns {boolean} `true` when the body has both a valid `info` block and a
 *   `results` array of valid characters.
 */
export function isCharacterListResponse(value) {
  return (
    isObject(value) &&
    isPageInfo(value.info) &&
    Array.isArray(value.results) &&
    value.results.every((entry) => isCharacter(entry))
  );
}
