"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRulesLastUpdatedTimestamp = exports.getRules = void 0;
const constants_1 = require("../constants");
const configurationCache_1 = require("../utils/configurationCache");
const client_1 = require("./client");
const queries_1 = require("./queries");
const rulesMocks_1 = require("./rulesMocks");
/**
 * Map the element checked value from the GraphQL API
 * into an entityChecked value we actually pass to Rosie.
 * @param elementChecked - the GraphQL elementChecked value
 * @returns
 */
const graphQlElementCheckedToRosieEntityCheck = (elementChecked) => {
    if (!elementChecked) {
        return undefined;
    }
    return constants_1.ELEMENT_CHECKED_TO_ENTITY_CHECKED.get(elementChecked.toLocaleLowerCase());
};
async function getRules(rulesetsNames) {
    if (global.isInTestMode) {
        return (0, rulesMocks_1.getMockRules)(rulesetsNames);
    }
    const userFingerprint = (0, configurationCache_1.getUserFingerprint)();
    const variables = {
        names: rulesetsNames,
        fingerprint: userFingerprint,
    };
    const data = await (0, client_1.doQuery)(queries_1.GET_RULESETS_FOR_CLIENT, variables);
    if (!data) {
        return [];
    }
    return data.ruleSetsForClient.flatMap((ruleset) => {
        return ruleset.rules.map((rule) => {
            const entityChecked = graphQlElementCheckedToRosieEntityCheck(rule.elementChecked);
            return {
                rulesetName: ruleset.name,
                ruleName: rule.name,
                id: `${ruleset.name}/${rule.name}`,
                language: rule.language,
                type: rule.ruleType,
                entityChecked: entityChecked,
                contentBase64: rule.content,
                pattern: rule.pattern,
            };
        });
    });
}
exports.getRules = getRules;
async function getRulesLastUpdatedTimestamp(rulesetsNames) {
    if (global.isInTestMode) {
        return (0, rulesMocks_1.getMockRulesLastUpdatedTimestamp)(rulesetsNames);
    }
    const userFingerprint = (0, configurationCache_1.getUserFingerprint)();
    const variables = {
        names: rulesetsNames,
        fingerprint: userFingerprint,
    };
    const data = await (0, client_1.doQuery)(queries_1.GET_RULESETS_LAST_UPDATED_TIMESTAMP, variables);
    if (!data) {
        return undefined;
    }
    return data.ruleSetsLastUpdatedTimestamp;
}
exports.getRulesLastUpdatedTimestamp = getRulesLastUpdatedTimestamp;
//# sourceMappingURL=rules.js.map