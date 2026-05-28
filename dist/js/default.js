"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExternalBucket = exports.getDefaultComputeConfig = void 0;
function getDefaultComputeConfig() {
    return {
        ppn: 1,
        nodes: 1,
        queue: "D",
        timeLimit: "01:00:00",
        notify: "n",
        cluster: {
            fqdn: "",
        },
    };
}
exports.getDefaultComputeConfig = getDefaultComputeConfig;
function getExternalBucket() {
    return {
        name: "",
        provider: "",
        region: "",
    };
}
exports.getExternalBucket = getExternalBucket;
