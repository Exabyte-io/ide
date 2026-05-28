/** Instance API mixed by {@link computedEntityMixin}. */
export type ComputedEntityMixin = {
    setCompute(compute: Record<string, unknown>): void;
    unsetCompute(): void;
    getApproximateCharge(settings: {
        baseChargeRate: number;
    }, queueMultipliers?: Record<string, number> | null): number;
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
    readonly warnings: Array<{
        condition: boolean;
        message: string;
    }>;
    readonly isExternalJob: boolean;
    readonly bucket: string;
    readonly filesRootDir: string;
};
export type WithComputedEntity<T> = T & ComputedEntityMixin;
export declare function getHomeDir(isEnterprise: boolean, username: string): string;
export declare function getDefaultClusterQuota(defaultClusterHostname: string, username: string, isEnterprise?: boolean): {
    hostname: string;
    path: string;
    items: {
        bused: number;
        bsoft: number;
        bhard: number;
        iused: number;
        isoft: number;
        ihard: number;
    };
}[];
/**
 * @param prototype — typically `SomeEntity.prototype`
 */
export declare function computedEntityMixin(prototype: object): void;
