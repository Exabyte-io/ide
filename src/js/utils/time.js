import moment from "moment";

const MULTIPLIERS = {
    s: 1,
    m: 60,
    h: 3600,
    d: 3600 * 24,
};

/**
 * @summary Converts walltime in '00:05:00' to on of the specified units - s (seconds), m (minutes), h (hours), d (days).
 * @param walltime {String} walltime in '00:05:00' format (max value '99:999:59:59' - 99 days, 999 hours, 59 minutes, 59 seconds).
 * @param units {String} s (seconds), m (minutes), h (hours).
 * @return {Number} Walltime in the specified units.
 */
export function wallTimeTo(walltime, units) {
    if (["s", "m", "h", "d"].indexOf(units) < 0) {
        throw new Error(`Unexpected units - ${units}`);
    }

    const parts = walltime.split(":").reverse();
    const regex = /^([0-9][0-9])?:?([0-9]?[0-9][0-9]):([0-5][0-9]):([0-5][0-9])$/;

    if (parts.length < 3 || !walltime.match(regex)) {
        throw new Error(
            `Unexpected walltime format: ${walltime}. Allowed formats: '00:05:00', '99:999:59:59'`,
        );
    }

    const seconds = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const hours = parseFloat(parts[2]);
    const days = parts[3] ? parseFloat(parts[3]) : 0;

    const totalSeconds =
        seconds + minutes * MULTIPLIERS.m + hours * MULTIPLIERS.h + days * MULTIPLIERS.d;
    return totalSeconds / MULTIPLIERS[units];
}

export function wallTimeToSeconds(walltime) {
    return wallTimeTo(walltime, "s");
}

export function wallTimeToMinutes(walltime) {
    return wallTimeTo(walltime, "m");
}

export function wallTimeToHours(walltime) {
    return wallTimeTo(walltime, "h");
}

export function wallTimeToDays(walltime) {
    return wallTimeTo(walltime, "d");
}

/**
 * @summary Converts python time format (e.g. 1493124101.243714) to js (1493124101243)
 * @param timestamp {Number}
 * @return {Number}
 */
export function pythonUnixTimeToJs(timestamp) {
    // eslint-disable-next-line radix
    return parseInt(timestamp * 1000);
}

/**
 * @summary Converts days to months. 30 days equal to 1 month.
 * @param days {Number}
 */
export function daysToMonths(days) {
    const months = days / 30;
    return months + (months === 1 ? " month" : " months");
}

export function timestampToDate(timestamp = false, millisec = false) {
    return timestamp
        ? moment(timestamp * (millisec ? 1 : 1000)).format("MMM D, YYYY, HH:mm A")
        : "";
}

export function daysAgoToDate(days) {
    return moment().utc().startOf("day").subtract(days, "days").toDate();
}
