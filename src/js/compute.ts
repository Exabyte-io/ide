import { InMemoryEntity } from "@mat3ra/code/dist/js/entity";
import type { BaseInMemoryEntitySchema, ComputeArgumentsSchema } from "@mat3ra/esse/dist/js/types";
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
    };

export type WithComputedEntity<
    T,
    C extends AnyComputeSchema = ComputeArgumentsSchema | undefined,
> = T & ComputedEntityMixin<C>;

/**
 * The host schema {@link computedEntityMixin} needs beyond `compute` itself and the base
 * `InMemoryEntity` fields (`_id`, `slug`, ...): `owner`/`isExternal` are not part of esse's bare
 * `job`/`workflow` schemas (they come from a host application's own further composition, e.g.
 * web-app's `webapp/job`), so a caller's concrete schema only needs to be *assignable to* this -
 * which any schema missing these (all-optional) fields already is.
 */
type ComputedEntityHostSchema<C extends AnyComputeSchema> = BaseInMemoryEntitySchema &
    ComputeField<C> & {
        isExternal?: boolean;
        owner?: { serviceLevel?: { nameBasedModifier?: number } };
    };

/** What `this` resolves to inside the property literal below - same idiom as a generated `*SchemaMixin`. */
type Self<C extends AnyComputeSchema, S extends ComputedEntityHostSchema<C>> = InMemoryEntity<S> &
    ComputedEntityMixin<C> & {
        _getExternalBucket?: () => ReturnType<typeof getExternalBucket>;
    };

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
 * @param item — typically `SomeEntity.prototype`
 */
export function computedEntityMixin<
    C extends AnyComputeSchema = ComputeArgumentsSchema | undefined,
    S extends ComputedEntityHostSchema<C> = ComputedEntityHostSchema<C>,
    T extends InMemoryEntity = InMemoryEntity,
>(item: InMemoryEntity): asserts item is T & ComputedEntityMixin<C> {
    // @ts-expect-error — same idiom as the generated *SchemaMixin files: this object literal only
    // supplies ComputedEntityMixin's own members; the host (_json/prop/setProp) comes from
    // whatever `item` actually is, so `this` below is typed via this const's annotation.
    const computedEntityProperties: Self<C, S> = {
        get compute() {
            return this.prop("compute");
        },

        // `setProp`'s signature (`value: S[typeof name]`) isn't call-site generic, so it can't
        // narrow to a single field's type when `S` is itself a still-abstract generic type
        // parameter (real gap in `code`'s own types) - write directly to `_json` instead, exactly
        // like a generated `*SchemaMixin`'s own setter would if it had this same problem.
        set compute(value) {
            this._json.compute = value;
        },

        setCompute(compute) {
            if (compute.queue === QUEUE_TYPES.debug) delete compute.maxCPU;
            this._json.compute = compute;
        },

        unsetCompute() {
            this.unsetProp("compute");
        },

        /**
         * @summary Returns job ID in the Resource Management System.
         */
        get clusterJid() {
            return this.compute?.cluster?.jid;
        },

        /**
         * @summary Returns cluster fqdn, where the job was/will be calculated
         */
        get clusterFqdn() {
            return this.compute?.cluster?.fqdn;
        },

        get clusterFqdnShort() {
            return ((this.clusterFqdn || "").match(/cluster-\d\d\d/) || [])[0] || "";
        },

        /**
         * @summary Returns time limit (in seconds) set by user on job creation.
         */
        get timeLimit() {
            return this.compute?.timeLimit;
        },

        get computeQueue() {
            return this.compute?.queue;
        },

        get computePPN() {
            return this.compute?.ppn ?? 1;
        },

        get computeNodes() {
            return this.compute?.nodes ?? 1;
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
            const rateModifier = this.prop("owner")?.serviceLevel?.nameBasedModifier || 1;
            const chargeRate = settings.baseChargeRate * rateModifier * queueMultiplier;

            return chargeRate * timeLimitInHours * this.computePPN;
        },

        // eslint-disable-next-line class-methods-use-this
        get timePrediction() {
            return 0;
        },

        get errors() {
            return this.compute?.errors ?? [];
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
    };

    Object.defineProperties(item, Object.getOwnPropertyDescriptors(computedEntityProperties));
}
