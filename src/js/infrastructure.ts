import { InMemoryEntity } from "@mat3ra/code/dist/js/entity";
import type { BaseInMemoryEntitySchema } from "@mat3ra/esse/dist/js/types";

import type { AnyComputeSchema, ComputedEntityMixin } from "./compute";
import { getExternalBucket } from "./default";
import { wallTimeToHours } from "./utils/time";

/**
 * Instance API mixed by {@link infrastructureMixin} - the parts of the old, single
 * `computedEntityMixin` that aren't derived from `compute` itself and only make sense for a job
 * actually running somewhere (billing, cloud storage bucket, execution warnings) - as opposed to
 * {@link import("./compute").ComputedEntityMixin}'s `compute`-derived readouts, which apply
 * equally to a Workflow/Subworkflow template that never runs on its own.
 *
 * Requires {@link ComputedEntityMixin} to already be mixed into the same host - reads
 * `clusterFqdn`/`timeLimit`/`computeQueue`/`computePPN` from it.
 */
export type InfrastructureMixin = {
    getApproximateCharge(
        settings: { baseChargeRate: number; rateModifier?: number },
        queueMultipliers?: Record<string, number> | null,
    ): number;

    readonly hasWarnings: boolean;
    /** Intentionally not `readonly` - hosts are meant to override this with their own getter. */
    warnings: Array<{ condition: boolean; message: string }>;
    readonly isExternalJob: boolean;
    readonly bucket: string;
};

/**
 * The host schema {@link infrastructureMixin} needs beyond the base `InMemoryEntity` fields:
 * `isExternal` is not part of esse's bare `job` schema (it comes from a host application's own
 * further composition, e.g. web-app's `webapp/job`), so a caller's concrete schema only needs to
 * be *assignable to* this - which any schema missing it (an optional field) already is.
 */
export type InfrastructureHostSchema = BaseInMemoryEntitySchema & { isExternal?: boolean };

/** What `this` resolves to inside the property literal below - same idiom as a generated `*SchemaMixin`. */
type Self<C extends AnyComputeSchema, S extends InfrastructureHostSchema> = InMemoryEntity<S> &
    ComputedEntityMixin<C> &
    InfrastructureMixin & {
        _getExternalBucket?: () => ReturnType<typeof getExternalBucket>;
    };

/**
 * @param item — typically `SomeEntity.prototype`, and must already have {@link computedEntityMixin}
 * applied to it.
 */
export function infrastructureMixin<
    C extends AnyComputeSchema = undefined,
    S extends InfrastructureHostSchema = InfrastructureHostSchema,
    T extends InMemoryEntity = InMemoryEntity,
>(item: InMemoryEntity): asserts item is T & InfrastructureMixin {
    // @ts-expect-error — same idiom as the generated *SchemaMixin files: this object literal only
    // supplies InfrastructureMixin's own members; the host (_json/prop/setProp, plus
    // ComputedEntityMixin's clusterFqdn/timeLimit/computeQueue/computePPN) comes from whatever
    // `item` actually is, so `this` below is typed via this const's annotation.
    const infrastructureProperties: Self<C, S> = {
        getApproximateCharge(settings, queueMultipliers = null) {
            const { timeLimit } = this;
            if (!timeLimit) {
                throw new Error("getApproximateCharge: compute.timeLimit is not set");
            }
            const timeLimitInHours = wallTimeToHours(timeLimit);

            const queue = this.computeQueue;
            const queueMultiplier = (queueMultipliers && queue && queueMultipliers[queue]) || 1;
            const rateModifier = settings.rateModifier || 1;
            const chargeRate = settings.baseChargeRate * rateModifier * queueMultiplier;

            return chargeRate * timeLimitInHours * this.computePPN;
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

    Object.defineProperties(item, Object.getOwnPropertyDescriptors(infrastructureProperties));
}
