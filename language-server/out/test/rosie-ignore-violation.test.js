"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
global.isInTestMode = true;
const ignore_violation_1 = require("../diagnostics/ignore-violation");
const assert = require("assert");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const vscode_uri_1 = require("vscode-uri");
const os = require("os");
const testUtils_1 = require("./testUtils");
suite("Rosie ignore violation quick fixes", () => {
    const typescriptFileContent = "class Duck {\r\n" +
        "  private _size: number;\r\n" +
        "  constructor(size: number) {\r\n" +
        "    this._size = size;\r\n" +
        "  }\r\n" +
        "}\r\n" +
        "const x = 6;";
    const pythonFileContent = 'def some_function():\r\n' +
        '    y = "some string"\r\n';
    let workspaceFolder;
    let document;
    //Helpers
    /**
     * Validates that fix edits are applied on the target document for the argument Rosie fix,
     * according to the provided expected content.
     *
     * @param diagnostic the diagnostic for which the fix is applied
     * @param expectedContent the file content that is expected after the edits are applied
     */
    function testFixIsApplied(diagnostic, expectedContent = typescriptFileContent) {
        const codeAction = (0, ignore_violation_1.createIgnoreFix)(diagnostic, document);
        codeAction.edit = (0, ignore_violation_1.createIgnoreWorkspaceEdit)(document, diagnostic.range);
        const changes = codeAction.edit?.changes;
        if (changes) {
            assert.strictEqual(vscode_languageserver_textdocument_1.TextDocument.applyEdits(document, changes?.[document.uri]), expectedContent);
        }
        else {
            assert.fail("No Code Action edit change was available.");
        }
    }
    // Hooks
    setup(async () => {
        /*
          Uses an arbitrary URI based on the OS-specific temp directory.
          The actual folder is not created, we only need the URI referencing a folder.
         */
        workspaceFolder = vscode_uri_1.Utils.joinPath(vscode_uri_1.URI.parse(os.tmpdir()), "workspaceFolder");
        //Creates the TextDocument on which the fixes are applied and tested
        document = (0, testUtils_1.createTextDocument)(workspaceFolder, "typescript.tsx", "typescriptreact", typescriptFileContent);
    });
    // provideIgnoreFixCodeActions
    test("provideIgnoreFixCodeActions: returns no CodeAction for no diagnostic", () => {
        const range = (0, testUtils_1.createRange)(0, 2, 0, 6);
        const codeActions = (0, ignore_violation_1.provideIgnoreFixCodeActions)(document, range, {
            textDocument: { uri: document.uri },
            range: range,
            context: { diagnostics: [] },
        });
        assert.strictEqual(codeActions.length, 0);
    });
    test("provideIgnoreFixCodeActions: returns no CodeAction for no Codiga diagnostic", () => {
        const range = (0, testUtils_1.createRange)(0, 2, 0, 6);
        const codeActions = (0, ignore_violation_1.provideIgnoreFixCodeActions)(document, range, {
            textDocument: { uri: document.uri },
            range: range,
            context: { diagnostics: [{ range: range, message: "diagnostic message", source: "notcodiga" }] },
        });
        assert.strictEqual(codeActions.length, 0);
    });
    test("provideIgnoreFixCodeActions: returns CodeActions for Codiga diagnostics", () => {
        const range = (0, testUtils_1.createRange)(0, 2, 0, 6);
        const codeActions = (0, ignore_violation_1.provideIgnoreFixCodeActions)(document, range, {
            textDocument: { uri: document.uri },
            range: range,
            context: {
                diagnostics: [
                    { range: range, message: "not codiga diagnostic", source: "notcodiga" },
                    { range: range, message: "codiga diagnostic", source: "Codiga" }
                ]
            },
        });
        assert.strictEqual(codeActions.length, 1);
    });
    // createIgnoreFix
    test("createIgnoreFix: Adds codiga-disable comment in the first row", () => {
        testFixIsApplied({
            range: (0, testUtils_1.createRange)(0, 2, 0, 6),
            message: "Diagnostic message"
        }, "// codiga-disable\n" +
            "class Duck {\r\n" +
            "  private _size: number;\r\n" +
            "  constructor(size: number) {\r\n" +
            "    this._size = size;\r\n" +
            "  }\r\n" +
            "}\r\n" +
            "const x = 6;");
    });
    test("createIgnoreFix: Adds codiga-disable comment within the document", () => {
        testFixIsApplied({
            range: (0, testUtils_1.createRange)(3, 2, 3, 10),
            message: "Diagnostic message"
        }, "class Duck {\r\n" +
            "  private _size: number;\r\n" +
            "  constructor(size: number) {\r\n" +
            "    // codiga-disable\n" +
            "    this._size = size;\r\n" +
            "  }\r\n" +
            "}\r\n" +
            "const x = 6;");
    });
    test("createIgnoreFix: Adds codiga-disable comment for violation in the last row", () => {
        testFixIsApplied({
            range: (0, testUtils_1.createRange)(6, 1, 6, 6),
            message: "Diagnostic message"
        }, "class Duck {\r\n" +
            "  private _size: number;\r\n" +
            "  constructor(size: number) {\r\n" +
            "    this._size = size;\r\n" +
            "  }\r\n" +
            "}\r\n" +
            "// codiga-disable\n" +
            "const x = 6;");
    });
    test("createIgnoreFix: Adds codiga-disable comment in python file", () => {
        document = (0, testUtils_1.createTextDocument)(workspaceFolder, "python.py", "python", pythonFileContent);
        testFixIsApplied({
            range: (0, testUtils_1.createRange)(1, 1, 1, 6),
            message: "Diagnostic message"
        }, "def some_function():\r\n" +
            "    # codiga-disable\n" +
            "    y = \"some string\"\r\n");
    });
});
//# sourceMappingURL=rosie-ignore-violation.test.js.map