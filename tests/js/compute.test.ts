import { InMemoryEntity } from "@mat3ra/code/dist/js/entity";
import type { BaseInMemoryEntitySchema, ComputeArgumentsSchema } from "@mat3ra/esse/dist/js/types";
import { expect } from "chai";

import { type ComputedEntityMixin, computedEntityMixin } from "../../src/js/compute";
import { getDefaultComputeConfig } from "../../src/js/default";

type ComputerSchema = BaseInMemoryEntitySchema & { compute?: ComputeArgumentsSchema };

// This interface merge is the type-level regression test for the mixin's declaration-merge
// pattern: `compute` must be assignable to `ComputeArgumentsSchema | undefined`, mutable, and
// identical across every interface that declares it (see `ComputedEntityMixin<C>`'s own docs).
interface Computer extends ComputedEntityMixin<ComputeArgumentsSchema | undefined> {}

class Computer extends InMemoryEntity<ComputerSchema> {}
computedEntityMixin<ComputeArgumentsSchema | undefined>(Computer.prototype);

function assertApproximateCharge(compute: ComputeArgumentsSchema, expectedCharge: number) {
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
    it("can be created", () => {
        const config = getDefaultComputeConfig();
        expect(config.ppn).to.equal(1);
    });

    it("calculates approximate charge", () => {
        assertApproximateCharge({ queue: "D", nodes: 1, ppn: 1, timeLimit: "01:00:00" }, 2);
        assertApproximateCharge({ queue: "D", nodes: 1, ppn: 1, timeLimit: "70:00:00" }, 140);
        assertApproximateCharge({ queue: "OR", nodes: 1, ppn: 1, timeLimit: "70:00:00" }, 70);
    });

    it("throws when compute.timeLimit is not set", () => {
        const app = new Computer({});
        expect(() => app.getApproximateCharge({ baseChargeRate: 1 })).to.throw(
            "getApproximateCharge: compute.timeLimit is not set",
        );
    });

    it("allows setting and reading compute back (mutable, not readonly)", () => {
        const app = new Computer({});
        app.compute = { queue: "D", nodes: 1, ppn: 1, timeLimit: "01:00:00" };
        expect(app.compute?.queue).to.equal("D");
    });
});
