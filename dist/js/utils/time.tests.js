"use strict";

var _chai = require("chai");

var _time = require("./time");

describe("time", () => {
  it("wallTimeToSeconds", () => {
    (0, _chai.expect)((0, _time.wallTimeToSeconds)("00:00:30")).to.be.equal(30);
    (0, _chai.expect)((0, _time.wallTimeToSeconds)("69:10:00")).to.be.equal(69 * 3600 + 10 * 60);
    (0, _chai.expect)((0, _time.wallTimeToSeconds)("01:00:00:00")).to.be.equal(24 * 3600);
  });
  it("wallTimeToMinutes", () => {
    (0, _chai.expect)((0, _time.wallTimeToMinutes)("00:00:30")).to.be.equal(0.5);
    (0, _chai.expect)((0, _time.wallTimeToMinutes)("79:10:00")).to.be.equal(79 * 60 + 10);
    (0, _chai.expect)((0, _time.wallTimeToMinutes)("01:00:00:00")).to.be.equal(24 * 60);
  });
  it("wallTimeToHours", () => {
    (0, _chai.expect)((0, _time.wallTimeToHours)("00:30:00")).to.be.equal(0.5);
    (0, _chai.expect)((0, _time.wallTimeToHours)("02:999:00:00")).to.be.equal(48 + 999);
    (0, _chai.expect)((0, _time.wallTimeToHours)("01:00:00:00")).to.be.equal(24);
  });
  it("wallTimeToDays", () => {
    (0, _chai.expect)((0, _time.wallTimeToDays)("01:12:00:00")).to.be.equal(1.5);
    (0, _chai.expect)((0, _time.wallTimeToDays)("05:00:00:00")).to.be.equal(5);
  });
});