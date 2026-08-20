import { getDb } from './index';
import { toDayKey, isSlotActiveOn, timeToMinutes } from '../lib/day';
import type { ActivityLevel, Sex } from '../lib/nutrition';

export type ProfileRow = {
  id: 1;
  sex: Sex;
  age_years: number;
  height_cm: number;
  start_weight_kg: number;
  target_weight_kg: number;
  target_date: string;
  activity: ActivityLevel;
  started_on: string;
  use_stretch: number;
};

export type PlanSlot = {
  id: number;
  time_of_day: string;
  label: string;
  target_kcal: number;
  target_protein_g: number | null;
  days_mask: number;
  sort_order: number;
  archived: number;
};

export type MealLog = {
  id: number;
  day: string;
  slot_id: number | null;
  label: string;
  kcal: number;
  protein_g: number | null;
  status: 'eaten' | 'skipped';
  logged_at: string;
};

export type MealStatus = 'eaten' | 'skipped' | 'due' | 'upcoming' | 'missed';

export type TimelineEntry = {
  slot: PlanSlot | null;
  log: MealLog | null;
  label: string;
  kcal: number;
  time: string | null;
  status: MealStatus;
};

export async function getProfile(): Promise<ProfileRow | null> {
  const db = await getDb();
  return db.getFirstAsync<ProfileRow>('SELECT * FROM profile WHERE id = 1');
}

export async function saveProfile(p: Omit<ProfileRow, 'id' | 'started_on'> & { started_on?: string }): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO profile (id, sex, age_years, height_cm, start_weight_kg, target_weight_kg,
                          target_date, activity, started_on, use_stretch)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       sex = excluded.sex, age_years = excluded.age_years, height_cm = excluded.height_cm,
       start_weight_kg = excluded.start_weight_kg, target_weight_kg = excluded.target_weight_kg,
       target_date = excluded.target_date, activity = excluded.activity,
       use_stretch = excluded.use_stretch`,
    [
      p.sex,
      p.age_years,
      p.height_cm,
      p.start_weight_kg,
      p.target_weight_kg,
      p.target_date,
      p.activity,
      p.started_on ?? toDayKey(),
      p.use_stretch,
    ],
  );
}

export async function listSlots(): Promise<PlanSlot[]> {
  const db = await getDb();
  return db.getAllAsync<PlanSlot>(
    'SELECT * FROM plan_slots WHERE archived = 0 ORDER BY time_of_day ASC',
  );
}

export async function getSlot(id: number): Promise<PlanSlot | null> {
  const db = await getDb();
  return db.getFirstAsync<PlanSlot>('SELECT * FROM plan_slots WHERE id = ?', [id]);
}

export type SlotDraft = {
  time_of_day: string;
  label: string;
  target_kcal: number;
  target_protein_g: number;
  days_mask: number;
};

export async function upsertSlot(draft: SlotDraft, id?: number): Promise<void> {
  const db = await getDb();

  if (id != null) {
    await db.runAsync(
      `UPDATE plan_slots SET time_of_day = ?, label = ?, target_kcal = ?,
                             target_protein_g = ?, days_mask = ?
       WHERE id = ?`,
      [draft.time_of_day, draft.label, draft.target_kcal, draft.target_protein_g, draft.days_mask, id],
    );
    return;
  }

  await db.runAsync(
    `INSERT INTO plan_slots (time_of_day, label, target_kcal, target_protein_g, days_mask, sort_order)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [draft.time_of_day, draft.label, draft.target_kcal, draft.target_protein_g, draft.days_mask],
  );
}

/**
 * Archived rather than deleted, so past days keep showing what the meal was
 * called when you ate it.
 */
export async function archiveSlot(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE plan_slots SET archived = 1 WHERE id = ?', [id]);
}

export async function getLogsForDay(day: string): Promise<MealLog[]> {
  const db = await getDb();
  return db.getAllAsync<MealLog>('SELECT * FROM meal_logs WHERE day = ? ORDER BY logged_at', [day]);
}

/**
 * Merges the plan with what actually happened, and works out the state of each
 * meal. Exactly one entry can be 'due' - the earliest unlogged slot whose time
 * has passed. Later unlogged slots stay 'upcoming' so the day reads forward.
 */
