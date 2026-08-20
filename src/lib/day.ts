/** Local-time day helpers. Everything keyed by day uses YYYY-MM-DD in local time. */

export function toDayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday = 0, to match the days_mask bit order. */
export function weekdayIndex(d: Date = new Date()): number {
  return (d.getDay() + 6) % 7;
}

export function isSlotActiveOn(daysMask: number, d: Date = new Date()): boolean {
  return (daysMask & (1 << weekdayIndex(d))) !== 0;
}

/** "16:00" -> minutes since midnight. */
export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesSinceMidnight(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function formatTime(hhmm: string): string {
  return hhmm;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function weekdayName(d: Date = new Date()): string {
  return WEEKDAYS[d.getDay()];
}

/** "Monday, 17 August" - the weekday first, since the plan can differ by day. */
export function longDate(d: Date = new Date()): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.floor(ms / 86400000);
}

export function weeksBetweenNow(targetIso: string): number {
  return (new Date(targetIso).getTime() - Date.now()) / (86400000 * 7);
}

/** Day key N days back from today, for "last 7 days" style queries. */
export function daysAgoKey(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDayKey(d);
}

export function startOfWeekKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - weekdayIndex(d));
  d.setHours(0, 0, 0, 0);
  return toDayKey(d);
}

export function startOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export function startOfWeekIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - weekdayIndex(d));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
