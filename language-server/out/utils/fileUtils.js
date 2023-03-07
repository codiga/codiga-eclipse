"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLanguageForFile = exports.getLanguageForDocument = exports.asRelativePath = exports.EXTENSION_TO_LANGUAGE = void 0;
const types_1 = require("../graphql-api/types");
const pathModule = require("path");
const vscode_uri_1 = require("vscode-uri");
const configurationCache_1 = require("./configurationCache");
exports.EXTENSION_TO_LANGUAGE = {
    ".bash": types_1.Language.Shell,
    ".cls": types_1.Language.Apex,
    ".c": types_1.Language.C,
    ".css": types_1.Language.Css,
    ".cs": types_1.Language.Csharp,
    ".cpp": types_1.Language.Cpp,
    ".cfc": types_1.Language.Coldfusion,
    ".cfm": types_1.Language.Coldfusion,
    ".dockerfile": types_1.Language.Docker,
    ".dart": types_1.Language.Dart,
    ".go": types_1.Language.Go,
    ".hs": types_1.Language.Haskell,
    ".html": types_1.Language.Html,
    ".html5": types_1.Language.Html,
    ".htm": types_1.Language.Html,
    ".java": types_1.Language.Java,
    ".json": types_1.Language.Json,
    ".js": types_1.Language.Javascript,
    ".jsx": types_1.Language.Javascript,
    ".kt": types_1.Language.Kotlin,
    ".m": types_1.Language.Objectivec,
    ".mm": types_1.Language.Objectivec,
    ".M": types_1.Language.Objectivec,
    ".md": types_1.Language.Markdown,
    ".php4": types_1.Language.Php,
    ".php5": types_1.Language.Php,
    ".php": types_1.Language.Php,
    ".ipynb": types_1.Language.Python,
    ".py": types_1.Language.Python,
    ".py3": types_1.Language.Python,
    ".pm": types_1.Language.Perl,
    ".pl": types_1.Language.Perl,
    ".rs": types_1.Language.Rust,
    ".rb": types_1.Language.Ruby,
    ".rhtml": types_1.Language.Ruby,
    ".sass": types_1.Language.Sass,
    ".scala": types_1.Language.Scala,
    ".scss": types_1.Language.Scss,
    ".sh": types_1.Language.Shell,
    ".sol": types_1.Language.Solidity,
    ".swift": types_1.Language.Swift,
    ".sql": types_1.Language.Sql,
    ".tf": types_1.Language.Terraform,
    ".ts": types_1.Language.Typescript,
    ".tsx": types_1.Language.Typescript,
    ".twig": types_1.Language.Twig,
    ".yml": types_1.Language.Yaml,
    ".yaml": types_1.Language.Yaml,
};
function asRelativePath(document) {
    const wsFolder = (0, configurationCache_1.getWorkspaceFolders)().filter(folder => document.uri?.startsWith(folder));
    const documentPath = vscode_uri_1.URI.parse(document.uri).path;
    return wsFolder && wsFolder.length === 1
        ? documentPath.replace(vscode_uri_1.URI.parse(wsFolder[0]).path, "")
        : documentPath;
}
exports.asRelativePath = asRelativePath;
function getLanguageForDocument(document) {
    return getLanguageForFile(asRelativePath(document));
}
exports.getLanguageForDocument = getLanguageForDocument;
function getLanguageForFile(filename) {
    const parsedFilename = pathModule.parse(filename);
    const basename = parsedFilename.base;
    const extension = pathModule.extname(filename).toLowerCase();
    if (basename?.toLowerCase().startsWith("docker")) {
        return types_1.Language.Docker;
    }
    if (exports.EXTENSION_TO_LANGUAGE[extension]) {
        return exports.EXTENSION_TO_LANGUAGE[extension];
    }
    return types_1.Language.Unknown;
}
exports.getLanguageForFile = getLanguageForFile;
//# sourceMappingURL=fileUtils.js.map