export function buildTimeline(
  slots: PlanSlot[],
  logs: MealLog[],
  now: Date = new Date(),
): TimelineEntry[] {
  const today = slots.filter((s) => isSlotActiveOn(s.days_mask, now));
  const bySlot = new Map(logs.filter((l) => l.slot_id != null).map((l) => [l.slot_id!, l]));
  const nowMins = now.getHours() * 60 + now.getMinutes();

  let dueTaken = false;

  const planned: TimelineEntry[] = today.map((slot) => {
    const log = bySlot.get(slot.id) ?? null;
    let status: MealStatus;

    if (log) {
      status = log.status;
    } else if (timeToMinutes(slot.time_of_day) <= nowMins) {
      status = dueTaken ? 'missed' : 'due';
      dueTaken = true;
    } else {
      status = 'upcoming';
    }

    return {
      slot,
      log,
      label: slot.label,
      kcal: log?.kcal ?? slot.target_kcal,
      time: slot.time_of_day,
      status,
    };
  });

  const adHoc: TimelineEntry[] = logs
    .filter((l) => l.slot_id == null)
    .map((l) => ({
      slot: null,
      log: l,
      label: l.label,
      kcal: l.kcal,
      time: null,
      status: l.status,
    }));

  return [...planned, ...adHoc];
}

export async function logSlot(
  day: string,
  slot: PlanSlot,
  status: 'eaten' | 'skipped',
  kcal?: number,
): Promise<void> {
  const db = await getDb();
  const skipped = status === 'skipped';
  await db.runAsync(
    `INSERT INTO meal_logs (day, slot_id, label, kcal, protein_g, status, logged_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(day, slot_id) DO UPDATE SET
       status = excluded.status, kcal = excluded.kcal,
       protein_g = excluded.protein_g, logged_at = excluded.logged_at`,
    [
      day,
      slot.id,
      slot.label,
      skipped ? 0 : (kcal ?? slot.target_kcal),
      skipped ? 0 : (slot.target_protein_g ?? 0),
      status,
      new Date().toISOString(),
    ],
  );
}

export async function undoSlot(day: string, slotId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM meal_logs WHERE day = ? AND slot_id = ?', [day, slotId]);
}

export async function addAdHoc(
  day: string,
  label: string,
  kcal: number,
  proteinG = 0,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO meal_logs (day, slot_id, label, kcal, protein_g, status, logged_at)
     VALUES (?, NULL, ?, ?, ?, 'eaten', ?)`,
    [day, label, kcal, proteinG, new Date().toISOString()],
  );
  // Insert-then-update rather than an upsert: safe to run concurrently, and it
  // does not care whether the row already exists.
  await db.runAsync(
    `INSERT OR IGNORE INTO foods (name, kcal, protein_g, times_used) VALUES (?, ?, ?, 0)`,
    [label, kcal, proteinG],
  );
  await db.runAsync('UPDATE foods SET times_used = times_used + 1 WHERE name = ?', [label]);
}

export type FoodRow = {
  id: number;
  name: string;
  kcal: number;
  protein_g: number | null;
  serving: string | null;
  category: string | null;
  times_used: number;
};

/**
 * Matches on name or alias, so "anda" finds Egg and "chawal" finds Rice.
 * Foods you actually eat float to the top ahead of the shipped catalogue.
 */
export async function searchFoods(term: string, limit = 25): Promise<FoodRow[]> {
  const db = await getDb();
  const q = `%${term.trim().toLowerCase()}%`;

  if (!term.trim()) {
    return db.getAllAsync<FoodRow>(
      `SELECT id, name, kcal, protein_g, serving, category, times_used FROM foods
       ORDER BY times_used DESC, name ASC LIMIT ?`,
      [limit],
    );
  }

  return db.getAllAsync<FoodRow>(
    `SELECT id, name, kcal, protein_g, serving, category, times_used FROM foods
     WHERE lower(name) LIKE ? OR lower(COALESCE(aliases, '')) LIKE ?
     ORDER BY times_used DESC,
              CASE WHEN lower(name) LIKE ? THEN 0 ELSE 1 END,
              length(name) ASC
     LIMIT ?`,
    [q, q, `${term.trim().toLowerCase()}%`, limit],
  );
}

let seedingCatalog: Promise<void> | null = null;

/**
 * Seeds the shipped food list. Guarded by a module-level promise because React
 * runs startup effects twice in development, and two concurrent seeds on one
 * SQLite connection trip over each other.
 */
export function seedFoodCatalogIfEmpty(): Promise<void> {
  if (!seedingCatalog) seedingCatalog = doSeedCatalog();
  return seedingCatalog;
}

async function doSeedCatalog(): Promise<void> {
  const db = await getDb();
  const { FOOD_CATALOG } = await import('../data/foodCatalog');

  for (const f of FOOD_CATALOG) {
    // INSERT OR IGNORE adds it once; the UPDATE refreshes catalogue rows when
    // values change between app versions. Foods you typed in (is_catalog = 0)
    // are left alone so your own numbers are never overwritten.
    await db.runAsync(
      `INSERT OR IGNORE INTO foods (name, kcal, protein_g, serving, aliases, category, is_catalog, times_used)
       VALUES (?, ?, ?, ?, ?, ?, 1, 0)`,
      [f.name, f.kcal, f.proteinG, f.serving, f.aliases ?? null, f.category],
    );
    await db.runAsync(
      `UPDATE foods SET kcal = ?, protein_g = ?, serving = ?, aliases = ?, category = ?
       WHERE name = ? AND is_catalog = 1`,
      [f.kcal, f.proteinG, f.serving, f.aliases ?? null, f.category, f.name],
    );
  }
}

export async function deleteLog(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM meal_logs WHERE id = ?', [id]);
}

export type DayTotals = { kcal: number; proteinG: number };

export async function consumedOn(day: string): Promise<DayTotals> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ kcal: number | null; protein: number | null }>(
    `SELECT SUM(kcal) AS kcal, SUM(COALESCE(protein_g, 0)) AS protein
     FROM meal_logs WHERE day = ? AND status = 'eaten'`,
    [day],
  );
  return { kcal: row?.kcal ?? 0, proteinG: Math.round(row?.protein ?? 0) };
}

export async function getWaterGlasses(day: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ glasses: number }>(
    'SELECT glasses FROM water_log WHERE day = ?',
    [day],
  );
  return row?.glasses ?? 0;
}

export async function setWaterGlasses(day: string, glasses: number): Promise<void> {
  const db = await getDb();
  const clamped = Math.max(0, Math.min(glasses, 30));
  await db.runAsync(
    `INSERT INTO water_log (day, glasses) VALUES (?, ?)
     ON CONFLICT(day) DO UPDATE SET glasses = excluded.glasses`,
    [day, clamped],
  );
}

export async function latestWeight(): Promise<{ day: string; weight_kg: number } | null> {
  const db = await getDb();
  return db.getFirstAsync<{ day: string; weight_kg: number }>(
    'SELECT day, weight_kg FROM weight_entries ORDER BY day DESC LIMIT 1',
  );
}

export async function logWeight(day: string, kg: number): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO weight_entries (day, weight_kg, logged_at) VALUES (?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET weight_kg = excluded.weight_kg, logged_at = excluded.logged_at`,
    [day, kg, new Date().toISOString()],
  );
}

