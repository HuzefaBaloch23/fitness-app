import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  buildTimeline,
  consumedOn,
  getLogsForDay,
  getProfile,
  listSlots,
  logSlot,
  undoSlot,
  addAdHoc,
  snoozeSlot,
  seedDefaultPlanIfEmpty,
  getWaterGlasses,
  setWaterGlasses,
  latestWeight,
  type PlanSlot,
  type TimelineEntry,
  type ProfileRow,
} from '../db/queries';
import { toDayKey, daysBetween } from '../lib/day';
import { buildPlan, proteinTarget, WATER_GLASSES_TARGET } from '../lib/nutrition';
import { syncMealNotifications } from '../lib/notifications';

export type TodayState = {
  loading: boolean;
  day: string;
  dayNumber: number;
  timeline: TimelineEntry[];
  consumed: number;
  target: number;
  protein: number;
  proteinGoal: number;
  water: number;
  waterGoal: number;
  profile: ProfileRow | null;
  addWater: (delta: number) => Promise<void>;
  eat: (slot: PlanSlot) => Promise<void>;
  skip: (slot: PlanSlot) => Promise<void>;
  later: (slot: PlanSlot) => Promise<void>;
  undo: (slotId: number) => Promise<void>;
  addExtra: (label: string, kcal: number) => Promise<void>;
  refresh: () => Promise<void>;
};

export function useToday(): TodayState {
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState(toDayKey());
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [consumed, setConsumed] = useState(0);
  const [target, setTarget] = useState(0);
  const [protein, setProtein] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [water, setWater] = useState(0);
  const [dayNumber, setDayNumber] = useState(1);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const refresh = useCallback(async () => {
    const today = toDayKey();
    setDay(today);

    await seedDefaultPlanIfEmpty();
    const [slots, logs, totals, prof, glasses, weighed] = await Promise.all([
      listSlots(),
      getLogsForDay(today),
      consumedOn(today),
      getProfile(),
      getWaterGlasses(today),
      latestWeight(),
    ]);

    setTimeline(buildTimeline(slots, logs));
    setConsumed(totals.kcal);
    setProtein(totals.proteinG);
    setWater(glasses);
    setProfile(prof);

    // Protein scales with what you weigh now, so it rises as you gain.
    const currentWeight = weighed?.weight_kg ?? prof?.start_weight_kg ?? 0;
    setProteinGoal(currentWeight > 0 ? proteinTarget(currentWeight) : 0);

    if (prof) {
      const plan = buildPlan({
        sex: prof.sex,
        ageYears: prof.age_years,
        heightCm: prof.height_cm,
        weightKg: prof.start_weight_kg,
        activity: prof.activity,
        targetWeightKg: prof.target_weight_kg,
        targetDateIso: prof.target_date,
      });
      setTarget(prof.use_stretch ? plan.stretchTarget : plan.realisticTarget);
      setDayNumber(daysBetween(prof.started_on, today) + 1);
    } else {
      // No profile yet - fall back to what the plan itself adds up to.
      setTarget(slots.reduce((sum, s) => sum + s.target_kcal, 0));
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return {
    loading,
    day,
    dayNumber,
    timeline,
    consumed,
    target,
    protein,
    proteinGoal,
    water,
    waterGoal: WATER_GLASSES_TARGET,
    profile,
    addWater: async (delta) => {
      const next = Math.max(0, water + delta);
      setWater(next);
      await setWaterGlasses(day, next);
    },
    eat: async (slot) => {
      await logSlot(day, slot, 'eaten');
      await refresh();
      await syncMealNotifications();
    },
    skip: async (slot) => {
      await logSlot(day, slot, 'skipped');
      await refresh();
      await syncMealNotifications();
    },
    later: async (slot) => {
      await snoozeSlot(day, slot.id);
      await refresh();
      await syncMealNotifications();
    },
    undo: async (slotId) => {
      await undoSlot(day, slotId);
      await refresh();
      await syncMealNotifications();
    },
    addExtra: async (label, kcal) => {
      await addAdHoc(day, label, kcal);
      await refresh();
    },
    refresh,
  };
}
