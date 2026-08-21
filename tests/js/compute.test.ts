import { InMemoryEntity } from "@mat3ra/code/dist/js/entity";
import type { BaseInMemoryEntitySchema, ComputeArgumentsSchema } from "@mat3ra/esse/dist/js/types";
import { expect } from "chai";

import { type ComputedEntityMixin, computedEntityMixin } from "../../src/js/compute";
import { getDefaultComputeConfig } from "../../src/js/default";
import { type InfrastructureMixin, infrastructureMixin } from "../../src/js/infrastructure";

type ComputerSchema = BaseInMemoryEntitySchema & { compute?: ComputeArgumentsSchema };

// This interface merge is the type-level regression test for the mixin's declaration-merge
// pattern: `compute` must be assignable to `ComputeArgumentsSchema | undefined`, mutable, and
// identical across every interface that declares it (see `ComputedEntityMixin<C>`'s own docs).
interface Computer
    extends ComputedEntityMixin<ComputeArgumentsSchema | undefined>,
        InfrastructureMixin {}

class Computer extends InMemoryEntity<ComputerSchema> {}
computedEntityMixin<ComputeArgumentsSchema | undefined>(Computer.prototype);
infrastructureMixin(Computer.prototype);

// `queue`/`nodes`/`ppn`/`timeLimit` are required *within* ComputeArgumentsSchema, so once
// `compute` itself is guaranteed present (a required-compute schema, as Job's is), they must be
// too - not `| undefined` regardless, as they'd be for a schema where `compute` itself may be
// absent (Workflow/Subworkflow's `compute?`).
type RequiredComputeSchema = BaseInMemoryEntitySchema & { compute: ComputeArgumentsSchema };
interface RequiredComputer extends ComputedEntityMixin<ComputeArgumentsSchema> {}
class RequiredComputer extends InMemoryEntity<RequiredComputeSchema> {}
computedEntityMixin<ComputeArgumentsSchema>(RequiredComputer.prototype);

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

    it("applies settings.rateModifier to the approximate charge", () => {
        const app = new Computer({
            compute: { queue: "D", nodes: 1, ppn: 1, timeLimit: "01:00:00" },
        });
        const charge = app.getApproximateCharge({ baseChargeRate: 1, rateModifier: 2 }, { D: 2 });
        expect(charge).to.equal(4);
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

    it("types timeLimit as plain string when compute itself is required, string | undefined otherwise", () => {
        const required = new RequiredComputer({
            compute: { queue: "D", nodes: 1, ppn: 1, timeLimit: "01:00:00" },
        });
        // Required case: assigning to plain `string` must compile cleanly - no @ts-expect-error.
        const requiredTimeLimit: string = required.timeLimit;
        expect(requiredTimeLimit).to.equal("01:00:00");

        const optional = new Computer({});
        // Optional case (Computer's compute is `ComputeArgumentsSchema | undefined`): timeLimit
        // stays `string | undefined`, so the same assignment must fail to compile.
        // @ts-expect-error - Computer's timeLimit is string | undefined, not string
        const optionalTimeLimit: string = optional.timeLimit;
        expect(optionalTimeLimit).to.equal(undefined);
    });
});
