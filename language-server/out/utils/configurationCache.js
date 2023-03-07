"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkspaceFolders = exports.cacheWorkspaceFolders = exports.cacheCodigaApiToken = exports.getApiToken = exports.getUserFingerprint = exports.cacheUserFingerprint = void 0;
let currentFingerprint;
let codigaApiToken = undefined;
/**
 * Since there are client applications that don't support multiple workspaces, but only a single one
 * (announced via 'InitializeParams.rootUri'), we have to rely on string URI values instead of `WorkspaceFolder` objects.
 */
let workspaceFolderUris = [];
// -------- Fingerprint --------
/**
 * Caches the user fingerprint regardless if it is generated on the client or on server side.
 *
 * @param fingerprint
 */
function cacheUserFingerprint(fingerprint) {
    currentFingerprint = fingerprint;
}
exports.cacheUserFingerprint = cacheUserFingerprint;
const generateRandomString = (length) => {
    // Declare all characters
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let str = "";
    for (let i = 0; i < length; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return str;
};
/**
 * Get the user fingerprint from the configuration.
 *
 * Currently, if the fingerprint is generated on server side, it is re-generated for each launch of the language server.
 */
function getUserFingerprint() {
    if (currentFingerprint) {
        return currentFingerprint;
    }
    const newFingerprint = generateRandomString(10);
    currentFingerprint = newFingerprint;
    return newFingerprint;
}
exports.getUserFingerprint = getUserFingerprint;
// -------- Codiga API Token --------
/**
 * Get the Codiga API Token from the client application preferences.
 */
function getApiToken() {
    return codigaApiToken;
}
exports.getApiToken = getApiToken;
/**
 * Caches the api token on server side to minimize the server to client calls.
 */
function cacheCodigaApiToken(apiToken) {
    codigaApiToken = apiToken;
}
exports.cacheCodigaApiToken = cacheCodigaApiToken;
// -------- Workspace folders --------
/**
 * Saves the argument workspace folders. If null is provided, then an empty list is cached.
 *
 * @param folderUris the workspace folder URIs to cache
 */
function cacheWorkspaceFolders(folderUris) {
    workspaceFolderUris = folderUris ?? [];
}
exports.cacheWorkspaceFolders = cacheWorkspaceFolders;
/**
 * Returns the workspace folders from this cache.
 */
function getWorkspaceFolders() {
    return workspaceFolderUris;
}
exports.getWorkspaceFolders = getWorkspaceFolders;
//# sourceMappingURL=configurationCache.js.map