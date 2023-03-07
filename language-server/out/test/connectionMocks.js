"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockConnection = void 0;
/**
 * Creates a mock connection object for testing purposes.
 */
function createMockConnection() {
    return {
        console: undefined,
        onCodeAction(handler) {
            return {};
        },
        onCodeActionResolve(handler) {
            return {};
        },
        onDidChangeConfiguration(handler) {
            return {};
        },
        onExecuteCommand(handler) {
            return {};
        },
        onInitialized(handler) {
            return {};
        },
        sendDiagnostics(params) {
            return Promise.resolve(undefined);
        },
        onInitialize(handler) {
            return {};
        },
        workspace: {
            workspaceFolders: [],
            getWorkspaceFolders() {
                return Promise.resolve(this.workspaceFolders);
            },
            getConfiguration(section) {
                return Promise.resolve({});
            },
            onDidChangeWorkspaceFolders: e => {
                return {};
            }
        }
    };
}
exports.createMockConnection = createMockConnection;
//# sourceMappingURL=connectionMocks.js.map