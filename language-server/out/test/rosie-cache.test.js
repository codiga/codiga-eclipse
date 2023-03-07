"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
global.isInTestMode = true;
const assert = require("assert");
const testUtils_1 = require("./testUtils");
const rosieCache_1 = require("../rosie/rosieCache");
const fs = require("fs");
const types_1 = require("../graphql-api/types");
const vscode_uri_1 = require("vscode-uri");
const path = require("path");
const os = require("os");
suite("Rosie cache", () => {
    let workspaceFolder;
    let codigaYaml;
    // Helpers
    /**
     * Creates a CodigaYmlConfig from the provide configuration content and initializes the rules cache
     * based on that config.
     *
     * @param codigaYmlContent the content of the codiga.yml file
     */
    async function initializeRulesCache(codigaYmlContent) {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, codigaYmlContent);
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        await (0, rosieCache_1.refreshCacheForWorkspace)(workspaceFolder.path, (0, testUtils_1.createCacheData)(codigaConfig));
    }
    /**
     * Creates a path URI via vscode-uri for the argument path segments in the current OS specific temp folder.
     *
     * E.g. calling createInWorkspacePath("sub", "dir", "file.py") on Windows will result in
     * /C:\Users\<local user name>\AppData\Local\Temp\workspaceFolder\sub\dir\file.py
     *
     * @param paths the path segments
     */
    function createInWorkspacePath(...paths) {
        return process.platform === 'darwin'
            ? vscode_uri_1.URI.parse(`file://${path.join(os.tmpdir(), "workspaceFolder", ...paths)}`).path
            : vscode_uri_1.URI.parse(`file:///${path.join(os.tmpdir(), "workspaceFolder", ...paths)}`).path;
    }
    /**
     * Validates the number of rules and their ids against the argument Rule array.
     */
    function validateRuleCountAndRuleIds(rules, count, expectedRuleIds) {
        assert.strictEqual(rules.length, count);
        for (let i = 0; i < rules.length; i++) {
            assert.strictEqual(rules[i].id, expectedRuleIds[i]);
        }
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
    // garbageCollection
    test("garbageCollection: deletes outdated workspace from cache", async () => {
        const cache = new Map();
        cache.set(workspaceFolder.path, {
            codigaYmlConfig: rosieCache_1.CodigaYmlConfig.EMPTY,
            fileLastModification: 0,
            lastRefreshed: Date.now() - 60 * 11 * 1000,
            lastTimestamp: 0,
            rules: []
        });
        (0, rosieCache_1.garbageCollection)(cache);
        assert.strictEqual(cache.has(workspaceFolder.path), false);
    });
    test("garbageCollection: doesn't delete non-outdated workspace from cache", async () => {
        const cache = new Map();
        cache.set(workspaceFolder.path, {
            codigaYmlConfig: rosieCache_1.CodigaYmlConfig.EMPTY,
            fileLastModification: 0,
            lastRefreshed: Date.now(),
            lastTimestamp: 0,
            rules: []
        });
        (0, rosieCache_1.garbageCollection)(cache);
        assert.strictEqual(cache.has(workspaceFolder.path), true);
    });
    // parseCodigaConfig
    test("parseCodigaConfig: returns empty array when no codiga.yml exists", async () => {
        codigaYaml = vscode_uri_1.URI.parse(`file:///C:/codiga.yml`);
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.strictEqual(codigaConfig.rulesetNames.length, 0);
    });
    test("parseCodigaConfig: returns empty array when codiga.yml is empty", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.strictEqual(codigaConfig.rulesetNames.length, 0);
    });
    test("parseCodigaConfig: returns empty array when there is no rulesets property in the file", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rules:");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.strictEqual(codigaConfig.rulesetNames.length, 0);
    });
    test("parseCodigaConfig: returns ruleset names", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n  - a-ruleset\n  - another-ruleset");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.strictEqual(codigaConfig.rulesetNames.length, 2);
        assert.strictEqual(codigaConfig.rulesetNames[0], "a-ruleset");
        assert.strictEqual(codigaConfig.rulesetNames[1], "another-ruleset");
    });
    test("parseCodigaConfig: returns top-level properties as ruleset names", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n  - a-ruleset\n  - not-ruleset\n    - nested-property");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.strictEqual(codigaConfig.rulesetNames.length, 1);
        assert.strictEqual(codigaConfig.rulesetNames[0], "a-ruleset");
    });
    test("parseCodigaConfig: returns empty ignore config for non property ignore", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.strictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
    });
    test("parseCodigaConfig: returns ignore config for no ignore item", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 0);
    });
    test("parseCodigaConfig: returnsIgnoreConfigForBlankIgnoreItem", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - ");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 0);
    });
    test("parseCodigaConfig: returns empty ignore config for string ignore item", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.rulesetNames.length, 2);
        assert.strictEqual(codigaConfig.ignore.size, 0);
    });
    test("parseCodigaConfig: return ignore config for empty ruleset name ignore property", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 0);
    });
    test("parseCodigaConfig: returns ignore config for string rule name ignore property", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 0);
    });
    test("parseCodigaConfig: returns ignore config for empty rule name ignore property", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 0);
    });
    test("parseCodigaConfig: returns ignore config for string prefix ignore property", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 0);
    });
    test("parseCodigaConfig: returns ignore config for empty prefix ignore property", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix:");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 0);
    });
    test("parseCodigaConfig: returns ignore config for blank prefix", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix:     ");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 0);
    });
    test("parseCodigaConfig: returns ignore config for single prefix", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix: /path/to/file/to/ignore");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[0], "/path/to/file/to/ignore");
    });
    test("parseCodigaConfig: returns ignore config for single prefix as list", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix:\n" +
            "        - /path/to/file/to/ignore");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[0], "/path/to/file/to/ignore");
    });
    test("parseCodigaConfig: returns ignore config for multiple prefixes as list", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix:\n" +
            "        - /path1\n" +
            "        - /path2");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 2);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[0], "/path1");
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[1], "/path2");
    });
    test("parseCodigaConfig: returns ignore config for multiple rule ignores", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix:\n" +
            "        - /path1\n" +
            "        - /path2\n" +
            "    - rule2");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 2);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 2);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[0], "/path1");
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[1], "/path2");
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule2")?.prefixes.length, 0);
    });
    test("parseCodigaConfig: returns ignore config without rulesets", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix:\n" +
            "        - /path1\n" +
            "        - /path2");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 2);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[0], "/path1");
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[1], "/path2");
    });
    test("parseCodigaConfig: returns ignore config for duplicate prefix properties", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix:\n" +
            "        - /path1\n" +
            "        - /path2\n" +
            "      - prefix: /path3");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 3);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[0], "/path1");
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[1], "/path2");
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[2], "/path3");
    });
    test("parseCodigaConfig: returns ignore config for duplicate prefix values", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix:\n" +
            "        - /path1\n" +
            "        - /path1");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[0], "/path1");
    });
    test("parseCodigaConfig: returns ignore config for multiple ruleset ignores", async () => {
        codigaYaml = await (0, testUtils_1.createCodigaYml)(workspaceFolder, "rulesets:\n" +
            "  - my-python-ruleset\n" +
            "  - my-other-ruleset\n" +
            "ignore:\n" +
            "  - my-python-ruleset:\n" +
            "    - rule1:\n" +
            "      - prefix:\n" +
            "        - /path1\n" +
            "        - /path2\n" +
            "    - rule2\n" +
            "  - my-other-ruleset:\n" +
            "    - rule3:\n" +
            "      - prefix: /another/path");
        const codigaConfig = await (0, rosieCache_1.parseCodigaConfig)(codigaYaml);
        assert.notStrictEqual(codigaConfig, rosieCache_1.CodigaYmlConfig.EMPTY);
        assert.strictEqual(codigaConfig.ignore.size, 2);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.size, 2);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes.length, 2);
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[0], "/path1");
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule1")?.prefixes[1], "/path2");
        assert.strictEqual(codigaConfig.ignore.get("my-python-ruleset")?.ruleIgnores.get("rule2")?.prefixes.length, 0);
        assert.strictEqual(codigaConfig.ignore.get("my-other-ruleset")?.ruleIgnores.size, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-other-ruleset")?.ruleIgnores.get("rule3")?.prefixes.length, 1);
        assert.strictEqual(codigaConfig.ignore.get("my-other-ruleset")?.ruleIgnores.get("rule3")?.prefixes[0], "/another/path");
    });
    // filterRules
    test("filterRules: returns empty array when no rule is provided", async () => {
        const rules = (0, rosieCache_1.filterRules)([types_1.Language.Python], []);
        assert.strictEqual(rules.length, 0);
    });
    test("filterRules: returns empty array when no language is provided", async () => {
        const rules = (0, rosieCache_1.filterRules)([], [(0, testUtils_1.createMockPythonRule)()]);
        assert.strictEqual(rules.length, 0);
    });
    test("filterRules: returns rules for a single input language", async () => {
        const rules = (0, rosieCache_1.filterRules)([types_1.Language.Python], [
            (0, testUtils_1.createMockPythonRule)(),
            (0, testUtils_1.createMockRule)("javascript")
        ]);
        assert.strictEqual(rules.length, 1);
        assert.strictEqual(rules[0].language, "python");
    });
    test("filterRules: returns rules for multiple input languages", async () => {
        const rules = (0, rosieCache_1.filterRules)([types_1.Language.Python, types_1.Language.Javascript], [
            (0, testUtils_1.createMockPythonRule)(),
            (0, testUtils_1.createMockRule)("javascript"),
            (0, testUtils_1.createMockRule)("typescript")
        ]);
        assert.strictEqual(rules.length, 2);
        assert.strictEqual(rules[0].language, "python");
        assert.strictEqual(rules[1].language, "javascript");
    });
    // getRosieRules
    test("getRosieRules: returns empty array for no rule provided", () => {
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [], pythonFile);
        assert.strictEqual(rules.length, 0);
    });
    test("getRosieRules: returns empty array for unsupported language", () => {
        const dockerfile = createInWorkspacePath("dockerfile");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Docker, [(0, testUtils_1.createMockPythonRule)()], dockerfile);
        assert.strictEqual(rules.length, 0);
    });
    test("getRosieRules: returns rules for Python", () => {
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)(),
            (0, testUtils_1.createMockRule)("javascript")
        ], pythonFile);
        assert.strictEqual(rules.length, 1);
        assert.strictEqual(rules[0].language, "python");
    });
    test("getRosieRules: returns rules for JavaScript", () => {
        const jsFile = createInWorkspacePath("javascript_file.js");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Javascript, [
            (0, testUtils_1.createMockPythonRule)(),
            (0, testUtils_1.createMockRule)("javascript")
        ], jsFile);
        assert.strictEqual(rules.length, 1);
        assert.strictEqual(rules[0].language, "javascript");
    });
    test("getRosieRules: returns union of JS and TS rules for TypeScript", () => {
        const tsFile = createInWorkspacePath("typescript_file.js");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Typescript, [
            (0, testUtils_1.createMockPythonRule)(),
            (0, testUtils_1.createMockRule)("javascript"),
            (0, testUtils_1.createMockRule)("typescript")
        ], tsFile);
        assert.strictEqual(rules.length, 2);
        assert.strictEqual(rules[0].language, "javascript");
        assert.strictEqual(rules[1].language, "typescript");
    });
    test("getRosieRules: should return rules for empty ignore config", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 3, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should not filter rules for ignore config with no ruleset", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  ");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 3, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should not filter rules for ignore config with no rule", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 3, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should filter rules for ignore config with no prefix", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 2, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should filter rule for ignore config with one matching prefix with leading slash", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix: /python");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 2, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should filter rules with ignore config with one matching prefix without leading slash", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix: python");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 2, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should filter rules with ignore config with one matching file path prefix", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix: /python_file.py");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 2, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should filter rules with ignore config with one matching directory path prefix", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix: /directory");
        const pythonFile = createInWorkspacePath("directory", "python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 2, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should not filter rules with ignore config with one prefix not matching", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix: not-matching");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 3, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should not filter rules with ignore config with one prefix containing double dots", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix: python_file..py");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 3, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should not filter rules with ignore config with one prefix containing single dot as folder", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix: directory/./python_file.py");
        const pythonFile = createInWorkspacePath("directory", "sub", "python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 3, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should not filter rules with ignore config with one prefix containing double dots as folder", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix: directory/../python_file.py");
        const pythonFile = createInWorkspacePath("directory", "sub", "python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 3, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should filter rules with ignore config with one matching prefix of multiple", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix:\n" +
            "        - not/matching\n" +
            "        - python_file.py");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 2, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should filter rules with ignore config with multiple matching prefixes", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix:\n" +
            "        - /python\n" +
            "        - python_file.py");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 2, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should not filter rules with ignore config with multiple prefixes not matching", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix:\n" +
            "        - not-matching\n" +
            "        - also/not/matching");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 3, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should filter rules with ignore config with multiple rule ignore configurations", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix: python_file..py\n" +
            "    - python_rule_3:\n" +
            "      - prefix:\n" +
            "        - /python_fi");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 2, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2"]);
    });
    test("getRosieRules: should not filter rules when rule doesnt belong to ruleset", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - python-ruleset:\n" +
            "    - non_python_rule:\n" +
            "      - prefix: python_file..py");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 3, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2", "python-ruleset/python_rule_3"]);
    });
    test("getRosieRules: should not filter rules when ruleset ignore is not present in rulesets property", async () => {
        await initializeRulesCache("rulesets:\n" +
            "  - python-ruleset\n" +
            "ignore:\n" +
            "  - not-configured-ruleset:\n" +
            "    - python_rule_2:\n" +
            "      - prefix: python_file.py");
        const pythonFile = createInWorkspacePath("python_file.py");
        const rules = (0, rosieCache_1.getRosieRules)(types_1.Language.Python, [
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_1"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_2"),
            (0, testUtils_1.createMockPythonRule)("python-ruleset", "python_rule_3")
        ], pythonFile);
        validateRuleCountAndRuleIds(rules, 3, ["python-ruleset/python_rule_1", "python-ruleset/python_rule_2", "python-ruleset/python_rule_3"]);
    });
    //getRulesFromCache
    test("getRulesFromCache: returns empty array when there is no workspace for the document", async () => {
        //text_file.txt is not present in the workspace
        const document = (0, testUtils_1.createTextDocument)(vscode_uri_1.URI.parse("file:///C:/workspace"), "text_file.txt");
        const rules = (0, rosieCache_1.getRulesFromCache)(document);
        assert.strictEqual(rules.length, 0);
    });
    test("getRulesFromCache: returns empty array when rules cache doesn't have the workspace stored", async () => {
        const document = (0, testUtils_1.createTextDocument)(workspaceFolder, "python_file.py", "python");
        const rules = (0, rosieCache_1.getRulesFromCache)(document);
        assert.strictEqual(rules.length, 0);
    });
    test("getRulesFromCache: returns empty array when rules cache doesn't have rule for a workspace", async () => {
        await (0, rosieCache_1.refreshCacheForWorkspace)(workspaceFolder.path, (0, testUtils_1.createCacheData)(rosieCache_1.CodigaYmlConfig.EMPTY, [(0, testUtils_1.createMockRule)("typescript")]));
        const document = (0, testUtils_1.createTextDocument)(workspaceFolder, "python_file.py", "python");
        const rules = (0, rosieCache_1.getRulesFromCache)(document);
        assert.strictEqual(rules.length, 0);
    });
    test("getRulesFromCache: returns empty array for document with unsupported language", async () => {
        await (0, rosieCache_1.refreshCacheForWorkspace)(workspaceFolder.path, (0, testUtils_1.createCacheData)(rosieCache_1.CodigaYmlConfig.EMPTY, [(0, testUtils_1.createMockPythonRule)()]));
        const document = (0, testUtils_1.createTextDocument)(workspaceFolder, "unsupported.configuration");
        const rules = (0, rosieCache_1.getRulesFromCache)(document);
        assert.strictEqual(rules.length, 0);
    });
    test("getRulesFromCache: returns rules for document", async () => {
        await (0, rosieCache_1.refreshCacheForWorkspace)(workspaceFolder.path, (0, testUtils_1.createCacheData)(rosieCache_1.CodigaYmlConfig.EMPTY, [
            (0, testUtils_1.createMockPythonRule)(),
            (0, testUtils_1.createMockRule)("javascript"),
            (0, testUtils_1.createMockRule)("python")
        ]));
        const document = (0, testUtils_1.createTextDocument)(workspaceFolder, "python_file.py", "python", "");
        const rules = (0, rosieCache_1.getRulesFromCache)(document);
        assert.strictEqual(rules.length, 2);
        assert.strictEqual(rules[0].language, "python");
        assert.strictEqual(rules[1].language, "python");
    });
});
//# sourceMappingURL=rosie-cache.test.js.map