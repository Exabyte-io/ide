/* eslint-disable max-classes-per-file */
import { InMemoryEntity } from "@mat3ra/code/dist/js/entity";
import { expect } from "chai";
import { mix } from "mixwith";

import { ComputedEntityMixin } from "../../src/js/compute";

class Computer extends mix(InMemoryEntity).with(ComputedEntityMixin) {}

function assertApproximateCharge(compute, expectedCharge) {
    const settings = { baseChargeRate: 1 };
    const queueMultipliers = {
        D: 2,
        OR: 1,
    };

    const app = new Computer({ compute });
    const charge = app.getApproximateCharge(settings, queueMultipliers);
    expect(charge).to.equal(expectedCharge);
}

describe("Model", () => {
    const obj = {};

    it("can be created", () => {
        const app = new Computer(obj);
        const config = app.constructor.getDefaultComputeConfig();
        expect(config.ppn).to.equal(1);
    });

    it("calculates approximate charge", () => {
        assertApproximateCharge({ queue: "D", timeLimit: "01:00:00" }, 2);
        assertApproximateCharge({ queue: "D", timeLimit: "70:00:00" }, 140);
        assertApproximateCharge({ queue: "OR", timeLimit: "70:00:00" }, 70);
    });
});
