import pluralize from "pluralize";

import { getExternalBucket } from "./default";
import { QUEUE_TYPES } from "./nodes/enums";
import { wallTimeToHours } from "./utils/time";

/** Instance API mixed by {@link computedEntityMixin}. */
export type ComputedEntityMixin = {
    setCompute(compute: Record<string, unknown>): void;
    unsetCompute(): void;
    getApproximateCharge(
        settings: { baseChargeRate: number },
        queueMultipliers?: Record<string, number> | null,
    ): number;

    readonly compute: unknown;
    readonly clusterJid: unknown;
    readonly clusterFqdn: string | undefined;
    readonly clusterFqdnShort: string;
    readonly timeLimit: unknown;
    readonly computeQueue: unknown;
    readonly computePPN: number;
    readonly computeNodes: number;
    readonly computeNodesAndPPN: string;
    readonly timePrediction: number;
    readonly errors: unknown[];
    readonly hasWarnings: boolean;
    readonly warnings: Array<{ condition: boolean; message: string }>;
    readonly isExternalJob: boolean;
    readonly bucket: string;
    readonly filesRootDir: string;
};

export type WithComputedEntity<T> = T & ComputedEntityMixin;

export function getHomeDir(isEnterprise: boolean, username: string): string {
    return isEnterprise ? `/cluster-???-share/groups/${username}` : `/cluster-???-home/${username}`;
}

export function getDefaultClusterQuota(
    defaultClusterHostname: string,
    username: string,
    isEnterprise = false,
) {
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

/**
 * @param prototype — typically `SomeEntity.prototype`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computedEntityMixin(prototype: object): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const computedEntityProperties: any = {
        _computeProp(key: string, defaultValue?: unknown) {
            return this.prop("compute." + key, defaultValue);
        },

        get compute() {
            return this.prop("compute");
        },

        setCompute(compute: Record<string, unknown>) {
            if (compute.queue === QUEUE_TYPES.debug) delete compute.maxCPU;
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
            return (
                this.computeNodes +
                " " +
                pluralize("node", this.computeNodes) +
                " x " +
                this.computePPN +
                " " +
                pluralize("core", this.computePPN)
            );
        },

        getApproximateCharge(
            settings: { baseChargeRate: number },
            queueMultipliers: Record<string, number> | null = null,
        ) {
            const timeLimitInHours = wallTimeToHours(this.timeLimit);

            const queueMultiplier = queueMultipliers ? queueMultipliers[this.computeQueue] : 1;
            const rateModifier = this.owner?.serviceLevel?.nameBasedModifier || 1;
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
                .map((o: { condition: boolean }) => o.condition)
                .some((x: boolean) => x);
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
                    : getExternalBucket().name;
            }
            return this.clusterFqdn.match(/master-(.*).(exabyte.io|mat3ra.com)/)[1];
        },

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
        },
    };

    Object.defineProperties(prototype, Object.getOwnPropertyDescriptors(computedEntityProperties));
}
