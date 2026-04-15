/** Instance API mixed by {@link computedEntityMixin}. */
export type ComputedEntityMixin = {
    setCompute(compute: unknown): void;
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

export function computedEntityMixin(prototype: object): void;

/** Non-mixin exports from compute.js (loose). */
export function getHomeDir(isEnterprise: boolean, username: string): string;
export function getDefaultClusterQuota(
    defaultClusterHostname: string,
    username: string,
    isEnterprise?: boolean,
): unknown[];
