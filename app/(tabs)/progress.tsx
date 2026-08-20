import { useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { usePalette, space, type } from '../../src/theme';
import {
  Screen,
  Card,
  Kicker,
  Field,
  PrimaryButton,
  SectionTitle,
  StatTile,
  Empty,
} from '../../src/components/ui';
import { TrendChart } from '../../src/components/TrendChart';
import { getProfile, logWeight, weightHistory, type ProfileRow } from '../../src/db/queries';
import {
  calorieStreak,
  logMeasurement,
  measurementHistory,
  type Measurement,
} from '../../src/db/health';
import { buildPlan } from '../../src/lib/nutrition';
import { toDayKey, weeksBetweenNow } from '../../src/lib/day';

export default function ProgressScreen() {
  const p = usePalette();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [history, setHistory] = useState<{ day: string; weight_kg: number }[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [streak, setStreak] = useState({ hit: 0, total: 7 });

  const [newWeight, setNewWeight] = useState('');
  const [chest, setChest] = useState('');
  const [arm, setArm] = useState('');
  const [waist, setWaist] = useState('');

  const load = useCallback(async () => {
    const prof = await getProfile();
    setProfile(prof);
    setHistory(await weightHistory());
    setMeasurements(await measurementHistory());

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
      setStreak(await calorieStreak(prof.use_stretch ? plan.stretchTarget : plan.realisticTarget));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const saveWeight = async () => {
    const kg = Number(newWeight);
    if (!Number.isFinite(kg) || kg <= 0) return;
    await logWeight(toDayKey(), kg);
    setNewWeight('');
    await load();
  };

  const saveMeasurement = async () => {
    const num = (s: string) => (s.trim() === '' ? null : Number(s));
    if (!chest && !arm && !waist) return;
    await logMeasurement(toDayKey(), {
      chest_cm: num(chest),
      arm_cm: num(arm),
      waist_cm: num(waist),
      thigh_cm: null,
    });
    setChest('');
    setArm('');
    setWaist('');
    await load();
  };

  const current = history.length ? history[history.length - 1].weight_kg : profile?.start_weight_kg ?? 0;
  const start = profile?.start_weight_kg ?? current;
  const gained = round1(current - start);
  const remaining = profile ? round1(profile.target_weight_kg - current) : 0;
  const weeksLeft = profile ? Math.max(Math.round(weeksBetweenNow(profile.target_date)), 0) : 0;

  const lastWeek = history.length >= 2 ? weeklyChange(history) : null;

  return (
    <Screen title="Progress" subtitle="Weight and habits log">
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={[type.hero, { color: p.text }]}>{current || '--'}</Text>
            <Text style={[type.body, { color: p.textDim }]}> kg</Text>
          </View>
          {gained !== 0 && (
            <Text style={[type.label, { color: gained > 0 ? p.accent : p.danger }]}>
              {gained > 0 ? '+' : ''}
              {gained} kg since start
            </Text>
          )}
        </View>

        {profile && (
          <Text style={[type.label, { color: p.textDim, marginTop: 2 }]}>
            {remaining > 0 ? `${remaining} kg to go` : 'Target reached'} · {weeksLeft} weeks left
          </Text>
        )}

        <View style={{ marginTop: space.lg }}>
          <TrendChart
            points={history.map((h) => h.weight_kg)}
            targetLine={profile?.target_weight_kg}
            startLabel={history.length ? `${start} kg start` : undefined}
            endLabel={profile ? `${profile.target_weight_kg} kg target` : undefined}
          />
        </View>

        {lastWeek != null && (
          <Text style={[type.label, { color: p.textDim, marginTop: space.sm }]}>
            {lastWeek > 0 ? '+' : ''}
            {lastWeek} kg over the last 7 days
          </Text>
        )}
      </Card>

      <SectionTitle>LOG TODAY'S WEIGHT</SectionTitle>
      <Field
        label="Weigh yourself in the morning, before eating"
        value={newWeight}
        onChangeText={setNewWeight}
        placeholder={String(current || 50)}
        suffix="kg"
        allowDecimal
      />
      <PrimaryButton label="Save weight" onPress={saveWeight} disabled={!newWeight} />

      <SectionTitle>CONSISTENCY</SectionTitle>
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <StatTile
          label="CALORIES HIT"
          value={`${streak.hit} / ${streak.total}`}
          hint="days this week"
          tone={streak.hit >= 5 ? 'good' : 'bad'}
        />
        <StatTile
          label="WEIGH-INS"
          value={String(history.length)}
          hint="logged in total"
        />
      </View>
      <Text style={[type.label, { color: p.textFaint, marginTop: space.sm }]}>
        Hitting your calories five days out of seven beats hitting them perfectly for three and
        giving up.
      </Text>

      <SectionTitle>MEASUREMENTS</SectionTitle>
      <Text style={[type.label, { color: p.textDim, marginBottom: space.md }]}>
        Take these once a month. When the scale stalls, these keep moving.
      </Text>
      <Field label="Chest" value={chest} onChangeText={setChest} suffix="cm" allowDecimal />
      <Field label="Arm" value={arm} onChangeText={setArm} suffix="cm" allowDecimal />
      <Field label="Waist" value={waist} onChangeText={setWaist} suffix="cm" allowDecimal />
      <PrimaryButton
        label="Save measurements"
        onPress={saveMeasurement}
        disabled={!chest && !arm && !waist}
      />

      {measurements.length === 0 ? (
        <Empty text="Nothing measured yet" />
      ) : (
        <View style={{ marginTop: space.lg }}>
          {measurements.map((m) => (
            <Card key={m.day} style={{ marginBottom: space.sm, padding: space.md }}>
              <Kicker>{m.day}</Kicker>
              <Text style={[type.body, { color: p.text, marginTop: 4 }]}>
                {[
                  m.chest_cm ? `Chest ${m.chest_cm}` : null,
                  m.arm_cm ? `Arm ${m.arm_cm}` : null,
                  m.waist_cm ? `Waist ${m.waist_cm}` : null,
                ]
                  .filter(Boolean)
                  .join('  ·  ')}
              </Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function weeklyChange(history: { day: string; weight_kg: number }[]): number {
  const latest = history[history.length - 1];
  const cutoff = new Date(latest.day);
  cutoff.setDate(cutoff.getDate() - 7);
  const key = toDayKey(cutoff);

  const earlier = [...history].reverse().find((h) => h.day <= key) ?? history[0];
  return round1(latest.weight_kg - earlier.weight_kg);
}
