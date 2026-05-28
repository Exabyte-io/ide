export interface ComputeConfig {
    ppn: number;
    nodes: number;
    queue: string;
    timeLimit: string;
    notify: string;
    cluster: {
        fqdn: string;
    };
}
export interface ExternalBucket {
    name: string;
    provider: string;
    region: string;
}
export declare function getDefaultComputeConfig(): ComputeConfig;
export declare function getExternalBucket(): ExternalBucket;
