import { isValid, parseISO } from "date-fns";

const MIN_YEAR = 1000;

/** ISO string is missing, invalid, or a sentinel like DateTime.MinValue (year 0001). */
export function isMeaningfulIsoDate(value: unknown): value is string {
    if (value == null || value === "") return false;
    const s = typeof value === "string" ? value : String(value);
    const d = parseISO(s);
    if (!isValid(d)) return false;
    return d.getUTCFullYear() >= MIN_YEAR;
}
