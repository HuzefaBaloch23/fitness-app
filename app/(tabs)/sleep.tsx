import { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { usePalette, space, type } from '../../src/theme';
import {
  Screen,
  Card,
  Field,
  PrimaryButton,
  SectionTitle,
  StatTile,
  Empty,
  Segmented,
} from '../../src/components/ui';
import { TrendChart } from '../../src/components/TrendChart';
import { getSleep, logSleep, sleepHistory, type SleepEntry } from '../../src/db/health';
import { toDayKey, formatMinutes, weekdayName } from '../../src/lib/day';

/** Below this you are running a deficit that blunts both appetite and recovery. */
const TARGET_MINUTES = 8 * 60;
const MIN_ACCEPTABLE = 7 * 60;

export default function SleepScreen() {
  const p = usePalette();

  const [history, setHistory] = useState<SleepEntry[]>([]);
  const [today, setToday] = useState<SleepEntry | null>(null);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [range, setRange] = useState<'week' | 'month'>('week');

  const load = useCallback(async () => {
    setHistory(await sleepHistory(30));
    setToday(await getSleep(toDayKey()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async () => {
    const total = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
    if (total <= 0) return;
    await logSleep(toDayKey(), total);
    setHours('');
    setMinutes('');
    await load();
  };

  const shown = range === 'week' ? history.slice(-7) : history;
  const avg = shown.length
    ? Math.round(shown.reduce((s, e) => s + e.minutes, 0) / shown.length)
    : 0;
  const goodNights = shown.filter((e) => e.minutes >= MIN_ACCEPTABLE).length;
  const debt = shown.reduce((s, e) => s + Math.max(TARGET_MINUTES - e.minutes, 0), 0);

  return (
    <Screen title="Sleep" subtitle={`${weekdayName()} · target 8 hours`}>
      <Card>
        {today ? (
          <>
            <Text style={[type.caption, { color: p.textDim }]}>LAST NIGHT</Text>
            <Text style={[type.hero, { color: today.minutes >= MIN_ACCEPTABLE ? p.accent : p.warning, marginTop: 4 }]}>
              {formatMinutes(today.minutes)}
            </Text>
            <Text style={[type.label, { color: p.textDim }]}>
              {today.minutes >= TARGET_MINUTES
                ? 'Full target hit'
                : today.minutes >= MIN_ACCEPTABLE
                  ? `${formatMinutes(TARGET_MINUTES - today.minutes)} short of 8h, but acceptable`
                  : `${formatMinutes(MIN_ACCEPTABLE - today.minutes)} below the 7h minimum`}
            </Text>
          </>
        ) : (
          <>
            <Text style={[type.caption, { color: p.textDim }]}>LAST NIGHT</Text>
            <Text style={[type.body, { color: p.textDim, marginTop: space.sm }]}>
              Not logged yet. Add it below.
            </Text>
          </>
        )}
      </Card>

      <SectionTitle>LOG LAST NIGHT</SectionTitle>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Field label="Hours" value={hours} onChangeText={setHours} placeholder="7" suffix="h" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Minutes" value={minutes} onChangeText={setMinutes} placeholder="30" suffix="m" />
        </View>
      </View>
      <PrimaryButton label="Save sleep" onPress={save} disabled={!hours && !minutes} />

      <SectionTitle>TREND</SectionTitle>
      <Segmented
        value={range}
        onChange={setRange}
        options={[
          { value: 'week', label: 'This week' },
          { value: 'month', label: 'Month' },
        ]}
      />

      <Card>
        <TrendChart
          points={shown.map((e) => e.minutes / 60)}
          targetLine={8}
          height={130}
          startLabel={shown.length ? shown[0].day : undefined}
          endLabel={shown.length ? shown[shown.length - 1].day : undefined}
        />
      </Card>

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
        <StatTile
          label="AVERAGE"
          value={avg ? formatMinutes(avg) : '--'}
          hint={avg >= MIN_ACCEPTABLE ? 'on target' : 'below target'}
          tone={avg >= MIN_ACCEPTABLE ? 'good' : 'bad'}
        />
        <StatTile
          label="GOOD NIGHTS"
          value={`${goodNights} / ${shown.length || 0}`}
          hint="7h or more"
        />
      </View>

      {debt > 0 && (
        <Text style={[type.label, { color: p.textDim, marginTop: space.md }]}>
          You are {formatMinutes(debt)} short of target across this period. Sleep debt suppresses
          appetite and recovery, which on a gain plan works directly against you.
        </Text>
      )}

      {shown.length === 0 && <Empty text="No nights logged yet" />}
    </Screen>
  );
}
