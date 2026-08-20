import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { usePalette, space, type } from '../src/theme';
import { Screen, Card, Field, Segmented, PrimaryButton, Kicker } from '../src/components/ui';
import { saveProfile, logWeight } from '../src/db/queries';
import { buildPlan, ACTIVITY_LABEL, type ActivityLevel, type Sex } from '../src/lib/nutrition';
import { toDayKey } from '../src/lib/day';

export default function Onboarding() {
  const p = usePalette();
  const router = useRouter();

  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [months, setMonths] = useState('5');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [useStretch, setUseStretch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nums = {
    age: Number(age),
    height: Number(height),
    weight: Number(weight),
    goal: Number(goalWeight),
    months: Number(months),
  };

  const complete =
    nums.age > 0 && nums.height > 0 && nums.weight > 0 && nums.goal > 0 && nums.months > 0;

  const targetDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + (nums.months || 1));
    return d;
  })();

  const plan = complete
    ? buildPlan({
        sex,
        ageYears: nums.age,
        heightCm: nums.height,
        weightKg: nums.weight,
        activity,
        targetWeightKg: nums.goal,
        targetDateIso: targetDate.toISOString(),
      })
    : null;

  const save = async () => {
    if (!complete) return setError('Fill in every field to get your numbers');
    if (nums.goal <= nums.weight) return setError('Target weight should be above your current weight');
    setError(null);

    await saveProfile({
      sex,
      age_years: nums.age,
      height_cm: nums.height,
      start_weight_kg: nums.weight,
      target_weight_kg: nums.goal,
      target_date: toDayKey(targetDate),
      activity,
      use_stretch: useStretch ? 1 : 0,
    });
    await logWeight(toDayKey(), nums.weight);
    router.replace('/(tabs)');
  };

  return (
    <Screen title="Set up your plan" subtitle="Answered once. Everything else is calculated from this.">
      <Segmented
        label="Sex"
        value={sex}
        onChange={setSex}
        options={[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ]}
      />

      <Field label="Age" value={age} onChangeText={setAge} placeholder="22" suffix="years" />
      <Field label="Height" value={height} onChangeText={setHeight} placeholder="170" suffix="cm" />
      <Field
        label="Current weight"
        value={weight}
        onChangeText={setWeight}
        placeholder="50"
        suffix="kg"
        allowDecimal
      />
      <Field
        label="Target weight"
        value={goalWeight}
        onChangeText={setGoalWeight}
        placeholder="70"
        suffix="kg"
        allowDecimal
      />
      <Field label="In how many months" value={months} onChangeText={setMonths} suffix="months" />

      <Segmented
        label="How active are you"
        value={activity}
        onChange={setActivity}
        options={[
          { value: 'sedentary', label: 'Desk job' },
          { value: 'light', label: 'Light' },
          { value: 'moderate', label: 'Gym 3-5x' },
          { value: 'active', label: 'Gym 6-7x' },
          { value: 'very_active', label: 'Very hard' },
        ]}
      />
      <Text style={[type.label, { color: p.textFaint, marginTop: -space.sm, marginBottom: space.lg }]}>
        {ACTIVITY_LABEL[activity]}
      </Text>

      {plan && (
        <Card>
          <Kicker>YOUR NUMBERS</Kicker>
          <Text style={[type.body, { color: p.textDim, marginTop: space.sm }]}>
            Maintenance is {plan.maintenance.toLocaleString()} kcal - that holds you steady.
          </Text>

          <View style={{ marginTop: space.lg, gap: space.sm }}>
            <Pick
              selected={!useStretch}
              onPress={() => setUseStretch(false)}
              title={`${plan.realisticTarget.toLocaleString()} kcal a day`}
              body={`Gains ${plan.realisticKgPerWeek} kg a week and reaches about ${plan.projectedWeightKg} kg. A pace the body can hold.`}
              badge="Recommended"
            />
            <Pick
              selected={useStretch}
              onPress={() => setUseStretch(true)}
              title={`${plan.stretchTarget.toLocaleString()} kcal a day`}
              body={`What hitting ${nums.goal} kg exactly on time demands: ${plan.stretchKgPerWeek} kg a week.`}
              badge={plan.goalIsAggressive ? 'Hard' : undefined}
            />
          </View>

          {plan.goalIsAggressive && (
            <Text style={[type.label, { color: p.warning, marginTop: space.md }]}>
              {nums.goal} kg in {nums.months} months needs {plan.stretchKgPerWeek} kg a week. Above
              roughly 0.5 kg a week most of the gain is fat rather than muscle.
            </Text>
          )}
        </Card>
      )}

      {error && (
        <Text style={[type.label, { color: p.danger, marginTop: space.md }]}>{error}</Text>
      )}

      <PrimaryButton label="Start" onPress={save} disabled={!complete} />
    </Screen>
  );
}

function Pick({
  selected,
  onPress,
  title,
  body,
  badge,
}: {
  selected: boolean;
  onPress: () => void;
  title: string;
  body: string;
  badge?: string;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? p.accent : p.border,
        borderRadius: 12,
        padding: space.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[type.body, { color: selected ? p.accent : p.text }]}>{title}</Text>
        {badge && (
          <Text style={[type.caption, { color: p.textFaint }]}>{badge.toUpperCase()}</Text>
        )}
      </View>
      <Text style={[type.label, { color: p.textDim, marginTop: 4 }]}>{body}</Text>
    </Pressable>
  );
}