export async function weightHistory(limit = 90): Promise<{ day: string; weight_kg: number }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ day: string; weight_kg: number }>(
    'SELECT day, weight_kg FROM weight_entries ORDER BY day DESC LIMIT ?',
    [limit],
  );
  return rows.reverse();
}

export const SNOOZE_MINUTES = 20;

export async function snoozeSlot(day: string, slotId: number, minutes = SNOOZE_MINUTES): Promise<void> {
  const db = await getDb();
  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  await db.runAsync(
    `INSERT INTO snoozes (day, slot_id, until) VALUES (?, ?, ?)
     ON CONFLICT(day, slot_id) DO UPDATE SET until = excluded.until`,
    [day, slotId, until],
  );
}

export async function getSnoozes(day: string): Promise<Map<number, Date>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ slot_id: number; until: string }>(
    'SELECT slot_id, until FROM snoozes WHERE day = ?',
    [day],
  );
  return new Map(rows.map((r) => [r.slot_id, new Date(r.until)]));
}

/** The plan from the Figma screens, used as a starting point on first launch. */
const DEFAULT_PLAN: Array<Omit<PlanSlot, 'id' | 'archived'>> = [
  { time_of_day: '07:00', label: 'Anda + Paratha', target_kcal: 420, target_protein_g: 18, days_mask: 127, sort_order: 0 },
  { time_of_day: '10:00', label: 'Juice + Banana', target_kcal: 280, target_protein_g: 4, days_mask: 127, sort_order: 1 },
  { time_of_day: '13:00', label: 'Lunch (Dal, Rice, Chicken)', target_kcal: 640, target_protein_g: 38, days_mask: 127, sort_order: 2 },
  { time_of_day: '16:00', label: 'Protein Shake + Peanut Butter Toast', target_kcal: 550, target_protein_g: 38, days_mask: 127, sort_order: 3 },
  { time_of_day: '20:00', label: 'Dinner (Biryani, Raita, Salad)', target_kcal: 710, target_protein_g: 35, days_mask: 127, sort_order: 4 },
];

let seedingPlan: Promise<void> | null = null;

/** Same double-run guard as the food catalogue - two callers, one seed. */
export function seedDefaultPlanIfEmpty(): Promise<void> {
  if (!seedingPlan) seedingPlan = doSeedPlan();
  return seedingPlan;
}

async function doSeedPlan(): Promise<void> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM plan_slots');
  if ((row?.n ?? 0) > 0) return;

  for (const s of DEFAULT_PLAN) {
    await db.runAsync(
      `INSERT INTO plan_slots (time_of_day, label, target_kcal, target_protein_g, days_mask, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [s.time_of_day, s.label, s.target_kcal, s.target_protein_g, s.days_mask, s.sort_order],
    );
  }
}
