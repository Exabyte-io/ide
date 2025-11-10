import lodash from "lodash";
import pluralize from "pluralize";

import { getDefaultComputeConfig, getExternalBucket } from "./default";
import { QUEUE_TYPES } from "./nodes/enums";
import { wallTimeToHours } from "./utils/time";

export const ComputedEntityMixin = (superclass) =>
    class extends superclass {
        static getDefaultComputeConfig = getDefaultComputeConfig;

        _computeProp(key, defaultValue) {
            return this.prop("compute." + key, defaultValue);
        }

        get compute() {
            return this.prop("compute");
        }

        setDefaultCompute() {
            this.setCompute(this.constructor.getDefaultComputeConfig());
        }

        setCompute(compute) {
            // unset maxCPU property if queue is debug.
            if (compute.queue === QUEUE_TYPES.debug) delete compute.maxCPU;
            this.setProp("compute", compute);
        }

        unsetCompute() {
            delete this._json.compute;
        }

        /**
         * @summary Returns job ID in the Resource Management System.
         */
        get clusterJid() {
            return this._computeProp("cluster.jid");
        }

        /**
         * @summary Returns cluster fqdn, where the job was/will be calculated
         */
        get clusterFqdn() {
            return this._computeProp("cluster.fqdn");
        }

        // gets "cluster-001" part of the full FQDN
        get clusterFqdnShort() {
            return ((this.clusterFqdn || "").match(/cluster-\d\d\d/) || [])[0] || "";
        }

        /**
         * @summary Returns time limit (in seconds) set by user on job creation.
         */
        get timeLimit() {
            return this._computeProp("timeLimit");
        }

        get computeQueue() {
            return this._computeProp("queue");
        }

        get computePPN() {
            return this._computeProp("ppn", 1);
        }

        get computeNodes() {
            return this._computeProp("nodes", 1);
        }

        // helper to form a string
        get computeNodesAndPPN() {
            return (
                this.computeNodes +
                " " +
                pluralize("node", this.computeNodes) +
                " x " +
                this.computePPN +
                " " +
                pluralize("core", this.computePPN)
            );
        }

        getApproximateCharge(settings, queueMultipliers = null) {
            const timeLimitInHours = wallTimeToHours(this.timeLimit);

            const queueMultiplier = queueMultipliers ? queueMultipliers[this.computeQueue] : 1;
            const rateModifier = this.owner?.serviceLevel?.nameBasedModifier || 1;
            const chargeRate = settings.baseChargeRate * rateModifier * queueMultiplier;

            return chargeRate * timeLimitInHours * this.computePPN;
        }

        // eslint-disable-next-line class-methods-use-this
        get timePrediction() {
            // TODO: re-add
            return 0;
        }

        get errors() {
            return this._computeProp("errors", []);
        }

        get hasWarnings() {
            return this.warnings.map((o) => o.condition).some((x) => x);
        }

        /*
         * Array of warning Objects: [{condition: Boolean, message: String}]. Computed in-memory per Entity.
         */
        // eslint-disable-next-line class-methods-use-this
        get warnings() {
            return [];
        }

        get isExternalJob() {
            return this.prop("isExternal", false);
        }

        /**
         * @summary Returns the bucket name for this object storage items. Bucket name is constructed from cluster FQDN.
         * @example master-vagrant-cluster-001.exabyte.io ==> vagrant-cluster-001
         */
        get bucket() {
            if (this.isExternalJob) {
                return this._getExternalBucket
                    ? this._getExternalBucket().name
                    : getExternalBucket().name;
            }
            return this.clusterFqdn.match(/master-(.*).(exabyte.io|mat3ra.com)/)[1];
        }

        /*
         * @summary: returns files root directory.
         * For items created before 01/11/2018 00:00:00 UTC, path is started with either /home or /share.
         * For items after 01/11/2018 00:00:00 UTC, path is started with either /cluster-00N-home or /cluster-00N-share.
         */
        get filesRootDir() {
            if (this.isExternalJob) return `${this.prop("owner").slug}/${this.id}`;
            if (new Date(this.createdAt).getTime() <= 1515628800000) return this.workDir;
            const clusterAlias = this.clusterFqdn.match(
                /master.*(cluster-.*).(exabyte.io|mat3ra.com)/,
            )[1];
            const prefix = this.owner.isPersonal
                ? `/${clusterAlias}-home`
                : `/${clusterAlias}-share`;
            return `${prefix}/${this.workDir.split("/").slice(2).join("/")}`;
        }

        /**
         * @summary Cleans up compute configuration.
         * config {Object} object configuration
         * backendManager {*} backend manager implementing getNodeByHostname
         * getDefaultComputeConfig {Function} returns a default compute config
         * - job id information is removed (appears after submission).
         * - cluster is replaced with default cluster if the current one does not exist.
         */
        static cleanupCompute(config, backendManager) {
            const hostname = lodash.get(config, "compute.cluster.fqdn");
            const node = backendManager.getNodeByHostname(hostname);
            if (!node) config.compute = this.getDefaultComputeConfig();
            if (config.compute.cluster) delete config.compute.cluster.jid;
            delete config.compute.errors;
        }
    };
