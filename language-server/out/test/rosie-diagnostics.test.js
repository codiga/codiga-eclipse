"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
global.isInTestMode = true;
const assert = require("assert");
const os = require("os");
const testUtils_1 = require("./testUtils");
const rosieCache_1 = require("../rosie/rosieCache");
const vscode_uri_1 = require("vscode-uri");
const diagnostics_1 = require("../diagnostics/diagnostics");
const vscode_languageserver_1 = require("vscode-languageserver");
suite("Rosie diagnostics", () => {
    const jsRule1 = (0, testUtils_1.createMockRule)("javascript", "ZnVuY3Rpb24gdmlzaXQocGF0dGVybiwgZmlsZW5hbWUsIGNvZGUpIHsKfQ==");
    const jsRule2 = (0, testUtils_1.createMockRule)("javascript", "ZnVuY3Rpb24gdmlzaXQocGF0dGVybiwgZmlsZW5hbWUsIGNvZGUpIHsKICAgIGFkZEVycm9yKGJ1aWxkRXJyb3IobW9kZS5zdGFydC5saW5lLCBtb2RlLnN0YXJ0LmNvbCwgbW9kZS5lbmQubGluZSwgbW9kZS5lbmQuY29sLCAiZXJyb3IgbWVzc2FnZSIsICJDUklUSUNBTCIsICJzZWN1cml0eSIpKTsKICB9Cn0=");
    const pythonRule1 = (0, testUtils_1.createMockRule)("python", "ZnVuY3Rpb24gdmlzaXQocGF0dGVybiwgZmlsZW5hbWUsIGNvZGUpIHsKfQ==");
    const cacheData = {
        codigaYmlConfig: rosieCache_1.CodigaYmlConfig.EMPTY,
        lastRefreshed: 0,
        lastTimestamp: 1,
        fileLastModification: 0,
        rules: [jsRule1, jsRule2, pythonRule1]
    };
    let workspaceFolder;
    //Hooks
    setup(async () => {
        /*
          Uses an arbitrary URI based on the OS-specific temp directory.
          The actual folder is not created, we only need the URI referencing a folder.
         */
        workspaceFolder = vscode_uri_1.Utils.joinPath(vscode_uri_1.URI.parse(os.tmpdir()), "workspaceFolder");
        (0, testUtils_1.initWorkspaceFolder)(workspaceFolder);
        //Populate the rules cache
        await (0, rosieCache_1.refreshCacheForWorkspace)(workspaceFolder.path, cacheData);
    });
    // getFixesForDocument
    test("getFixesForDocument: returns no RosieFix when there is no fix registered at all", async () => {
        const documentUri = (0, testUtils_1.createTextDocument)(workspaceFolder, "python.py", "python").uri;
        const range = (0, testUtils_1.createRange)(1, 2, 1, 6);
        const fixesForDocument = (0, diagnostics_1.getFixesForDocument)(documentUri, range);
        assert.strictEqual(fixesForDocument.length, 0);
    });
    test("getFixesForDocument: returns no RosieFix when there is no fix registered for the document", async () => {
        const registeredDocumentUri = (0, testUtils_1.createTextDocument)(workspaceFolder, "python.py", "python").uri;
        const registeredRange = (0, testUtils_1.createRange)(1, 2, 1, 6);
        const documentUri = (0, testUtils_1.createTextDocument)(workspaceFolder, "python2.py", "python").uri;
        const range = (0, testUtils_1.createRange)(1, 3, 1, 5);
        (0, diagnostics_1.resetFixes)();
        (0, diagnostics_1.registerFixForDocument)(registeredDocumentUri, registeredRange, { description: "description", edits: [] });
        const fixesForDocument = (0, diagnostics_1.getFixesForDocument)(documentUri, range);
        assert.strictEqual(fixesForDocument.length, 0);
    });
    test("getFixesForDocument: returns no RosieFix when the registered RosieFix range doesn't contain the requested range", async () => {
        const documentUri = (0, testUtils_1.createTextDocument)(workspaceFolder, "python.py", "python").uri;
        const range = (0, testUtils_1.createRange)(1, 2, 1, 6);
        const documentUri2 = (0, testUtils_1.createTextDocument)(workspaceFolder, "python2.py", "python").uri;
        const range2 = (0, testUtils_1.createRange)(1, 3, 1, 5);
        (0, diagnostics_1.resetFixes)();
        (0, diagnostics_1.registerFixForDocument)(documentUri, range, { description: "description", edits: [] });
        (0, diagnostics_1.registerFixForDocument)(documentUri2, range2, { description: "other description", edits: [] });
        const requestedRange = (0, testUtils_1.createRange)(5, 2, 5, 10);
        const fixesForDocument = (0, diagnostics_1.getFixesForDocument)(documentUri2, requestedRange);
        assert.strictEqual(fixesForDocument.length, 0);
    });
    test("getFixesForDocument: returns RosieFixes for the requested document and range", async () => {
        const documentUri = (0, testUtils_1.createTextDocument)(workspaceFolder, "python.py", "python").uri;
        const documentUri2 = (0, testUtils_1.createTextDocument)(workspaceFolder, "python2.py", "python").uri;
        const containedRange = (0, testUtils_1.createRange)(1, 1, 1, 6);
        const containedRange2 = (0, testUtils_1.createRange)(1, 2, 1, 5);
        const notContainedRange = (0, testUtils_1.createRange)(4, 3, 4, 5);
        (0, diagnostics_1.resetFixes)();
        (0, diagnostics_1.registerFixForDocument)(documentUri, containedRange, { description: "with contained range", edits: [] });
        (0, diagnostics_1.registerFixForDocument)(documentUri2, notContainedRange, { description: "with not contained range", edits: [] });
        (0, diagnostics_1.registerFixForDocument)(documentUri2, containedRange2, { description: "with contained range 2", edits: [] });
        const requestedRange = (0, testUtils_1.createRange)(1, 3, 1, 4);
        const fixesForDocument = (0, diagnostics_1.getFixesForDocument)(documentUri2, requestedRange);
        assert.strictEqual(fixesForDocument.length, 1);
        assert.strictEqual(fixesForDocument[0].description, "with contained range 2");
    });
    // contains
    //container:  |--------|
    //containee:               |--------|
    test("contains: returns false when container range is before containee range", async () => {
        const containsRange = (0, diagnostics_1.contains)((0, testUtils_1.createRange)(1, 3, 1, 4), (0, testUtils_1.createRange)(2, 5, 2, 10));
        assert.strictEqual(containsRange, false);
    });
    //container:              |--------|
    //containee:  |--------|
    test("contains: returns false when container range is after containee range", async () => {
        const containsRange = (0, diagnostics_1.contains)((0, testUtils_1.createRange)(2, 5, 2, 10), (0, testUtils_1.createRange)(1, 3, 1, 4));
        assert.strictEqual(containsRange, false);
    });
    //container:  |--------|
    //containee:           |--------|
    test("contains: returns false when container range is before containee range on edge", async () => {
        const containsRange = (0, diagnostics_1.contains)((0, testUtils_1.createRange)(1, 3, 1, 4), (0, testUtils_1.createRange)(1, 4, 1, 10));
        assert.strictEqual(containsRange, false);
    });
    //container:           |--------|
    //containee:  |--------|
    test("contains: returns false when container range is after containee range on edge", async () => {
        const containsRange = (0, diagnostics_1.contains)((0, testUtils_1.createRange)(2, 10, 2, 15), (0, testUtils_1.createRange)(2, 5, 2, 10));
        assert.strictEqual(containsRange, false);
    });
    //container:       |--------|
    //containee:  |--------|
    test("contains: returns false when container range partially contains containee range", async () => {
        const containsRange = (0, diagnostics_1.contains)((0, testUtils_1.createRange)(2, 10, 2, 15), (0, testUtils_1.createRange)(2, 7, 2, 12));
        assert.strictEqual(containsRange, false);
    });
    //container:  |--------|
    //containee:  |----|
    test("contains: returns true when container range contains containee range on starting edge", async () => {
        const containsRange = (0, diagnostics_1.contains)((0, testUtils_1.createRange)(2, 10, 2, 15), (0, testUtils_1.createRange)(2, 10, 2, 12));
        assert.strictEqual(containsRange, true);
    });
    //container:  |--------|
    //containee:      |----|
    test("contains: returns true when container range contains containee range on ending edge", async () => {
        const containsRange = (0, diagnostics_1.contains)((0, testUtils_1.createRange)(2, 10, 2, 15), (0, testUtils_1.createRange)(2, 12, 2, 15));
        assert.strictEqual(containsRange, true);
    });
    //container:  |--------|
    //containee:    |----|
    test("contains: returns true when container range completely contains containee range", async () => {
        const containsRange = (0, diagnostics_1.contains)((0, testUtils_1.createRange)(2, 10, 2, 15), (0, testUtils_1.createRange)(2, 11, 2, 14));
        assert.strictEqual(containsRange, true);
    });
    // refreshDiagnostics: no diagnostics cases
    async function testNoDiagnostics(fileName, content = "") {
        const diagnostics = [];
        await (0, diagnostics_1.refreshDiagnostics)((0, testUtils_1.createTextDocument)(workspaceFolder, fileName, "plaintext", content), diags => {
            diagnostics.push(...diags);
            return Promise.resolve();
        });
        assert.strictEqual(diagnostics.length, 0);
    }
    test("refreshDiagnostics: No diagnostic for unknown document language", async () => {
        await testNoDiagnostics("unknown");
    });
    test("refreshDiagnostics: No diagnostic for not supported document language", async () => {
        await testNoDiagnostics("unsupported.txt");
    });
    test("refreshDiagnostics: No diagnostic for empty document", async () => {
        await testNoDiagnostics("emptyFile.py");
    });
    test("refreshDiagnostics: No diagnostic for one-line document", async () => {
        await testNoDiagnostics("oneLineFile.js", "a single-line document");
    });
    // refreshDiagnostics: diagnostics cases
    test("refreshDiagnostics: Diagnostics are displayed with proper severities", async () => {
        const typescriptDocument = (0, testUtils_1.createTextDocument)(workspaceFolder, "typescript.tsx", "typescriptreact", `class Duck {
  private _size: number;
  constructor(size: number) {
    this._size = size;
  }
}
`);
        const diagnostics = [];
        await (0, diagnostics_1.refreshDiagnostics)(typescriptDocument, diags => {
            diagnostics.push(...diags);
            return Promise.resolve();
        });
        assert.strictEqual(diagnostics.length, 4);
        //Check if the diagnostics are display with their proper severities and messages
        assert.strictEqual(diagnostics[0].severity, vscode_languageserver_1.DiagnosticSeverity.Error);
        assert.strictEqual(diagnostics[0].message, "critical_violation");
        // @ts-ignore
        assert.strictEqual(diagnostics[0].codeDescription.href, "https://app.codiga.io/hub/ruleset/some_id");
        assert.strictEqual(diagnostics[1].severity, vscode_languageserver_1.DiagnosticSeverity.Warning);
        assert.strictEqual(diagnostics[1].message, "error_violation");
        assert.strictEqual(diagnostics[2].severity, vscode_languageserver_1.DiagnosticSeverity.Warning);
        assert.strictEqual(diagnostics[2].message, "warning_violation");
        assert.strictEqual(diagnostics[3].severity, vscode_languageserver_1.DiagnosticSeverity.Information);
        assert.strictEqual(diagnostics[3].message, "info_violation");
    });
});
//# sourceMappingURL=rosie-diagnostics.test.js.map