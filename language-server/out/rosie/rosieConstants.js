"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRAPHQL_LANGUAGE_TO_ROSIE_LANGUAGE = exports.ROSIE_ENDPOINT_STAGING = exports.ROSIE_ENDPOINT_PROD = exports.ROSIE_SEVERITY_WARNING = exports.ROSIE_SEVERITY_INFORMATIONAL = exports.ROSIE_SEVERITY_ERROR = exports.ROSIE_SEVERITY_CRITICAL = void 0;
const types_1 = require("../graphql-api/types");
// Severity constants
exports.ROSIE_SEVERITY_CRITICAL = "CRITICAL";
exports.ROSIE_SEVERITY_ERROR = "ERROR";
exports.ROSIE_SEVERITY_INFORMATIONAL = "INFORMATIONAL";
exports.ROSIE_SEVERITY_WARNING = "WARNING";
// Endpoints
exports.ROSIE_ENDPOINT_PROD = "https://analysis.codiga.io/analyze";
exports.ROSIE_ENDPOINT_STAGING = "https://analysis-staging.codiga.io/analyze";
exports.GRAPHQL_LANGUAGE_TO_ROSIE_LANGUAGE = new Map([
    [types_1.Language.Python, "python"],
    [types_1.Language.Javascript, "javascript"],
    [types_1.Language.Typescript, "typescript"],
    [types_1.Language.C, "c"],
    [types_1.Language.Csharp, "c#"],
    [types_1.Language.Java, "java"],
]);
//# sourceMappingURL=rosieConstants.js.map