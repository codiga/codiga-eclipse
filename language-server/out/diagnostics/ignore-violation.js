"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createIgnoreWorkspaceEdit = exports.createIgnoreFix = exports.provideIgnoreFixCodeActions = void 0;
const constants_1 = require("../constants");
const fileUtils_1 = require("../utils/fileUtils");
const indentationUtils_1 = require("../utils/indentationUtils");
const languageUtils_1 = require("../utils/languageUtils");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
/**
 * Constructs and collects the applicable ignore fix CodeActions in the current document
 * for the requested range.
 *
 * @param document the current document
 * @param range the range for which the CodeActions have to be collected
 * @param context the code action parameters for additional context information
 */
const provideIgnoreFixCodeActions = (document, range, context, shouldComputeEdit = false) => {
    const diagnostics = context.context.diagnostics
        .filter(diagnostic => diagnostic.source?.toLocaleString().indexOf(constants_1.DIAGNOSTIC_SOURCE) != -1);
    const ignoreFixes = [];
    for (const diagnostic of diagnostics) {
        ignoreFixes.push((0, exports.createIgnoreFix)(diagnostic, document, shouldComputeEdit));
    }
    return ignoreFixes;
};
exports.provideIgnoreFixCodeActions = provideIgnoreFixCodeActions;
/**
 * Creates an ignore fix CodeAction.
 *
 * @param diagnostic the Diagnostic object for which the ignore fix is created
 * @param document the document in which the CodeAction is being registered
 */
const createIgnoreFix = (diagnostic, document, shouldComputeEdit = false) => {
    const ruleIdentifier = diagnostic.code;
    const title = ruleIdentifier
        ? `Ignore rule ${ruleIdentifier}`
        : "Ignore rule";
    const ignoreFix = {
        title: title,
        kind: vscode_languageserver_types_1.CodeActionKind.QuickFix,
        /**
         * Using a WorkspaceEdit instead of a command because passing command parameters from here to 'connection.onExecuteCommand()'
         * causes a bit of a problem.
         *
         * There is a not exported subclass of TextDocument called FullTextDocument in vscode-languageserver-node,
         * and when passing command arguments to a CodeAction and handling them in 'connection.onExecuteCommand()',
         * the 'uri', 'getText()' and other properties of both the subclass and the base TextDocument are lost,
         * and only some non-function properties, like '_uri', of FullTextDocument remain usable.
         *
         * This caused an issue fetching the document.uri in e.g. fileUtils.ts#asRelativePath(),
         * and document.getText() in indentationUtils.ts#getCurrentIndentationForDocument(),
         * because neither properties were found/existed.
         *
         * FullTextDocument: https://github.com/microsoft/vscode-languageserver-node/blob/main/types/src/main.ts#L4304
         */
        diagnostics: [diagnostic],
        isPreferred: false,
        //Data the is reserved between 'onCodeAction()' and 'onCodeActionResolve()'.
        data: {
            fixKind: "rosie.ignore.violation.fix",
            //Don't need to send the whole document, the URI is enough.
            documentUri: document.uri
        }
    };
    if (shouldComputeEdit) {
        // @ts-ignore
        ignoreFix.edit = (0, exports.createIgnoreWorkspaceEdit)(document, ignoreFix.diagnostics[0]?.range);
    }
    return ignoreFix;
};
exports.createIgnoreFix = createIgnoreFix;
/**
 * Creates the edit for adding the codiga-disable comment.
 *
 * @param document the document in which the comment is to be added
 * @param range the range of the diagnostic based on which the comment is added (e.g. indentation-wise)
 */
const createIgnoreWorkspaceEdit = (document, range) => {
    const insertPosition = vscode_languageserver_types_1.Position.create(range.start.line, 0);
    const language = (0, fileUtils_1.getLanguageForDocument)(document);
    const commentSymbol = (0, languageUtils_1.getCommentSign)(language);
    const indentation = (0, indentationUtils_1.getCurrentIndentationForDocument)(document, vscode_languageserver_types_1.Position.create(range.start.line, range.start.character));
    const spaces = indentation || 0;
    return {
        changes: {
            [document.uri]: [vscode_languageserver_types_1.TextEdit.insert(insertPosition, `${" ".repeat(spaces)}${commentSymbol} codiga-disable\n`)]
        }
    };
};
exports.createIgnoreWorkspaceEdit = createIgnoreWorkspaceEdit;
//# sourceMappingURL=ignore-violation.js.map