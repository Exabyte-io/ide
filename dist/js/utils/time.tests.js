"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const time_1 = require("./time");
describe("time", () => {
    it("wallTimeToSeconds", () => {
        (0, chai_1.expect)((0, time_1.wallTimeToSeconds)("00:00:30")).to.be.equal(30);
        (0, chai_1.expect)((0, time_1.wallTimeToSeconds)("69:10:00")).to.be.equal(
            69 * 3600 + 10 * 60,
        );
        (0, chai_1.expect)((0, time_1.wallTimeToSeconds)("01:00:00:00")).to.be.equal(24 * 3600);
    });
    it("wallTimeToMinutes", () => {
        (0, chai_1.expect)((0, time_1.wallTimeToMinutes)("00:00:30")).to.be.equal(0.5);
        (0, chai_1.expect)((0, time_1.wallTimeToMinutes)("79:10:00")).to.be.equal(79 * 60 + 10);
        (0, chai_1.expect)((0, time_1.wallTimeToMinutes)("01:00:00:00")).to.be.equal(24 * 60);
    });
    it("wallTimeToHours", () => {
        (0, chai_1.expect)((0, time_1.wallTimeToHours)("00:30:00")).to.be.equal(0.5);
        (0, chai_1.expect)((0, time_1.wallTimeToHours)("02:999:00:00")).to.be.equal(48 + 999);
        (0, chai_1.expect)((0, time_1.wallTimeToHours)("01:00:00:00")).to.be.equal(24);
    });
    it("wallTimeToDays", () => {
        (0, chai_1.expect)((0, time_1.wallTimeToDays)("01:12:00:00")).to.be.equal(1.5);
        (0, chai_1.expect)((0, time_1.wallTimeToDays)("05:00:00:00")).to.be.equal(5);
    });
});
