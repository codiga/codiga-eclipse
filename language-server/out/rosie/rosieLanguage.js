"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRosieLanguage = void 0;
const types_1 = require("../graphql-api/types");
const LANGUAGE_PYTHON = "python";
const LANGUAGE_JAVASCRIPT = "javascript";
const LANGUAGE_TYPESCRIPT = "typescript";
const getRosieLanguage = (language) => {
    switch (language) {
        case types_1.Language.Python:
            return LANGUAGE_PYTHON;
        case types_1.Language.Javascript:
            return LANGUAGE_JAVASCRIPT;
        case types_1.Language.Typescript:
            return LANGUAGE_TYPESCRIPT;
        default:
            return undefined;
    }
};
exports.getRosieLanguage = getRosieLanguage;
//# sourceMappingURL=rosieLanguage.js.map