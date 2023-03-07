"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.error = exports.log = exports.initConsole = void 0;
/**
 * Acts as replacement for the regular Node console. This wrapper helps avoid using the server connection object
 * throughout the project.
 */
let _console;
/**
 * Saves the language server connection's RemoteConsole, or if in test mode, then uses the Node console.
 *
 * @param _remoteConsole the remote console
 */
function initConsole(_remoteConsole) {
    _console = !global.isInTestMode ? _remoteConsole : console;
}
exports.initConsole = initConsole;
/**
 * Sends a log-level message.
 *
 * @param message the log message
 */
function log(message) {
    _console.log(message);
}
exports.log = log;
/**
 * Sends an error-level message.
 *
 * @param message the log message
 */
function error(message) {
    _console.error(message);
}
exports.error = error;
//# sourceMappingURL=connectionLogger.js.map