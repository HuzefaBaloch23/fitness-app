import { getDb } from './index';
import { toDayKey } from '../lib/day';

/* ---------------------------------------------------------------- sleep --- */

export type SleepEntry = {
  day: string;
  minutes: number;
  bedtime: string | null;
  wake_time: string | null;
  source: string;
};

export async function logSleep(
  day: string,
  minutes: number,
  bedtime?: string,
  wake?: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sleep_entries (day, minutes, bedtime, wake_time, source)
     VALUES (?, ?, ?, ?, 'manual')
     ON CONFLICT(day) DO UPDATE SET
       minutes = excluded.minutes, bedtime = excluded.bedtime, wake_time = excluded.wake_time`,
    [day, Math.round(minutes), bedtime ?? null, wake ?? null],
  );
}

export async function getSleep(day: string): Promise<SleepEntry | null> {
  const db = await getDb();
  return db.getFirstAsync<SleepEntry>('SELECT * FROM sleep_entries WHERE day = ?', [day]);
}

export async function sleepHistory(days = 30): Promise<SleepEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SleepEntry>(
    'SELECT * FROM sleep_entries ORDER BY day DESC LIMIT ?',
    [days],
  );
  return rows.reverse();
}

/* ------------------------------------------------------------------ gym --- */

export type GymSession = {
  id: number;
  day: string;
  label: string | null;
  minutes: number | null;
  logged_at: string;
};

export async function logGym(day: string, label: string, minutes: number | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO gym_sessions (day, label, minutes, logged_at) VALUES (?, ?, ?, ?)',
    [day, label, minutes, new Date().toISOString()],
  );
}

export async function deleteGym(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM gym_sessions WHERE id = ?', [id]);
}

export async function gymSince(fromDay: string): Promise<GymSession[]> {
  const db = await getDb();
  return db.getAllAsync<GymSession>(
    'SELECT * FROM gym_sessions WHERE day >= ? ORDER BY day DESC, id DESC',
    [fromDay],
  );
}

/* ---------------------------------------------------------------- steps --- */

export async function cacheSteps(day: string, steps: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO step_counts (day, steps) VALUES (?, ?)
     ON CONFLICT(day) DO UPDATE SET steps = excluded.steps`,
    [day, Math.round(steps)],
  );
}

export async function stepsSince(fromDay: string): Promise<{ day: string; steps: number }[]> {
  const db = await getDb();
  return db.getAllAsync<{ day: string; steps: number }>(
    'SELECT day, steps FROM step_counts WHERE day >= ? ORDER BY day ASC',
    [fromDay],
  );
}

/* --------------------------------------------------------- measurements --- */

export type Measurement = {
  day: string;
  chest_cm: number | null;
  arm_cm: number | null;
  waist_cm: number | null;
  thigh_cm: number | null;
};

export async function logMeasurement(day: string, m: Omit<Measurement, 'day'>): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO measurements (day, chest_cm, arm_cm, waist_cm, thigh_cm, logged_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET
       chest_cm = excluded.chest_cm, arm_cm = excluded.arm_cm,
       waist_cm = excluded.waist_cm, thigh_cm = excluded.thigh_cm,
       logged_at = excluded.logged_at`,
    [day, m.chest_cm, m.arm_cm, m.waist_cm, m.thigh_cm, new Date().toISOString()],
  );
}

export async function measurementHistory(limit = 24): Promise<Measurement[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Measurement>(
    'SELECT day, chest_cm, arm_cm, waist_cm, thigh_cm FROM measurements ORDER BY day DESC LIMIT ?',
    [limit],
  );
  return rows;
}

/* ---------------------------------------------------------------- money --- */

export type Transaction = {
  id: number;
  occurred_at: string;
  amount: number;
  merchant: string | null;
  category: string | null;
  source: string;
};

export const EXPENSE_CATEGORIES = [
  'Food',
  'Groceries',
  'Gym',
  'Supplements',
  'Transport',
  'Bills',
  'Shopping',
  'Other',
];

export async function addTransaction(
  amount: number,
  merchant: string,
  category: string,
  occurredAt = new Date(),
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR IGNORE INTO transactions (occurred_at, amount, merchant, category, source, raw_text)
     VALUES (?, ?, ?, ?, 'manual', NULL)`,
    [occurredAt.toISOString(), amount, merchant, category],
  );
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function transactionsSince(fromIso: string): Promise<Transaction[]> {
  const db = await getDb();
  return db.getAllAsync<Transaction>(
    `SELECT id, occurred_at, amount, merchant, category, source
     FROM transactions WHERE occurred_at >= ? ORDER BY occurred_at DESC`,
    [fromIso],
  );
}

export async function spendTotal(fromIso: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) AS total FROM transactions WHERE occurred_at >= ?',
    [fromIso],
  );
  return row?.total ?? 0;
}

/* ------------------------------------------------------------ adherence --- */

/**
 * How many of the last N days hit at least `threshold` of their calorie target.
 * Consistency is the thing that actually moves weight, so it gets its own number.
 */
export async function calorieStreak(targetKcal: number, days = 7, threshold = 0.9): Promise<{
  hit: number;
  total: number;
}> {
  const db = await getDb();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));

  const rows = await db.getAllAsync<{ day: string; total: number }>(
    `SELECT day, SUM(kcal) AS total FROM meal_logs
     WHERE day >= ? AND status = 'eaten' GROUP BY day`,
    [toDayKey(from)],
  );

  const hit = rows.filter((r) => targetKcal > 0 && r.total >= targetKcal * threshold).length;
  return { hit, total: days };
}
