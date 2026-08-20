/**
 * One migration per schema version. Never edit a shipped migration - add a new
 * one, or existing installs will drift from fresh ones.
 */
export const MIGRATIONS: string[] = [
  `
  CREATE TABLE profile (
    id              INTEGER PRIMARY KEY CHECK (id = 1),
    sex             TEXT    NOT NULL,
    age_years       INTEGER NOT NULL,
    height_cm       REAL    NOT NULL,
    start_weight_kg REAL    NOT NULL,
    target_weight_kg REAL   NOT NULL,
    target_date     TEXT    NOT NULL,
    activity        TEXT    NOT NULL,
    started_on      TEXT    NOT NULL,
    use_stretch     INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE foods (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    kcal       INTEGER NOT NULL,
    protein_g  REAL,
    times_used INTEGER NOT NULL DEFAULT 0
  );

  -- A slot is a recurring meal in the daily plan: "07:00, Anda + Paratha, 420".
  -- days_mask is a 7-bit field, bit 0 = Monday, so a plan can differ by weekday.
  CREATE TABLE plan_slots (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    time_of_day TEXT    NOT NULL,
    label       TEXT    NOT NULL,
    target_kcal INTEGER NOT NULL,
    days_mask   INTEGER NOT NULL DEFAULT 127,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    archived    INTEGER NOT NULL DEFAULT 0
  );

  -- One row per meal per day. Ad-hoc food (the samosa) has slot_id NULL.
  CREATE TABLE meal_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    day        TEXT    NOT NULL,
    slot_id    INTEGER REFERENCES plan_slots(id) ON DELETE SET NULL,
    label      TEXT    NOT NULL,
    kcal       INTEGER NOT NULL,
    status     TEXT    NOT NULL DEFAULT 'eaten',
    logged_at  TEXT    NOT NULL,
    UNIQUE (day, slot_id)
  );

  CREATE INDEX idx_meal_logs_day ON meal_logs (day);

  CREATE TABLE weight_entries (
    day        TEXT PRIMARY KEY,
    weight_kg  REAL NOT NULL,
    logged_at  TEXT NOT NULL
  );

  CREATE TABLE sleep_entries (
    day         TEXT PRIMARY KEY,
    minutes     INTEGER NOT NULL,
    bedtime     TEXT,
    wake_time   TEXT,
    source      TEXT NOT NULL DEFAULT 'manual'
  );

  CREATE TABLE gym_sessions (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    day       TEXT NOT NULL,
    label     TEXT,
    minutes   INTEGER,
    logged_at TEXT NOT NULL
  );

  CREATE TABLE transactions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    occurred_at TEXT   NOT NULL,
    amount     REAL    NOT NULL,
    merchant   TEXT,
    category   TEXT,
    source     TEXT    NOT NULL DEFAULT 'manual',
    raw_text   TEXT,
    UNIQUE (occurred_at, amount, raw_text)
  );

  CREATE INDEX idx_tx_occurred ON transactions (occurred_at);
  `,

  `
  -- "Later" on a reminder: hold the nagging for this slot until a given time.
  CREATE TABLE snoozes (
    day        TEXT    NOT NULL,
    slot_id    INTEGER NOT NULL,
    until      TEXT    NOT NULL,
    PRIMARY KEY (day, slot_id)
  );
  `,

  `
  -- Foods gain a serving size, search aliases (roman Urdu), and a flag marking
  -- the ones that shipped with the app rather than being typed in.
  ALTER TABLE foods ADD COLUMN serving TEXT;
  ALTER TABLE foods ADD COLUMN aliases TEXT;
  ALTER TABLE foods ADD COLUMN category TEXT;
  ALTER TABLE foods ADD COLUMN is_catalog INTEGER NOT NULL DEFAULT 0;

  -- Earlier builds inserted a row per logging, so collapse repeats before the
  -- unique index goes on, otherwise this migration fails on existing installs.
  DELETE FROM foods WHERE id NOT IN (SELECT MIN(id) FROM foods GROUP BY name);

  CREATE UNIQUE INDEX idx_foods_name ON foods (name);
  `,

  `
  -- Protein is tracked alongside calories: calories decide whether weight goes
  -- on, protein decides how much of it is muscle.
  ALTER TABLE meal_logs ADD COLUMN protein_g REAL;
  ALTER TABLE plan_slots ADD COLUMN target_protein_g REAL;

  CREATE TABLE water_log (
    day     TEXT PRIMARY KEY,
    glasses INTEGER NOT NULL DEFAULT 0
  );
  `,

  `
  -- Tape-measure numbers. When the scale stalls for a week these are what show
  -- that something is still happening.
  CREATE TABLE measurements (
    day       TEXT PRIMARY KEY,
    chest_cm  REAL,
    arm_cm    REAL,
    waist_cm  REAL,
    thigh_cm  REAL,
    logged_at TEXT NOT NULL
  );

  -- Reminder slots gain a kind so supplements ride the same nagging engine as
  -- meals without polluting the calorie maths.
  ALTER TABLE plan_slots ADD COLUMN kind TEXT NOT NULL DEFAULT 'meal';

  -- Steps come from the phone; cached per day so history survives.
  CREATE TABLE step_counts (
    day   TEXT PRIMARY KEY,
    steps INTEGER NOT NULL
  );
  `,
];
