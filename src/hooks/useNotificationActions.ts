import { useEffect } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { listSlots, logSlot, snoozeSlot, seedDefaultPlanIfEmpty } from '../db/queries';
import { setupNotifications, syncMealNotifications } from '../lib/notifications';
import { toDayKey } from '../lib/day';

/**
 * Handles the three buttons on a meal reminder without opening the app, and
 * keeps the schedule fresh whenever the app comes back to the foreground.
 */
export function useNotificationActions(onChange?: () => void) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      await setupNotifications();
      // The plan must exist before there is anything to schedule.
      await seedDefaultPlanIfEmpty();
      if (!cancelled) await syncMealNotifications();
    })();

    const responseSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const data = response.notification.request.content.data as {
        slotId?: number;
        day?: string;
      };
      if (data?.slotId == null) return;

      const day = data.day ?? toDayKey();
      const slot = (await listSlots()).find((s) => s.id === data.slotId);
      if (!slot) return;

      switch (response.actionIdentifier) {
        case 'ate':
          await logSlot(day, slot, 'eaten');
          break;
        case 'skip':
          await logSlot(day, slot, 'skipped');
          break;
        case 'later':
          await snoozeSlot(day, slot.id);
          break;
        default:
          // Tapping the notification body just opens the app.
          return;
      }

      await syncMealNotifications();
      onChange?.();
    });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncMealNotifications();
    });

    return () => {
      cancelled = true;
      responseSub.remove();
      appStateSub.remove();
    };
  }, [onChange]);
}
