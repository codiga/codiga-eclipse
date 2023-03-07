"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRuleFix = exports.provideApplyFixCodeActions = exports.createAndSetRuleFixCodeActionEdit = void 0;
const diagnostics_1 = require("../diagnostics/diagnostics");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
/**
 * Returns whether either the start line or col of the argument Rosie fix edit is negative.
 */
const hasInvalidStartOffset = (fixEdit) => {
    return fixEdit.start.line - 1 < 0 || fixEdit.start.col - 1 < 0;
};
/**
 * Returns whether either the end line or col of the argument Rosie fix edit is negative.
 */
const hasInvalidEndOffset = (fixEdit) => {
    return fixEdit.end.line - 1 < 0 || fixEdit.end.col - 1 < 0;
};
/**
 * Creates the provided CodeAction's underlying WorkspaceEdit, and sets it based on the given RosieFixEdits.
 *
 * @param codeAction the code action to compute the 'edit' property of
 * @param document the document in which the code action is being invoked
 * @param rosieFixEdits the code edits from the RosieFix
 */
const createAndSetRuleFixCodeActionEdit = (codeAction, document, rosieFixEdits) => {
    const textEdits = rosieFixEdits
        .map(fixEdit => mapFixEditToTextEdit(fixEdit, document))
        .filter(textEdit => textEdit !== undefined);
    //Stores the list of code edits that this quick fix will apply
    codeAction.edit = {
        changes: {
            [document.uri]: textEdits
        }
    };
};
exports.createAndSetRuleFixCodeActionEdit = createAndSetRuleFixCodeActionEdit;
/**
 * Maps the Rosie specific RosieFixEdit to an LSP specific TextEdit,
 * so that it can later be applied in a document.
 *
 * It returns undefined in the following cases:
 * <ul>
 *   <li>when the edit's start line or col is negative</li>
 *   <li>when the edit's end line or col is negative</li>
 *   <li>when the edit's start offset is greater than its end offset</li>
 *   <li>when the edit has an unknown type</li>
 * </ul>
 */
const mapFixEditToTextEdit = (fixEdit, document) => {
    if (fixEdit.editType === 'add') {
        if (hasInvalidStartOffset(fixEdit))
            return undefined;
        const insertPosition = vscode_languageserver_types_1.Position.create(fixEdit.start.line - 1, fixEdit.start.col - 1);
        return vscode_languageserver_types_1.TextEdit.insert(insertPosition, fixEdit.content || '');
    }
    if (fixEdit.editType === 'update') {
        return validateOffsetsAndCreateTextEdit(fixEdit, document, (startPosition, endPosition) => {
            return vscode_languageserver_types_1.TextEdit.replace(vscode_languageserver_types_1.Range.create(startPosition, endPosition), fixEdit.content || '');
        });
    }
    if (fixEdit.editType === 'remove') {
        return validateOffsetsAndCreateTextEdit(fixEdit, document, (startPosition, endPosition) => {
            return vscode_languageserver_types_1.TextEdit.del(vscode_languageserver_types_1.Range.create(startPosition, endPosition));
        });
    }
    return undefined;
};
/**
 * Validates the fix edit for negative line and col values, as well as whether the
 * start offset is less than the end offset. If all is well, creates the appropriate
 * TextEdit based on the given callback.
 */
const validateOffsetsAndCreateTextEdit = (fixEdit, document, createTextEdit) => {
    if (hasInvalidStartOffset(fixEdit) || hasInvalidEndOffset(fixEdit))
        return undefined;
    const startPosition = vscode_languageserver_types_1.Position.create(fixEdit.start.line - 1, fixEdit.start.col - 1);
    const endPosition = vscode_languageserver_types_1.Position.create(fixEdit.end.line - 1, fixEdit.end.col - 1);
    if (document.offsetAt(startPosition) <= document.offsetAt(endPosition)) {
        return createTextEdit(startPosition, endPosition);
    }
    return undefined;
};
/**
 * Constructs and collects the applicable rule fix CodeActions in the current document
 * for the requested range.
 *
 * @param document the current document
 * @param range the range for which the CodeActions have to be collected
 */
const provideApplyFixCodeActions = (document, range, shouldComputeEdit = false) => {
    const fixes = (0, diagnostics_1.getFixesForDocument)(document.uri, range);
    return fixes
        ? fixes?.map(rosieFix => (0, exports.createRuleFix)(document, rosieFix, shouldComputeEdit))
        : [];
};
exports.provideApplyFixCodeActions = provideApplyFixCodeActions;
/**
 * Creates a rule fix CodeAction from the argument RosieFix.
 *
 * Exported for testing purposes.
 *
 * @param document the document in which the CodeAction is being registered
 * @param rosieFix the Rosie specific fix to convert
 */
const createRuleFix = (document, rosieFix, shouldComputeEdit = false) => {
    /*
      From CodeAction's documentation:
        If a code action provides an edit and a command, first the edit is executed and then the command.
    */
    const ruleFix = {
        title: `Fix: ${rosieFix.description}`,
        kind: vscode_languageserver_types_1.CodeActionKind.QuickFix,
        //Registers the 'codiga.applyFix' command for this CodeAction, so that we can execute further
        // logic when the quick fix gets invoked, e.g. to record the rule fix mutation.
        command: {
            command: 'codiga.applyFix',
            title: 'Apply Fix'
        },
        isPreferred: true,
        //Data the is reserved between 'onCodeAction()' and 'onCodeActionResolve()'.
        data: {
            fixKind: "rosie.rule.fix",
            //Don't need to send the whole document, the URI is enough.
            //Also, sending the entire document object is problematic because some properties of that object
            // are lost, for some reason, between 'onCodeAction()' and 'onCodeActionResolve()'.
            documentUri: document.uri,
            rosieFixEdits: rosieFix.edits
        }
    };
    if (shouldComputeEdit) {
        const rosieFixEdits = ruleFix.data.rosieFixEdits;
        (0, exports.createAndSetRuleFixCodeActionEdit)(ruleFix, document, rosieFixEdits);
    }
    return ruleFix;
};
exports.createRuleFix = createRuleFix;
//# sourceMappingURL=rosiefix.js.map