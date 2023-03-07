"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommentSign = void 0;
/**
 * Get the comment sign for a language
 * @param line
 * @param language
 * @returns
 */
const getCommentSign = (language) => {
    switch (language.toLocaleLowerCase()) {
        case "javascript":
        case "typescript":
        case "c":
        case "apex":
        case "cpp":
        case "scala":
        case "dart":
        case "go":
        case "objective-c":
        case "kotlin":
        case "java":
        case "swift":
        case "solidity":
        case "rust":
        case "sass":
        case "scss":
            return "//";
        case "python":
        case "shell":
        case "perl":
        case "yaml":
            return "#";
        case "coldfusion":
            return "<!---";
        case "haskell":
            return "--";
        case "twig":
            return "{#";
        default:
            return "//";
    }
};
exports.getCommentSign = getCommentSign;
//# sourceMappingURL=languageUtils.js.map