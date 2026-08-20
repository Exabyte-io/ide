import type { ComputeArgumentsSchema } from "@mat3ra/esse/dist/js/types";
import pluralize from "pluralize";

import { getExternalBucket } from "./default";
import { QUEUE_TYPES } from "./nodes/enums";
import { wallTimeToHours } from "./utils/time";

/**
 * Any compute payload ide can operate on. Defaults to esse's own `compute` arguments schema
 * (from `job/compute.json`), or absent entirely - json-schema-to-typescript *inlines* `compute`
 * per schema, so `JobSchema["compute"]` (required) and `WorkflowSchema["compute"]` /
 * `SubworkflowMixinSchema["compute"]` (optional) are structurally identical to
 * `ComputeArgumentsSchema` but not referentially the same type. Consumers should parameterize
 * `ComputedEntityMixin<TheirSchema["compute"]>` explicitly rather than rely on this default.
 */
export type AnyComputeSchema = ComputeArgumentsSchema | undefined;

/** `compute` itself, with absence stripped - what every derived getter actually reads. */
type Compute<C extends AnyComputeSchema> = NonNullable<C>;

type Cluster<C extends AnyComputeSchema> = NonNullable<Compute<C>["cluster"]>;

/**
 * `compute`'s own optionality has to track whether `undefined` is part of `C`: TS2320 treats an
 * optional property (`compute?: X`, as esse's `WorkflowSchema`/`SubworkflowMixinSchema` declare
 * it - `compute` itself is optional in the JSON schema) and a required property typed `X |
 * undefined` (what a naive `compute: C` would give when `C` includes `undefined`, as it does for
 * those two) as *not identical*, independent of the value type - so a single fixed optionality
 * modifier can never match both those schemas and esse's `JobSchema` (`compute` required, no
 * `undefined`) at once. Toggling it by whether `undefined extends C` is what makes all three
 * identical to their respective generated schema mixin.
 */
type ComputeField<C extends AnyComputeSchema> = undefined extends C
    ? { compute?: C }
    : { compute: C };

/** Instance API mixed by {@link computedEntityMixin}. */
export type ComputedEntityMixin<C extends AnyComputeSchema = ComputeArgumentsSchema | undefined> =
    ComputeField<C> & {
        setCompute(compute: Compute<C>): void;
        unsetCompute(): void;
        getApproximateCharge(
            settings: { baseChargeRate: number },
            queueMultipliers?: Record<string, number> | null,
        ): number;

        readonly clusterJid: Cluster<C>["jid"];
        readonly clusterFqdn: Cluster<C>["fqdn"];
        readonly clusterFqdnShort: string;
        readonly timeLimit: Compute<C>["timeLimit"] | undefined;
        readonly computeQueue: Compute<C>["queue"] | undefined;
        readonly computePPN: number;
        readonly computeNodes: number;
        readonly computeNodesAndPPN: string;
        readonly timePrediction: number;
        readonly errors: NonNullable<Compute<C>["errors"]>;
        readonly hasWarnings: boolean;
        /** Intentionally not `readonly` - hosts are meant to override this with their own getter. */
        warnings: Array<{ condition: boolean; message: string }>;
        readonly isExternalJob: boolean;
        readonly bucket: string;
        readonly filesRootDir: string;
    };

export type WithComputedEntity<T, C extends AnyComputeSchema = ComputeArgumentsSchema | undefined> =
    T & ComputedEntityMixin<C>;

/** What {@link computedEntityMixin} reads off its host besides the mixed-in members themselves. */
type ComputedEntityHost<C extends AnyComputeSchema> = {
    _json: { compute?: C; isExternal?: boolean; owner?: unknown; workDir?: string };
    _getExternalBucket?: () => ReturnType<typeof getExternalBucket>;
    id?: string;
    createdAt?: string | number;
    workDir?: string;
    owner?: { slug?: string; isPersonal?: boolean; serviceLevel?: { nameBasedModifier?: number } };
    prop<T = unknown>(name: string, defaultValue?: T): T;
    setProp(name: string, value: unknown): void;
};

