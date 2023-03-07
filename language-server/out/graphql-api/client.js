"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doMutation = exports.doQuery = exports.initializeClient = void 0;
const graphql_request_1 = require("graphql-request");
const constants_1 = require("../constants");
const configurationCache_1 = require("../utils/configurationCache");
const rollbarUtils_1 = require("../utils/rollbarUtils");
const console = require("../utils/connectionLogger");
let client;
let languageClientName;
let languageClientVersion;
/**
 * Initialize the GraphQL client that will be used
 * to perform all the GraphQL request.
 */
function initializeClient(clientName, clientVersion) {
    languageClientName = clientName;
    languageClientVersion = clientVersion;
    client = new graphql_request_1.GraphQLClient(constants_1.GRAPHQL_ENDPOINT_PROD);
}
exports.initializeClient = initializeClient;
function generateHeaders() {
    const apiToken = (0, configurationCache_1.getApiToken)();
    const userAgentHeader = {
        [constants_1.USER_AGENT_HEADER_KEY]: `${languageClientName ?? ""}/${languageClientVersion || ""}`
    };
    //First, check if there is a token. If that is the case, prioritize its use.
    if (apiToken && apiToken.length > 20) {
        return {
            ...userAgentHeader,
            [constants_1.API_TOKEN_HEADER_KEY]: apiToken,
        };
    }
    return {
        ...userAgentHeader,
    };
}
/**
 * That is the main function to perform a GraphQL query. This is the main function
 * being used across the codebase.
 * @param graphqlQuery
 * @returns
 */
async function doQuery(graphqlQuery, variables = {}) {
    const query = client
        .request(graphqlQuery, variables, generateHeaders())
        .catch((e) => {
        console.log("exception when querying the GraphQL API");
        console.log(e);
        // ignore user-not-logged errors
        if (!e.message.includes("user-not-logged")) {
            (0, rollbarUtils_1.rollbarLogger)(e, { variables });
        }
        return undefined;
    });
    return query;
}
exports.doQuery = doQuery;
/**
 * Similar than doQuery but for a mutation.
 * @param graphqlMutation - mutation to execute
 * @param variables - variable to pass
 * @returns - the result of the mutation or undefined if an error was raised.
 */
async function doMutation(graphqlMutation, variables = {}) {
    const query = client
        .request(graphqlMutation, variables, generateHeaders())
        .catch((e) => {
        console.error("exception");
        console.error(e);
        (0, rollbarUtils_1.rollbarLogger)(e, { variables });
        return undefined;
    });
    return query;
}
exports.doMutation = doMutation;
//# sourceMappingURL=client.js.map