import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getLogsForDay, getSnoozes, listSlots, type PlanSlot } from '../db/queries';
import { isSlotActiveOn, timeToMinutes, toDayKey } from './day';

export const MEAL_CATEGORY = 'meal-reminder';

/** How hard the app pushes: a reminder, then a nag every 15 min, four times. */
export const NAG_INTERVAL_MINUTES = 15;
export const NAG_COUNT = 4;

/** Two days of reminders are kept scheduled at any time. */
const DAYS_AHEAD = 2;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  if (status !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('meals', {
      name: 'Meal reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#14B8A6',
      // Keeps the reminder sitting in the tray instead of vanishing.
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  await Notifications.setNotificationCategoryAsync(MEAL_CATEGORY, [
    { identifier: 'ate', buttonTitle: 'Ate it', options: { opensAppToForeground: false } },
    { identifier: 'later', buttonTitle: 'Later', options: { opensAppToForeground: false } },
    { identifier: 'skip', buttonTitle: 'Skip', options: { opensAppToForeground: false } },
  ]);

  return true;
}

type Scheduled = { slot: PlanSlot; when: Date; nagIndex: number };

/**
 * Rebuilds the whole schedule from scratch. Cheaper than tracking individual
 * ids, and it means a logged meal silences its nags immediately.
 * Call on launch, on foreground, and after every log action.
 */
export async function syncMealNotifications(now: Date = new Date()): Promise<number> {
  const granted = (await Notifications.getPermissionsAsync()).status === 'granted';
  if (!granted) return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();

  const slots = await listSlots();
  const planned: Scheduled[] = [];

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    const dayKey = toDayKey(date);

    const logged = new Set(
      (await getLogsForDay(dayKey)).map((l) => l.slot_id).filter((id): id is number => id != null),
    );
    const snoozed = await getSnoozes(dayKey);

    for (const slot of slots) {
      if (!isSlotActiveOn(slot.days_mask, date)) continue;
      if (logged.has(slot.id)) continue;

      const base = new Date(date);
      const mins = timeToMinutes(slot.time_of_day);
      base.setHours(Math.floor(mins / 60), mins % 60, 0, 0);

      const holdUntil = snoozed.get(slot.id)?.getTime() ?? 0;

      for (let nag = 0; nag <= NAG_COUNT; nag++) {
        const when = new Date(base.getTime() + nag * NAG_INTERVAL_MINUTES * 60_000);
        if (when.getTime() <= now.getTime()) continue;
        if (when.getTime() < holdUntil) continue;
        planned.push({ slot, when, nagIndex: nag });
      }

      // A snooze that outlasts every nag still deserves one final reminder.
      if (holdUntil > now.getTime() && holdUntil > base.getTime() + NAG_COUNT * NAG_INTERVAL_MINUTES * 60_000) {
        planned.push({ slot, when: new Date(holdUntil), nagIndex: 1 });
      }
    }
  }

  for (const item of planned) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: item.nagIndex === 0 ? `Time to eat - ${item.slot.label}` : `Still waiting: ${item.slot.label}`,
        body:
          item.nagIndex === 0
            ? `${item.slot.target_kcal} kcal. Tap when you've eaten.`
            : `${item.slot.target_kcal} kcal still unlogged. Did you eat?`,
        categoryIdentifier: MEAL_CATEGORY,
        data: { slotId: item.slot.id, day: toDayKey(item.when) },
        ...(Platform.OS === 'android' ? { sticky: item.nagIndex > 0 } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: item.when,
        ...(Platform.OS === 'android' ? { channelId: 'meals' } : {}),
      },
    });
  }

  return planned.length;
}

export async function cancelAll(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
