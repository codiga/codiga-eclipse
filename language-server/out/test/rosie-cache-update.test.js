"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
global.isInTestMode = true;
const assert = require("assert");
const testUtils_1 = require("./testUtils");
const rosieCache_1 = require("../rosie/rosieCache");
const fs = require("fs");
const assert_1 = require("assert");
const vscode_uri_1 = require("vscode-uri");
const path = require("path");
const os = require("os");
suite("Rosie cache update", () => {
    let workspaceFolder;
    let codigaYaml;
    // Helpers
    async function initializeRulesCache(codigaYmlContent, cacheData) {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, codigaYmlContent);
        const cache = new Map();
        cache.set(workspaceFolder.path, cacheData);
        return cache;
    }
    // Hooks
    setup(async () => {
        //Uses an arbitrary URI based on the OS-specific temp directory.
        workspaceFolder = process.platform === 'darwin'
            ? vscode_uri_1.URI.parse(`file://${path.join(os.tmpdir(), "workspaceFolder")}`)
            : vscode_uri_1.URI.parse(`file:///${path.join(os.tmpdir(), "workspaceFolder")}`);
        (0, testUtils_1.initWorkspaceFolder)(workspaceFolder);
    });
    teardown(async () => {
        if (codigaYaml && fs.existsSync(codigaYaml.fsPath)) {
            fs.rmSync(codigaYaml.fsPath);
            fs.rmdirSync(workspaceFolder.fsPath);
        }
    });
    // updateCacheForWorkspace
    test("updateCacheForWorkspace: deletes workspace from cache when there is no ruleset in codiga.yml", async () => {
        const cache = await initializeRulesCache("rulesets:", (0, testUtils_1.createCacheData)(rosieCache_1.CodigaYmlConfig.EMPTY, [
            (0, testUtils_1.createMockRule)("python"),
            (0, testUtils_1.createMockRule)("javascript"),
            (0, testUtils_1.createMockRule)("python")
        ]));
        await (0, rosieCache_1.updateCacheForWorkspace)(cache, workspaceFolder.path, codigaYaml);
        assert.strictEqual(cache.size, 0);
    });
    test("updateCacheForWorkspace: deletes workspace from cache when there is no last updated timestamp returned", async () => {
        const cache = await initializeRulesCache("rulesets:\n  - undefined-ruleset", (0, testUtils_1.createCacheData)(new rosieCache_1.CodigaYmlConfig(["undefined-ruleset"]), [
            (0, testUtils_1.createMockRule)("python"),
            (0, testUtils_1.createMockRule)("javascript"),
            (0, testUtils_1.createMockRule)("python")
        ]));
        await (0, rosieCache_1.updateCacheForWorkspace)(cache, workspaceFolder.path, codigaYaml);
        assert.strictEqual(cache.size, 0);
    });
    test("updateCacheForWorkspace: cache update with no lastRefreshed update, when there is no existing cache data for workspace", async () => {
        const cacheData = (0, testUtils_1.createCacheData)(new rosieCache_1.CodigaYmlConfig(["actual-ruleset"]), [
            (0, testUtils_1.createMockRule)("python"),
            (0, testUtils_1.createMockRule)("javascript"),
            (0, testUtils_1.createMockRule)("python")
        ]);
        const cache = await initializeRulesCache("rulesets:\n  - actual-ruleset", cacheData);
        //Instead of opening a second workspace, we initialize the cache with a fake workspace,
        //so we can achieve that one workspace is not in the cache yet.
        const mockWorkspaceFolder = {
            name: "mock-workspace", uri: vscode_uri_1.URI.parse("file:///C:/mock-workspace").path
        };
        //Update cache
        await (0, rosieCache_1.updateCacheForWorkspace)(cache, mockWorkspaceFolder.uri, codigaYaml);
        //Assertions
        assert.strictEqual(cache.size, 2);
        assert.deepStrictEqual(cache.get(workspaceFolder.path), cacheData);
        const mockWorkspaceData = cache.get(mockWorkspaceFolder.uri);
        assert.notStrictEqual(mockWorkspaceData, undefined);
        // @ts-ignore
        assert.strictEqual(mockWorkspaceData.rules[0].language, "typescript");
        // @ts-ignore
        assert.strictEqual(mockWorkspaceData.rules[1].language, "typescript");
        assert.strictEqual(cacheData.lastRefreshed, 0);
    });
    test("updateCacheForWorkspace: cache update with no lastRefreshed update, when existing cache data's last update is different than on server", async () => {
        const cacheData = {
            codigaYmlConfig: new rosieCache_1.CodigaYmlConfig(["actual-ruleset"]),
            lastRefreshed: 0,
            lastTimestamp: 50,
            fileLastModification: 0,
            rules: [
                (0, testUtils_1.createMockRule)("python"),
                (0, testUtils_1.createMockRule)("javascript"),
                (0, testUtils_1.createMockRule)("python")
            ]
        };
        const cache = await initializeRulesCache("rulesets:\n  - actual-ruleset", cacheData);
        //Update cache
        await (0, rosieCache_1.updateCacheForWorkspace)(cache, workspaceFolder.path, codigaYaml);
        //Assertions
        assert.strictEqual(cache.size, 1);
        const data = cache.get(workspaceFolder.path);
        if (!data) {
            (0, assert_1.fail)("No cache data for current workspace.");
        }
        assert.strictEqual(data.rules.length, 2);
        assert.strictEqual(data.rules[0].language, "typescript");
        assert.strictEqual(data.rules[1].language, "typescript");
        assert.strictEqual(cacheData.lastRefreshed, 0);
    });
    test("updateCacheForWorkspace: cache update with no lastRefreshed update, when existing cache data's last modification has changed", async () => {
        const cacheData = {
            codigaYmlConfig: new rosieCache_1.CodigaYmlConfig(["actual-ruleset"]),
            lastRefreshed: 0,
            lastTimestamp: 100,
            fileLastModification: 0,
            rules: [
                (0, testUtils_1.createMockRule)("python"),
                (0, testUtils_1.createMockRule)("javascript"),
                (0, testUtils_1.createMockRule)("python")
            ]
        };
        const cache = await initializeRulesCache("rulesets:\n  - actual-ruleset", cacheData);
        //Update cache
        await (0, rosieCache_1.updateCacheForWorkspace)(cache, workspaceFolder.path, codigaYaml);
        //Assertions
        assert.strictEqual(cache.size, 1);
        const data = cache.get(workspaceFolder.path);
        if (!data) {
            (0, assert_1.fail)("No cache data for current workspace.");
        }
        assert.strictEqual(data.rules.length, 2);
        assert.strictEqual(data.rules[0].language, "typescript");
        assert.strictEqual(data.rules[1].language, "typescript");
        assert.strictEqual(cacheData.lastRefreshed, 0);
    });
    test("updateCacheForWorkspace: text document revalidation is called after cache update", async () => {
        let areTextDocumentsRevalidated = false;
        (0, rosieCache_1.setAllTextDocumentsValidator)(() => areTextDocumentsRevalidated = true);
        const cacheData = {
            codigaYmlConfig: new rosieCache_1.CodigaYmlConfig(["actual-ruleset"]),
            lastRefreshed: 0,
            lastTimestamp: 100,
            fileLastModification: 0,
            rules: [
                (0, testUtils_1.createMockRule)("python"),
                (0, testUtils_1.createMockRule)("javascript"),
                (0, testUtils_1.createMockRule)("python")
            ]
        };
        const cache = await initializeRulesCache("rulesets:\n  - actual-ruleset", cacheData);
        //Update cache
        await (0, rosieCache_1.updateCacheForWorkspace)(cache, workspaceFolder.path, codigaYaml);
        //Assertions
        assert.strictEqual(cache.size, 1);
        const data = cache.get(workspaceFolder.path);
        assert.strictEqual(data?.rules.length, 2);
        assert.strictEqual(areTextDocumentsRevalidated, true);
    });
    test("updateCacheForWorkspace: updates last refreshed timestamp on existing cache data", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n  - actual-ruleset");
        const cache = new Map();
        const stats = fs.statSync(codigaYaml.fsPath);
        const cacheData = {
            codigaYmlConfig: new rosieCache_1.CodigaYmlConfig(["actual-ruleset"]),
            lastRefreshed: 0,
            lastTimestamp: 100,
            fileLastModification: stats.mtimeMs,
            rules: [
                (0, testUtils_1.createMockRule)("python"),
                (0, testUtils_1.createMockRule)("javascript"),
                (0, testUtils_1.createMockRule)("python")
            ]
        };
        cache.set(workspaceFolder.path, cacheData);
        //Update cache
        await (0, rosieCache_1.updateCacheForWorkspace)(cache, workspaceFolder.path, codigaYaml);
        //Assertions
        assert.strictEqual(cache.size, 1);
        const data = cache.get(workspaceFolder.path);
        if (!data) {
            (0, assert_1.fail)("No cache data for current workspace.");
        }
        assert.strictEqual(data.rules.length, 3);
        assert.notStrictEqual(cacheData.lastRefreshed, 0);
    });
});
//# sourceMappingURL=rosie-cache-update.test.js.map