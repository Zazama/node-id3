/**
 * @typedef {object} Options
 * @property {string[]} [includes] Only read the specified tag identifiers, defaults to all.
 * @property {string[]} [excludes] Do not read the specified tag identifiers, defaults to none.
 * @property {boolean} [onlyRaw] Only return the `raw` object, defaults to false.
 * @property {boolean} [noRaw] Do not generate the `raw` object, defaults to false.
 *
 * @typedef WriteCallback
 * @type {(error: Error) => void}
 *
 * @typedef ReadCallback
 * @type {(error: Error, tags: object) => void}
 *
 * @typedef CreateCallback
 * @type {(tags: object) => void}
 */
