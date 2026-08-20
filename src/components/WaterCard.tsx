import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette, radius, space, type } from '../theme';

type Props = {
  glasses: number;
  goal: number;
  onChange: (delta: number) => void;
};

export function WaterCard({ glasses, goal, onChange }: Props) {
  const p = usePalette();
  const done = glasses >= goal;

  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
      <View style={styles.head}>
        <View style={styles.title}>
          <Ionicons name="water-outline" size={16} color={p.accent} />
          <Text style={[type.caption, { color: p.textDim }]}>WATER</Text>
        </View>
        <Text style={[type.label, { color: done ? p.accent : p.textDim }]}>
          {glasses} / {goal} glasses
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.pips}>
          {Array.from({ length: goal }, (_, i) => (
            <View
              key={i}
              style={[
                styles.pip,
                { backgroundColor: i < glasses ? p.accent : p.track },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          <Pressable
            onPress={() => onChange(-1)}
            hitSlop={8}
            style={[styles.btn, { backgroundColor: p.track }]}
          >
            <Ionicons name="remove" size={18} color={p.text} />
          </Pressable>
          <Pressable
            onPress={() => onChange(1)}
            hitSlop={8}
            style={[styles.btn, { backgroundColor: p.accent }]}
          >
            <Ionicons name="add" size={18} color={p.accentText} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space.lg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
    gap: space.md,
  },
  pips: { flexDirection: 'row', gap: 5, flex: 1, flexWrap: 'wrap' },
  pip: { width: 14, height: 22, borderRadius: 4 },
  buttons: { flexDirection: 'row', gap: space.sm },
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
