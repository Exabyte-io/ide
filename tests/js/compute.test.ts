/* eslint-disable prettier/prettier */
/* eslint-disable max-classes-per-file */
import { InMemoryEntity } from "@mat3ra/code/dist/js/entity";
import { expect } from "chai";

import { computedEntityMixin, WithComputedEntity } from "../../src/js/compute";
import { getDefaultComputeConfig } from "../../src/js/default";

class Computer extends InMemoryEntity {}
computedEntityMixin(Computer.prototype);

function assertApproximateCharge(compute: Record<string, unknown>, expectedCharge: number) {
    const settings = { baseChargeRate: 1 };
    const queueMultipliers = {
        D: 2,
        OR: 1,
    };

    const app = new Computer({ compute }) as WithComputedEntity<Computer>;
    const charge = app.getApproximateCharge(settings, queueMultipliers);
    expect(charge).to.equal(expectedCharge);
}

describe("Model", () => {
    it("can be created", () => {
        const config = getDefaultComputeConfig();
        expect(config.ppn).to.equal(1);
    });

    it("calculates approximate charge", () => {
        assertApproximateCharge({ queue: "D", timeLimit: "01:00:00" }, 2);
        assertApproximateCharge({ queue: "D", timeLimit: "70:00:00" }, 140);
        assertApproximateCharge({ queue: "OR", timeLimit: "70:00:00" }, 70);
    });
});