type Self<C extends AnyComputeSchema> = ComputedEntityHost<C> & ComputedEntityMixin<C>;

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
export function computedEntityMixin<C extends AnyComputeSchema = ComputeArgumentsSchema | undefined>(
    prototype: object,
): void {
    // @ts-expect-error — same idiom as the generated *SchemaMixin files: this object literal only
    // supplies ComputedEntityMixin's own members; the host (_json/prop/setProp) comes from
    // whatever `prototype` actually is, so `this` below is typed via this const's annotation.
    const computedEntityProperties: Self<C> = {
        get compute() {
            return this.prop<C>("compute");
        },

        set compute(value) {
            this.setProp("compute", value);
        },

        setCompute(compute) {
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
            return this.prop<Cluster<C>["jid"]>("compute.cluster.jid");
        },

        /**
         * @summary Returns cluster fqdn, where the job was/will be calculated
         */
        get clusterFqdn() {
            return this.prop<Cluster<C>["fqdn"]>("compute.cluster.fqdn");
        },

        get clusterFqdnShort() {
            return ((this.clusterFqdn || "").match(/cluster-\d\d\d/) || [])[0] || "";
        },

        /**
         * @summary Returns time limit (in seconds) set by user on job creation.
         */
        get timeLimit() {
            return this.prop<Compute<C>["timeLimit"] | undefined>("compute.timeLimit");
        },

        get computeQueue() {
            return this.prop<Compute<C>["queue"] | undefined>("compute.queue");
        },

        get computePPN() {
            return this.prop<number>("compute.ppn", 1);
        },

        get computeNodes() {
            return this.prop<number>("compute.nodes", 1);
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

        getApproximateCharge(settings, queueMultipliers = null) {
            const { timeLimit } = this;
            if (!timeLimit) {
                throw new Error("getApproximateCharge: compute.timeLimit is not set");
            }
            const timeLimitInHours = wallTimeToHours(timeLimit);

            const queue = this.computeQueue;
            const queueMultiplier = (queueMultipliers && queue && queueMultipliers[queue]) || 1;
            const rateModifier = this.owner?.serviceLevel?.nameBasedModifier || 1;
            const chargeRate = settings.baseChargeRate * rateModifier * queueMultiplier;

            return chargeRate * timeLimitInHours * this.computePPN;
        },

        // eslint-disable-next-line class-methods-use-this
        get timePrediction() {
            return 0;
        },

        get errors() {
            return this.prop<NonNullable<Compute<C>["errors"]>>("compute.errors", []);
        },

        get hasWarnings() {
            return this.warnings.map((o) => o.condition).some((x) => x);
        },

        /*
         * Array of warning Objects: [{condition: Boolean, message: String}]. Computed in-memory per Entity.
         */
        // eslint-disable-next-line class-methods-use-this
        get warnings() {
            return [];
        },

        set warnings(_value) {
            // Intentionally a no-op: hosts override this getter+setter pair wholesale to supply
            // their own warnings; this mixin's own value is always the empty-array default above.
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
            return this.clusterFqdn?.match(/master-(.*).(exabyte.io|mat3ra.com)/)?.[1] ?? "";
        },

        /*
         * @summary: returns files root directory.
         * For items created before 01/11/2018 00:00:00 UTC, path is started with either /home or /share.
         * For items after 01/11/2018 00:00:00 UTC, path is started with either /cluster-00N-home or /cluster-00N-share.
         */
        get filesRootDir() {
            if (this.isExternalJob) return `${this.owner?.slug}/${this.id}`;
            if (new Date(this.createdAt ?? "").getTime() <= 1515628800000) return this.workDir ?? "";
            const clusterAlias = this.clusterFqdn?.match(
                /master.*(cluster-.*).(exabyte.io|mat3ra.com)/,
            )?.[1];
            const prefix = this.owner?.isPersonal ? `/${clusterAlias}-home` : `/${clusterAlias}-share`;
            return `${prefix}/${(this.workDir ?? "").split("/").slice(2).join("/")}`;
        },
    };

    Object.defineProperties(
        prototype,
        Object.getOwnPropertyDescriptors(computedEntityProperties),
    );
}
