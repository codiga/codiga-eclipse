"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRange = exports.createCacheData = exports.createMockPythonRule = exports.createMockRule = exports.createTextDocument = exports.initWorkspaceFolder = exports.createCodigaYml = exports.wait = void 0;
const vscode_uri_1 = require("vscode-uri");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const server_1 = require("../server");
const fs = require("fs");
const vscode_languageserver_1 = require("vscode-languageserver");
const configurationCache_1 = require("../utils/configurationCache");
const wait = async (ms) => new Promise((resolve) => setTimeout(() => resolve(), ms));
exports.wait = wait;
/**
 * Creates a codiga.yml file in the current workspace folder with the given content.
 *
 * @param workspaceFolder the workspace folder in which the codiga.yml is created
 * @param content the file content
 */
function createCodigaYml(workspaceFolder, content) {
    const codigaYaml = vscode_uri_1.Utils.joinPath(workspaceFolder, "codiga.yml");
    const codigaFileContent = Buffer.from(content, "utf-8");
    fs.mkdirSync(workspaceFolder.fsPath);
    fs.writeFileSync(codigaYaml.fsPath, codigaFileContent);
    return codigaYaml;
}
exports.createCodigaYml = createCodigaYml;
/**
 * Sets the current workspace folder in the language server mock connection.
 */
function initWorkspaceFolder(workspaceFolder) {
    server_1.connection.workspace.workspaceFolders = [{
            name: vscode_uri_1.Utils.dirname(workspaceFolder).path,
            uri: workspaceFolder.path
        }];
    const folders = (server_1.connection.workspace.workspaceFolders)?.map(folder => folder.uri) ?? [];
    (0, configurationCache_1.cacheWorkspaceFolders)(folders);
}
exports.initWorkspaceFolder = initWorkspaceFolder;
/**
 * Creates a TextDocument with the argument name, language id and content.
 *
 * Language ids can be found at https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
 *
 * @param workspaceFolder the workspace folder in which the document is created
 * @param fileName the file name
 * @param languageId the language id of the file
 * @param content the content of the file
 */
function createTextDocument(workspaceFolder, fileName, languageId = "plaintext", content = "") {
    return vscode_languageserver_textdocument_1.TextDocument.create(vscode_uri_1.Utils.joinPath(workspaceFolder, fileName).path, languageId, 1, content);
}
exports.createTextDocument = createTextDocument;
/**
 * Creates a mock AST Rule for the given language with the given content.
 */
function createMockRule(language, content = "", rulesetName = "mock-ruleset", ruleName = "mock-rule") {
    return {
        rulesetName: rulesetName,
        ruleName: ruleName,
        contentBase64: content,
        entityChecked: null,
        id: `${rulesetName}/${ruleName}`,
        language: language,
        pattern: null,
        type: "ast"
    };
}
exports.createMockRule = createMockRule;
/**
 * Convenience method for calling 'createMockRule("", "python", "<ruleset name>", "<rule name>")'
 */
function createMockPythonRule(rulesetName = "mock-ruleset", ruleName = "mock-rule") {
    return createMockRule("python", "", rulesetName, ruleName);
}
exports.createMockPythonRule = createMockPythonRule;
/**
 * Creates a mock cache data.
 *
 * @param codigaYmlConfig the codiga config the cache data holds
 * @param rules the list of rules to store in the cache data
 */
function createCacheData(codigaYmlConfig, rules = []) {
    return {
        codigaYmlConfig: codigaYmlConfig,
        rules: rules,
        lastRefreshed: 0,
        lastTimestamp: 1,
        fileLastModification: 0
    };
}
exports.createCacheData = createCacheData;
/**
 * Creates a range for the argument start and end line and columns indeces.
 */
function createRange(startLine, startCol, endLine, endCol) {
    return vscode_languageserver_1.Range.create(vscode_languageserver_1.Position.create(startLine, startCol), vscode_languageserver_1.Position.create(endLine, endCol));
}
exports.createRange = createRange;
//# sourceMappingURL=testUtils.js.map