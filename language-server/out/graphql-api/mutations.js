"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USE_RULE_FIX = void 0;
const graphql_request_1 = require("graphql-request");
exports.USE_RULE_FIX = (0, graphql_request_1.gql) `
  mutation recordAccess($fingerprint: String, $ruleId: Long) {
    recordAccess(
      accessType: VsCode
      actionType: RuleFix
      ruleId: $ruleId
      userFingerprint: $fingerprint
    )
  }
`;
//# sourceMappingURL=mutations.js.map