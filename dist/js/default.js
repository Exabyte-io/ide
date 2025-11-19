"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDefaultComputeConfig = getDefaultComputeConfig;
exports.getExternalBucket = getExternalBucket;

function getDefaultComputeConfig() {
  return {
    ppn: 1,
    nodes: 1,
    queue: "D",
    timeLimit: "01:00:00",
    notify: "n",
    cluster: {
      fqdn: ""
    }
  };
}

function getExternalBucket() {
  return {
    name: "",
    provider: "",
    region: ""
  };
}