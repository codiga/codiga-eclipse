"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshDiagnostics = exports.resetFixes = exports.registerFixForDocument = exports.contains = exports.getFixesForDocument = void 0;
const fileUtils_1 = require("../utils/fileUtils");
const rosieClient = require("../rosie/rosieClient");
const constants_1 = require("../constants");
const types_1 = require("../graphql-api/types");
const rosieConstants_1 = require("../rosie/rosieConstants");
const rosieCache_1 = require("../rosie/rosieCache");
const vscode_uri_1 = require("vscode-uri");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
//import * as console from '../utils/connectionLogger';
const DIAGNOSTICS_TIMESTAMP = new Map();
const FIXES_BY_DOCUMENT = new Map();
/**
 * This function is a helper for the quick fixes. It retrieves the quickfix for a
 * violation. We register the list of fixes when we analyze. Then, when the user
 * hovers a quick fix, we get the list of quick fixes using this function.
 *
 * @param documentUri - the URI of the VS Code document
 * @param range - the range we are at in the document
 * @returns - the list of fixes for the given range
 */
const getFixesForDocument = (documentUri, range) => {
    const fixesForDocument = FIXES_BY_DOCUMENT.get(documentUri);
    const result = [];
    if (fixesForDocument) {
        for (const rangeAndFixes of fixesForDocument.values()) {
            if ((0, exports.contains)(rangeAndFixes[0], range)) {
                rangeAndFixes[1]?.forEach((f) => result.push(f));
            }
        }
    }
    return result;
};
exports.getFixesForDocument = getFixesForDocument;
/**
 * Validates whether on Range or Position contains another one.
 * This is a replacement for vscode.Range.contains() as vscode-languageserver doesn't have
 * a corresponding logic or method.
 *
 * The implementation is adopted from https://github.com/microsoft/vscode/blob/main/src/vs/workbench/api/common/extHostTypes.ts.
 *
 * Exported for testing purposes.
 *
 * @param container the Range/Position that should contain 'containee'
 * @param containee the Range/Position that should be contained by 'container'
 */
const contains = (container, containee) => {
    if (vscode_languageserver_types_1.Range.is(container) && vscode_languageserver_types_1.Range.is(containee)) {
        return (0, exports.contains)(container, containee.start) && (0, exports.contains)(container, containee.end);
    }
    if (vscode_languageserver_types_1.Range.is(container) && vscode_languageserver_types_1.Position.is(containee)) {
        return !(isBefore(vscode_languageserver_types_1.Position.create(containee.line, containee.character), container.start) || isBefore(container.end, containee));
    }
    return false;
};
exports.contains = contains;
/**
 * Returns whether the 'first' position is located before the 'second' one.
 *
 * @param first a position
 * @param second another position
 */
const isBefore = (first, second) => {
    if (first.line < second.line) {
        return true;
    }
    if (second.line < first.line) {
        return false;
    }
    return first.character < second.character;
};
/**
 * Register a fix for a document and a range. When we analyze the file,
 * we store all the quick fixes in a Map so that we can retrieve them
 * later when the user hover the fixes.
 *
 * It makes sure that no duplicate ranges, and no duplicate fixes are added.
 *
 * Exported for testing purposes.
 *
 * @param documentUri - the URI of the analyzed VS Code document
 * @param range - the range we are at in the document
 * @param fix - the quick fix to register for this document and range
 */
const registerFixForDocument = (documentUri, range, fix) => {
    // If there is no range or fix saved for this document, save the document
    if (!FIXES_BY_DOCUMENT.has(documentUri)) {
        FIXES_BY_DOCUMENT.set(documentUri, new Map());
    }
    // Query the ranges saved for this document, and if the currently inspected range is not saved,
    // associate an empty list of fixes to it. Otherwise, add the fix for this range.
    const rangeAndFixesForDocument = FIXES_BY_DOCUMENT.get(documentUri);
    const rangeString = JSON.stringify(range);
    if (!rangeAndFixesForDocument?.has(rangeString)) {
        rangeAndFixesForDocument?.set(rangeString, [range, []]);
    }
    if (rangeAndFixesForDocument?.get(rangeString)) {
        // @ts-ignore
        const fixesForRange = rangeAndFixesForDocument?.get(rangeString)[1];
        // If the fix hasn't been added to this range, add it.
        if (fixesForRange?.filter(f => JSON.stringify(f) === JSON.stringify(fix)).length === 0) {
            fixesForRange?.push(fix);
        }
    }
};
exports.registerFixForDocument = registerFixForDocument;
/**
 * Reset the quick fixes for a document. When we start another analysis, we reset
 * the list of fixes to only have a short list of quick fixes.
 *
 * @param documentUri - the URI of the VS Code document
 */
const resetFixesForDocument = (documentUri) => {
    FIXES_BY_DOCUMENT.set(documentUri, new Map());
};
/**
 * Clears all documents and fixes. Only for testing purposes.
 */
const resetFixes = () => {
    FIXES_BY_DOCUMENT.clear();
};
exports.resetFixes = resetFixes;
/**
 * This function is here to check when we should (or not)
 * inspect a document. It checks that there was not another
 * request for inspection within TIME_BEFORE_STARTING_ANALYSIS_MILLISECONDS
 * and if not, trigger an analysis.
 *
 * @param doc - the document we are trying to update
 * @returns - if we should run the analysis or not
 */
