"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRuleResponses = void 0;
const fileUtils_1 = require("../utils/fileUtils");
const rosieLanguage_1 = require("./rosieLanguage");
const axios_1 = require("axios");
const rosieConstants_1 = require("./rosieConstants");
const rosieClientMocks_1 = require("./rosieClientMocks");
const console = require("../utils/connectionLogger");
/**
 * Sends a request to Rosie for the current document, and returns the received rule responses.
 *
 * An empty array is returned when
 * <ul>
 *   <li>The current document's language is not supported by Rosie.</li>
 *   <li>There is no response from Rosie.</li>
 *   <li>An error occurred during processing the request and response.</li>
 * <ul>
 *
 * @param document - the document being analyzed
 * @param rules - the list of rules
 * @returns - the list of rule responses received from Rosie, or empty
 */
const getRuleResponses = async (document, rules) => {
    if (global.isInTestMode) {
        return (0, rosieClientMocks_1.getMockRuleResponses)(document);
    }
    const relativePath = (0, fileUtils_1.asRelativePath)(document);
    const language = (0, fileUtils_1.getLanguageForFile)(relativePath);
    const rosieLanguage = (0, rosieLanguage_1.getRosieLanguage)(language);
    if (!rosieLanguage) {
        // console.log("language not supported by Rosie");
        return [];
    }
    // Convert the code to Base64
    const codeBuffer = Buffer.from(document.getText());
    const codeBase64 = codeBuffer.toString("base64");
    // Build the request post data
    const data = {
        filename: relativePath,
        fileEncoding: "utf-8",
        language: rosieLanguage,
        codeBase64: codeBase64,
        rules: rules,
        logOutput: false,
    };
    try {
        // Make the initial request to Rosie
        const response = await axios_1.default.post(rosieConstants_1.ROSIE_ENDPOINT_PROD, data, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!response || !response.data) {
            // console.log("no response from Rosie");
            return [];
        }
        return response.data.ruleResponses;
    }
    catch (err) {
        console.log(`ERROR: ${err}`);
        return [];
    }
};
exports.getRuleResponses = getRuleResponses;
//# sourceMappingURL=rosieClient.js.map