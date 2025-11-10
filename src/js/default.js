export function getDefaultComputeConfig() {
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

export function getExternalBucket() {
    return {
        name: "",
        provider: "",
        region: "",
    };
}
