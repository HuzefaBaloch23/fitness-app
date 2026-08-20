/**
 * Calorie targets for a weight-gain plan.
 *
 * BMR uses Mifflin-St Jeor, the equation with the best track record for
 * people who are not athletes. Everything downstream is a multiplier on it.
 */

export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: 'Desk job, little exercise',
  light: 'Light exercise 1-3 days a week',
  moderate: 'Gym 3-5 days a week',
  active: 'Gym 6-7 days a week',
  very_active: 'Hard training or physical job',
};

/** Energy in one kg of body mass. The usual working figure. */
export const KCAL_PER_KG = 7700;

/**
 * Fastest weekly gain worth aiming for. Above this the extra weight is
 * mostly fat, and appetite stops cooperating.
 */
export const SUSTAINABLE_KG_PER_WEEK = 0.5;

export type Profile = {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  targetWeightKg: number;
  targetDateIso: string;
};

export function bmr(p: Pick<Profile, 'sex' | 'ageYears' | 'heightCm' | 'weightKg'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.ageYears;
  return p.sex === 'male' ? base + 5 : base - 161;
}

/** Maintenance calories - what holds your weight steady. */
export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_MULTIPLIER[p.activity];
}

export function weeksUntil(targetDateIso: string, from = new Date()): number {
  const ms = new Date(targetDateIso).getTime() - from.getTime();
  return Math.max(ms / (1000 * 60 * 60 * 24 * 7), 0.1);
}

export type Plan = {
  maintenance: number;
  /** What the goal literally demands, however unrealistic. */
  stretchTarget: number;
  stretchKgPerWeek: number;
  /** A rate the body can actually deliver, and the one we show daily. */
  realisticTarget: number;
  realisticKgPerWeek: number;
  /** Where the realistic rate lands you on the target date. */
  projectedWeightKg: number;
  weeksLeft: number;
  /** True when the stated goal needs a faster gain than is sensible. */
  goalIsAggressive: boolean;
};

export function buildPlan(p: Profile, now = new Date()): Plan {
  const maintenance = tdee(p);
  const weeksLeft = weeksUntil(p.targetDateIso, now);
  const kgToGain = Math.max(p.targetWeightKg - p.weightKg, 0);

  const stretchKgPerWeek = kgToGain / weeksLeft;
  const realisticKgPerWeek = Math.min(stretchKgPerWeek, SUSTAINABLE_KG_PER_WEEK);

  const dailySurplus = (kgPerWeek: number) => (kgPerWeek * KCAL_PER_KG) / 7;

  return {
    maintenance: Math.round(maintenance),
    stretchTarget: Math.round(maintenance + dailySurplus(stretchKgPerWeek)),
    stretchKgPerWeek: round1(stretchKgPerWeek),
    realisticTarget: Math.round(maintenance + dailySurplus(realisticKgPerWeek)),
    realisticKgPerWeek: round1(realisticKgPerWeek),
    projectedWeightKg: round1(p.weightKg + realisticKgPerWeek * weeksLeft),
    weeksLeft: Math.round(weeksLeft),
    goalIsAggressive: stretchKgPerWeek > SUSTAINABLE_KG_PER_WEEK,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * Protein target in grams. 1.6 g per kg of bodyweight is the point where the
 * research stops showing extra muscle for extra protein. On a gain plan this is
 * what decides whether the weight arriving is muscle or fat.
 */
export const PROTEIN_G_PER_KG = 1.6;

export function proteinTarget(weightKg: number): number {
  return Math.round(weightKg * PROTEIN_G_PER_KG);
}

/** Glasses of water per day, nudged up because a big eating plan needs more. */
export const WATER_GLASSES_TARGET = 10;
