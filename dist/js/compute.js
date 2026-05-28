"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computedEntityMixin = exports.getDefaultClusterQuota = exports.getHomeDir = void 0;
const pluralize_1 = __importDefault(require("pluralize"));
const default_1 = require("./default");
const enums_1 = require("./nodes/enums");
const time_1 = require("./utils/time");
function getHomeDir(isEnterprise, username) {
    return isEnterprise ? `/cluster-???-share/groups/${username}` : `/cluster-???-home/${username}`;
}
exports.getHomeDir = getHomeDir;
function getDefaultClusterQuota(defaultClusterHostname, username, isEnterprise = false) {
    return [
        {
            hostname: defaultClusterHostname,
            path: getHomeDir(isEnterprise, username),
            items: {
                bused: 0,
                bsoft: 0,
                bhard: 10737418240,
                iused: 0,
                isoft: 0,
                ihard: 10737418240,
            },
        },
    ];
}
exports.getDefaultClusterQuota = getDefaultClusterQuota;
/**
 * @param prototype — typically `SomeEntity.prototype`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computedEntityMixin(prototype) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const computedEntityProperties = {
        _computeProp(key, defaultValue) {
            return this.prop("compute." + key, defaultValue);
        },
        get compute() {
            return this.prop("compute");
        },
        setCompute(compute) {
            if (compute.queue === enums_1.QUEUE_TYPES.debug)
                delete compute.maxCPU;
            this.setProp("compute", compute);
        },
        unsetCompute() {
            delete this._json.compute;
        },
        /**
         * @summary Returns job ID in the Resource Management System.
         */
        get clusterJid() {
            return this._computeProp("cluster.jid");
        },
        /**
         * @summary Returns cluster fqdn, where the job was/will be calculated
         */
        get clusterFqdn() {
            return this._computeProp("cluster.fqdn");
        },
        get clusterFqdnShort() {
            return ((this.clusterFqdn || "").match(/cluster-\d\d\d/) || [])[0] || "";
        },
        /**
         * @summary Returns time limit (in seconds) set by user on job creation.
         */
        get timeLimit() {
            return this._computeProp("timeLimit");
        },
        get computeQueue() {
            return this._computeProp("queue");
        },
        get computePPN() {
            return this._computeProp("ppn", 1);
        },
        get computeNodes() {
            return this._computeProp("nodes", 1);
        },
        get computeNodesAndPPN() {
            return (this.computeNodes +
                " " +
                (0, pluralize_1.default)("node", this.computeNodes) +
                " x " +
                this.computePPN +
                " " +
                (0, pluralize_1.default)("core", this.computePPN));
        },
        getApproximateCharge(settings, queueMultipliers = null) {
            var _a, _b;
            const timeLimitInHours = (0, time_1.wallTimeToHours)(this.timeLimit);
            const queueMultiplier = queueMultipliers ? queueMultipliers[this.computeQueue] : 1;
            const rateModifier = ((_b = (_a = this.owner) === null || _a === void 0 ? void 0 : _a.serviceLevel) === null || _b === void 0 ? void 0 : _b.nameBasedModifier) || 1;
            const chargeRate = settings.baseChargeRate * rateModifier * queueMultiplier;
            return chargeRate * timeLimitInHours * this.computePPN;
        },
        // eslint-disable-next-line class-methods-use-this
        get timePrediction() {
            return 0;
        },
        get errors() {
            return this._computeProp("errors", []);
        },
        get hasWarnings() {
            return this.warnings
                .map((o) => o.condition)
                .some((x) => x);
        },
        /*
         * Array of warning Objects: [{condition: Boolean, message: String}]. Computed in-memory per Entity.
         */
        // eslint-disable-next-line class-methods-use-this
        get warnings() {
            return [];
        },
        get isExternalJob() {
            return this.prop("isExternal", false);
        },
        /**
         * @summary Returns the bucket name for this object storage items. Bucket name is constructed from cluster FQDN.
         * @example master-vagrant-cluster-001.exabyte.io ==> vagrant-cluster-001
         */
        get bucket() {
            if (this.isExternalJob) {
                return this._getExternalBucket
                    ? this._getExternalBucket().name
                    : (0, default_1.getExternalBucket)().name;
            }
            return this.clusterFqdn.match(/master-(.*).(exabyte.io|mat3ra.com)/)[1];
        },
        /*
         * @summary: returns files root directory.
         * For items created before 01/11/2018 00:00:00 UTC, path is started with either /home or /share.
         * For items after 01/11/2018 00:00:00 UTC, path is started with either /cluster-00N-home or /cluster-00N-share.
         */
        get filesRootDir() {
            if (this.isExternalJob)
                return `${this.prop("owner").slug}/${this.id}`;
            if (new Date(this.createdAt).getTime() <= 1515628800000)
                return this.workDir;
            const clusterAlias = this.clusterFqdn.match(/master.*(cluster-.*).(exabyte.io|mat3ra.com)/)[1];
            const prefix = this.owner.isPersonal
                ? `/${clusterAlias}-home`
                : `/${clusterAlias}-share`;
            return `${prefix}/${this.workDir.split("/").slice(2).join("/")}`;
        },
    };
    Object.defineProperties(prototype, Object.getOwnPropertyDescriptors(computedEntityProperties));
}
exports.computedEntityMixin = computedEntityMixin;
