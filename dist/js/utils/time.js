"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.daysAgoToDate = exports.timestampToDate = exports.daysToMonths = exports.pythonUnixTimeToJs = exports.wallTimeToDays = exports.wallTimeToHours = exports.wallTimeToMinutes = exports.wallTimeToSeconds = exports.wallTimeTo = void 0;
const moment_1 = __importDefault(require("moment"));
const MULTIPLIERS = {
    s: 1,
    m: 60,
    h: 3600,
    d: 3600 * 24,
};
/**
 * @summary Converts walltime in '00:05:00' to on of the specified units - s (seconds), m (minutes), h (hours), d (days).
 * @param walltime walltime in '00:05:00' format (max value '99:999:59:59' - 99 days, 999 hours, 59 minutes, 59 seconds).
 * @param units s (seconds), m (minutes), h (hours).
 * @return Walltime in the specified units.
 */
function wallTimeTo(walltime, units) {
    if (["s", "m", "h", "d"].indexOf(units) < 0) {
        throw new Error(`Unexpected units - ${units}`);
    }
    const parts = walltime.split(":").reverse();
    const regex = /^([0-9][0-9])?:?([0-9]?[0-9][0-9]):([0-5][0-9]):([0-5][0-9])$/;
    if (parts.length < 3 || !walltime.match(regex)) {
        throw new Error(`Unexpected walltime format: ${walltime}. Allowed formats: '00:05:00', '99:999:59:59'`);
    }
    const seconds = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const hours = parseFloat(parts[2]);
    const days = parts[3] ? parseFloat(parts[3]) : 0;
    const totalSeconds = seconds + minutes * MULTIPLIERS.m + hours * MULTIPLIERS.h + days * MULTIPLIERS.d;
    return totalSeconds / MULTIPLIERS[units];
}
exports.wallTimeTo = wallTimeTo;
function wallTimeToSeconds(walltime) {
    return wallTimeTo(walltime, "s");
}
exports.wallTimeToSeconds = wallTimeToSeconds;
function wallTimeToMinutes(walltime) {
    return wallTimeTo(walltime, "m");
}
exports.wallTimeToMinutes = wallTimeToMinutes;
function wallTimeToHours(walltime) {
    return wallTimeTo(walltime, "h");
}
exports.wallTimeToHours = wallTimeToHours;
function wallTimeToDays(walltime) {
    return wallTimeTo(walltime, "d");
}
exports.wallTimeToDays = wallTimeToDays;
/**
 * @summary Converts python time format (e.g. 1493124101.243714) to js (1493124101243)
 * @param timestamp
 * @return
 */
function pythonUnixTimeToJs(timestamp) {
    // eslint-disable-next-line radix
    return parseInt(String(timestamp * 1000));
}
exports.pythonUnixTimeToJs = pythonUnixTimeToJs;
/**
 * @summary Converts days to months. 30 days equal to 1 month.
 * @param days
 */
function daysToMonths(days) {
    const months = days / 30;
    return months + (months === 1 ? " month" : " months");
}
exports.daysToMonths = daysToMonths;
function timestampToDate(timestamp = false, millisec = false) {
    return timestamp
        ? (0, moment_1.default)(timestamp * (millisec ? 1 : 1000)).format("MMM D, YYYY, HH:mm A")
        : "";
}
exports.timestampToDate = timestampToDate;
function daysAgoToDate(days) {
    return (0, moment_1.default)().utc().startOf("day").subtract(days, "days").toDate();
}
exports.daysAgoToDate = daysAgoToDate;
