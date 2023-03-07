"use strict";
/**
 * Set of functions to detect if the user was recently active (or not).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordLastActivity = exports.wasActiveRecently = void 0;
const tenMinutesInMilliseconds = 60 * 10 * 1000;
let lastActivityTimestamp = Date.now();
/**
 * Report if the editor was active recently. If the editor
 * was not active, we will not refresh the cache.
 * @returns
 */
const wasActiveRecently = () => {
    const tenMinutesAgo = Date.now() - tenMinutesInMilliseconds;
    return lastActivityTimestamp > tenMinutesAgo;
};
exports.wasActiveRecently = wasActiveRecently;
/**
 * Record the timestamp of the last activity to know
 * if we refresh the cache or not.
 */
const recordLastActivity = () => {
    lastActivityTimestamp = Date.now();
};
exports.recordLastActivity = recordLastActivity;
//# sourceMappingURL=activity.js.map