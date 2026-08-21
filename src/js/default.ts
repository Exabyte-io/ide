import type { ComputeArgumentsSchema } from "@mat3ra/esse/dist/js/types";

export function getDefaultComputeConfig(): ComputeArgumentsSchema {
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
