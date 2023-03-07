"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRuleFixRecord = void 0;
const configurationCache_1 = require("../utils/configurationCache");
const client_1 = require("./client");
const mutations_1 = require("./mutations");
/**
 * creates a record when a rule fix was applied in the editor
 */
async function addRuleFixRecord() {
    // Get the fingerprint from localstorage to initiate the request
    const userFingerprint = (0, configurationCache_1.getUserFingerprint)();
    // record that a rule fix has taken place
    await (0, client_1.doMutation)(mutations_1.USE_RULE_FIX, {
        fingerprint: userFingerprint,
    });
}
exports.addRuleFixRecord = addRuleFixRecord;
//# sourceMappingURL=add-rule-fix-record.js.map