"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockRulesLastUpdatedTimestamp = exports.getMockRules = void 0;
const testUtils_1 = require("../test/testUtils");
/**
 * Returns mock rules for testing based on the argument ruleset names.
 *
 * @param rulesetsNames the ruleset names
 */
function getMockRules(rulesetsNames) {
    if (rulesetsNames[0] === "actual-ruleset") {
        return [
            (0, testUtils_1.createMockRule)("typescript"),
            (0, testUtils_1.createMockRule)("typescript")
        ];
    }
    else {
        return [];
    }
}
exports.getMockRules = getMockRules;
/**
 * Returns mock last updated timestamps for rulesets based on the argument ruleset names.
 *
 * @param rulesetsNames the ruleset names
 */
function getMockRulesLastUpdatedTimestamp(rulesetsNames) {
    if (rulesetsNames[0] === "undefined-ruleset") {
        return undefined;
    }
    if (rulesetsNames[0] === "actual-ruleset") {
        return 100;
    }
}
exports.getMockRulesLastUpdatedTimestamp = getMockRulesLastUpdatedTimestamp;
//# sourceMappingURL=rulesMocks.js.map