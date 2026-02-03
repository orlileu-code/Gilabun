/**
 * Stub for "undici" on the client. The browser doesn't need undici (Node fetch).
 * Replacing it avoids parsing undici's #private fields in the client bundle.
 */
module.exports = {};
