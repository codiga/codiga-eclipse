"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET_RULESETS_LAST_UPDATED_TIMESTAMP = exports.GET_RULESETS_FOR_CLIENT = void 0;
const graphql_request_1 = require("graphql-request");
exports.GET_RULESETS_FOR_CLIENT = (0, graphql_request_1.gql) `
  query getRulesetsForClient($fingerprint: String, $names: [String!]!) {
    ruleSetsForClient(names: $names, fingerprint: $fingerprint) {
      id
      name
      rules(howmany: 10000, skip: 0) {
        id
        name
        content
        ruleType
        language
        pattern
        elementChecked
      }
    }
  }
`;
exports.GET_RULESETS_LAST_UPDATED_TIMESTAMP = (0, graphql_request_1.gql) `
  query getRulesetsLastUpdatedTimestamp(
    $fingerprint: String
    $names: [String!]!
  ) {
    ruleSetsLastUpdatedTimestamp(names: $names, fingerprint: $fingerprint)
  }
`;
//# sourceMappingURL=queries.js.map