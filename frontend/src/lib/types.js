/**
 * @typedef {Object} Project
 * @property {number} id
 * @property {string} name
 * @property {string | null | undefined} [description]
 */

/**
 * @typedef {Object} SearchResult
 * @property {number} score
 * @property {number} document_id
 * @property {string} filename
 * @property {number} chunk_index
 * @property {string} text
 */

/**
 * @typedef {Object} AskSource
 * @property {string} filename
 * @property {number} chunk_index
 * @property {number} score
 */

/**
 * @typedef {Object} AskResponse
 * @property {string} query
 * @property {string} answer
 * @property {AskSource[]} sources
 */

export {}
