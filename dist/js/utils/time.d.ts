/**
 * @summary Converts walltime in '00:05:00' to on of the specified units - s (seconds), m (minutes), h (hours), d (days).
 * @param walltime walltime in '00:05:00' format (max value '99:999:59:59' - 99 days, 999 hours, 59 minutes, 59 seconds).
 * @param units s (seconds), m (minutes), h (hours).
 * @return Walltime in the specified units.
 */
export declare function wallTimeTo(walltime: string, units: string): number;
export declare function wallTimeToSeconds(walltime: string): number;
export declare function wallTimeToMinutes(walltime: string): number;
export declare function wallTimeToHours(walltime: string): number;
export declare function wallTimeToDays(walltime: string): number;
/**
 * @summary Converts python time format (e.g. 1493124101.243714) to js (1493124101243)
 * @param timestamp
 * @return
 */
export declare function pythonUnixTimeToJs(timestamp: number): number;
/**
 * @summary Converts days to months. 30 days equal to 1 month.
 * @param days
 */
export declare function daysToMonths(days: number): string;
export declare function timestampToDate(timestamp?: number | false, millisec?: boolean): string;
export declare function daysAgoToDate(days: number): Date;
