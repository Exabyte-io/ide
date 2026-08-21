import { InMemoryEntity } from "@mat3ra/code/dist/js/entity";
import type { BaseInMemoryEntitySchema, ComputeArgumentsSchema } from "@mat3ra/esse/dist/js/types";
import pluralize from "pluralize";

import { QUEUE_TYPES } from "./nodes/enums";

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
export type Compute<C extends AnyComputeSchema> = NonNullable<C>;

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
export type ComputeField<C extends AnyComputeSchema> = undefined extends C
    ? { compute?: C }
    : { compute: C };

/**
 * `V`, unless `compute` itself might be absent (`undefined extends C`) - then `V | undefined`.
 * `queue`/`nodes`/`ppn`/`timeLimit` are all required *within* `ComputeArgumentsSchema` (whenever
 * `compute` exists, they exist too), so their own `| undefined` must come from `compute`'s
 * optionality, not be tacked on unconditionally - same reasoning as {@link ComputeField}, just
 * applied one level down instead of to `compute` itself.
 */
type RequiredWithCompute<C extends AnyComputeSchema, V> = undefined extends C ? V | undefined : V;

/**
 * Instance API mixed by {@link computedEntityMixin} - the compute payload itself, plus everything
 * that's purely derived from it (cluster info, queue/node/ppn readouts, compute errors). Every
 * one of these makes sense for any entity that carries a `compute` config (Job, Workflow,
 * Subworkflow) - see {@link import("./infrastructure").infrastructureMixin} for the
 * Job-specific behavior (billing, cloud storage bucket, warnings) that doesn't belong here.
 */
export type ComputedEntityMixin<C extends AnyComputeSchema = ComputeArgumentsSchema | undefined> =
    ComputeField<C> & {
        setCompute(compute: Compute<C>): void;
        unsetCompute(): void;

        readonly clusterJid: Cluster<C>["jid"];
        readonly clusterFqdn: Cluster<C>["fqdn"];
        readonly clusterFqdnShort: string;
        readonly timeLimit: RequiredWithCompute<C, Compute<C>["timeLimit"]>;
        readonly computeQueue: RequiredWithCompute<C, Compute<C>["queue"]>;
        readonly computePPN: number;
        readonly computeNodes: number;
        readonly computeNodesAndPPN: string;
        readonly errors: NonNullable<Compute<C>["errors"]>;
    };

export type WithComputedEntity<
    T,
    C extends AnyComputeSchema = ComputeArgumentsSchema | undefined,
> = T & ComputedEntityMixin<C>;

/**
 * The host schema {@link computedEntityMixin} needs beyond the base `InMemoryEntity` fields
 * (`_id`, `slug`, ...): just `compute` itself.
 */
export type ComputedEntityHostSchema<C extends AnyComputeSchema> = BaseInMemoryEntitySchema &
    ComputeField<C>;

/** What `this` resolves to inside the property literal below - same idiom as a generated `*SchemaMixin`. */
type Self<C extends AnyComputeSchema, S extends ComputedEntityHostSchema<C>> = InMemoryEntity<S> &
    ComputedEntityMixin<C>;

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

        get errors() {
            return this.compute?.errors ?? [];
        },
    };

    Object.defineProperties(item, Object.getOwnPropertyDescriptors(computedEntityProperties));
}
