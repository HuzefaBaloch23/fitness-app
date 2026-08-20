import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { usePalette, space, type } from '../../src/theme';
import {
  Screen,
  Field,
  PrimaryButton,
  SectionTitle,
  StatTile,
  Empty,
  Row,
  Segmented,
} from '../../src/components/ui';
import { logGym, gymSince, deleteGym, cacheSteps, type GymSession } from '../../src/db/health';
import { toDayKey, daysAgoKey, startOfWeekKey } from '../../src/lib/day';

const WEEKLY_TARGET = 5;

const SESSION_TYPES = [
  { value: 'Push', label: 'Push' },
  { value: 'Pull', label: 'Pull' },
  { value: 'Legs', label: 'Legs' },
  { value: 'Full body', label: 'Full body' },
  { value: 'Cardio', label: 'Cardio' },
];

export default function GymScreen() {
  const p = usePalette();

  const [sessions, setSessions] = useState<GymSession[]>([]);
  const [kind, setKind] = useState('Push');
  const [minutes, setMinutes] = useState('');
  const [steps, setSteps] = useState<number | null>(null);
  const [stepsError, setStepsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setSessions(await gymSince(daysAgoKey(30)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Steps come straight from the phone's motion chip - no wearable needed.
  useEffect(() => {
    (async () => {
      try {
        if (!(await Pedometer.isAvailableAsync())) {
          setStepsError('This phone does not report step data');
          return;
        }
        const permission = await Pedometer.requestPermissionsAsync();
        if (!permission.granted) {
          setStepsError('Motion access denied - enable it in Settings to see steps');
          return;
        }

        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const result = await Pedometer.getStepCountAsync(start, new Date());
        setSteps(result.steps);
        await cacheSteps(toDayKey(), result.steps);
      } catch {
        setStepsError('Step data unavailable');
      }
    })();
  }, []);

  const save = async () => {
    await logGym(toDayKey(), kind, minutes ? Number(minutes) : null);
    setMinutes('');
    await load();
  };

  const weekStart = startOfWeekKey();
  const thisWeek = sessions.filter((s) => s.day >= weekStart);

  return (
    <Screen title="Gym" subtitle="Training and movement">
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <StatTile
          label="THIS WEEK"
          value={`${thisWeek.length} / ${WEEKLY_TARGET}`}
          hint="sessions"
          tone={thisWeek.length >= WEEKLY_TARGET ? 'good' : undefined}
        />
        <StatTile
          label="STEPS TODAY"
          value={steps != null ? steps.toLocaleString() : '--'}
          hint={stepsError ?? 'from your phone'}
        />
      </View>

      <SectionTitle>LOG A SESSION</SectionTitle>
      <Segmented value={kind} onChange={setKind} options={SESSION_TYPES} />
      <Field
        label="How long (optional)"
        value={minutes}
        onChangeText={setMinutes}
        placeholder="60"
        suffix="min"
      />
      <PrimaryButton label={`Log ${kind.toLowerCase()} session`} onPress={save} />

      <Text style={[type.label, { color: p.textFaint, marginTop: space.md }]}>
        Training is what tells your body to put the extra calories into muscle rather than fat.
        Without it a surplus is just a surplus.
      </Text>

      <SectionTitle>RECENT SESSIONS</SectionTitle>
      {sessions.length === 0 ? (
        <Empty text="No sessions logged yet" />
      ) : (
        sessions.map((s) => (
          <Row
            key={s.id}
            left={s.label ?? 'Session'}
            sub={s.day === toDayKey() ? 'Today' : s.day}
            right={s.minutes ? `${s.minutes} min` : ''}
            onLongPress={async () => {
              await deleteGym(s.id);
              await load();
            }}
          />
        ))
      )}
      {sessions.length > 0 && (
        <Text style={[type.label, { color: p.textFaint, marginTop: space.xs }]}>
          Long-press a session to delete it.
        </Text>
      )}
    </Screen>
  );
}
