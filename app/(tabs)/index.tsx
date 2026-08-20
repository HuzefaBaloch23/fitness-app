import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePalette, space, type, radius } from '../../src/theme';
import { EnergyCard } from '../../src/components/EnergyCard';
import { MealRow } from '../../src/components/MealRow';
import { WaterCard } from '../../src/components/WaterCard';
import { useToday } from '../../src/hooks/useToday';
import { weekdayName, longDate } from '../../src/lib/day';

export default function TodayScreen() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const today = useToday();

  if (today.loading) {
    return (
      <View style={[styles.center, { backgroundColor: p.bg }]}>
        <ActivityIndicator color={p.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={{
        padding: space.lg,
        paddingTop: insets.top + space.md,
        paddingBottom: space.xxl,
      }}
    >
      <Text style={[type.title, { color: p.text }]}>{weekdayName()}</Text>
      <Text style={[type.body, { color: p.textDim, marginTop: 2 }]}>
        {longDate()} · Day {today.dayNumber} of gain phase
      </Text>

      <View style={{ marginTop: space.lg }}>
        <EnergyCard
          consumed={today.consumed}
          target={today.target}
          protein={today.protein}
          proteinGoal={today.proteinGoal}
        />
      </View>

      <View style={{ marginTop: space.md }}>
        <WaterCard
          glasses={today.water}
          goal={today.waterGoal}
          onChange={(d) => void today.addWater(d)}
        />
      </View>

      <View style={{ marginTop: space.xl }}>
        {today.timeline.map((entry, i) => (
          <MealRow
            key={entry.slot ? `slot-${entry.slot.id}` : `log-${entry.log?.id ?? i}`}
            entry={entry}
            onEat={() => entry.slot && void today.eat(entry.slot)}
            onSkip={() => entry.slot && void today.skip(entry.slot)}
            onLater={() => entry.slot && void today.later(entry.slot)}
            onUndo={() => entry.slot && void today.undo(entry.slot.id)}
          />
        ))}
      </View>

      <Pressable
        onPress={() => router.push('/add-food')}
        style={[styles.addBtn, { borderColor: p.border, backgroundColor: p.card }]}
      >
        <Ionicons name="add" size={18} color={p.accent} />
        <Text style={[type.label, { color: p.accent }]}>Add something else</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: space.md,
    marginTop: space.sm,
  },
});
