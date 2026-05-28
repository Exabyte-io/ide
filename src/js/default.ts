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

export function getDefaultComputeConfig(): ComputeConfig {
    return {
        ppn: 1,
        nodes: 1,
        queue: "D",
        timeLimit: "01:00:00",
        notify: "n",
        cluster: {
            fqdn: "",
        },
    };
}

export function getExternalBucket(): ExternalBucket {
    return {
        name: "",
        provider: "",
        region: "",
    };
}
