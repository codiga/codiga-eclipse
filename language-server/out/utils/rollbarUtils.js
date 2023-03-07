"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollbarLogger = void 0;
const rollbar = {};
// const rollbar = new Rollbar({
//   accessToken: "006f7f73a626418d845fbd348661724f",
//   environment: "production",
//   autoInstrument: true,
//   wrapGlobalEventHandlers: true,
//   captureUncaught: true,
//   captureUnhandledRejections: true,
//   payload: {
//     codiga_version: getExtensionVersion(),
//     vscode_version: vscode.version,
//   },
// });
const rollbarLogger = (...args) => {
    // rollbar.error(...args);
};
exports.rollbarLogger = rollbarLogger;
//# sourceMappingURL=rollbarUtils.js.map