const shouldProceed = async (doc) => {
    const filename = vscode_uri_1.URI.parse(doc.uri).toString();
    const currentTimestampMs = Date.now();
    /**
     * Set the timestamp in a hashmap so that other thread
     * and analysis request can see it.
     */
    DIAGNOSTICS_TIMESTAMP.set(filename, currentTimestampMs);
    /**
     * Wait for some time. During that time, the user
     * might type another key that trigger other analysis
     * (and will update the hashmap).
     */
    await new Promise((r) => setTimeout(r, constants_1.TIME_BEFORE_STARTING_ANALYSIS_MILLISECONDS));
    /**
     * Get the actual timeout in the hashmap. It might have
     * changed since we sleep and therefore, take tha latest
     * value.
     */
    const actualTimeoutMs = DIAGNOSTICS_TIMESTAMP.get(filename);
    /**
     * check that the actual latest value is the one we called
     * the function with. If yes, let's go!
     */
    return actualTimeoutMs === currentTimestampMs;
};
/**
 * Maps the argument Rosie severity to the LSP specific DiagnosticSeverity,
 * to have squiggles with proper severities displayed in the editor.
 *
 * @param rosieSeverity the severity to map
 */
const mapRosieSeverityToLSPSeverity = (rosieSeverity) => {
    if (rosieSeverity.toLocaleUpperCase() === rosieConstants_1.ROSIE_SEVERITY_CRITICAL) {
        return vscode_languageserver_types_1.DiagnosticSeverity.Error;
    }
    if (rosieSeverity.toLocaleUpperCase() === rosieConstants_1.ROSIE_SEVERITY_ERROR
        || rosieSeverity.toLocaleUpperCase() === rosieConstants_1.ROSIE_SEVERITY_WARNING) {
        return vscode_languageserver_types_1.DiagnosticSeverity.Warning;
    }
    return vscode_languageserver_types_1.DiagnosticSeverity.Information;
};
/**
 * Analyses the argument document and updates/overwrites the diagnostics for that document.
 * This in turn updates the displayed squiggles in the editor.
 *
 * No update happens when
 * <ul>
 *   <li>The language of the document is unknown.</li>
 *   <li>The language of the document is not supported by Rosie.</li>
 *   <li>The user hasn't finished typing for at least 500ms.</li>
 *   <li>The document is empty.</li>
 *   <li>The document has less than 2 lines.</li>
 *   <li>There is no rule cached for the current document's language.</li>
 * </ul>
 *
 * @param doc the currently analysed document
 * @param sendDiagnostics the callback to send the diagnostics to the client
 */
async function refreshDiagnostics(doc, sendDiagnostics) {
    const language = (0, fileUtils_1.getLanguageForDocument)(doc);
    if (language === types_1.Language.Unknown) {
        return;
    }
    const supportedLanguages = Array.from(rosieConstants_1.GRAPHQL_LANGUAGE_TO_ROSIE_LANGUAGE.keys());
    if (supportedLanguages.indexOf(language) === -1) {
        return;
    }
    /**
     * We do not proceed yet, we make sure the user is done typing some text
     */
    const shouldDoAnalysis = await shouldProceed(doc);
    if (!shouldDoAnalysis) {
        return;
    }
    if (doc.getText().length === 0) {
        // console.log("empty code");
        return;
    }
    if (doc.lineCount < 2) {
        // console.log("not enough lines");
        return;
    }
    const rules = (0, rosieCache_1.getRulesFromCache)(doc);
    // Empty the mapping between the analysis and the list of fixes
    resetFixesForDocument(doc.uri);
    if (rules && rules.length > 0) {
        const ruleResponses = await rosieClient.getRuleResponses(doc, rules);
        const diags = [];
        ruleResponses.forEach((ruleResponse) => {
            // console.log(`Response took ${ruleResponse.executionTimeMs} ms`);
            ruleResponse.violations.forEach((violation) => {
                const range = vscode_languageserver_types_1.Range.create(vscode_languageserver_types_1.Position.create(violation.start.line - 1, violation.start.col - 1), vscode_languageserver_types_1.Position.create(violation.end.line - 1, violation.end.col - 1));
                const diag = {
                    range: range,
                    message: violation.message,
                    severity: mapRosieSeverityToLSPSeverity(violation.severity),
                    //For example, the 'source', 'code' and 'codeDescription' are displayed like
                    // this in VS Code: <source>(<code>), e.g. Codiga(rulesetname/ruleset), where
                    // the value in parentheses can be clicked to open the 'codeDescription.href' URL in a browser.
                    source: constants_1.DIAGNOSTIC_SOURCE,
                    code: ruleResponse.identifier,
                    codeDescription: {
                        //The URL to open the rule in the browser
                        href: `https://app.codiga.io/hub/ruleset/${ruleResponse.identifier}`
                    }
                };
                if (violation.fixes) {
                    violation.fixes.forEach((fix) => {
                        (0, exports.registerFixForDocument)(doc.uri, range, fix);
                    });
                }
                diags.push(diag);
            });
        });
        sendDiagnostics(diags);
    }
    else {
        // console.log("no ruleset to use");
        sendDiagnostics([]);
    }
}
exports.refreshDiagnostics = refreshDiagnostics;
//# sourceMappingURL=diagnostics.js.map