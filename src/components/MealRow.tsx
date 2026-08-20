import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePalette, radius, space, type } from '../theme';
import type { TimelineEntry } from '../db/queries';

type Props = {
  entry: TimelineEntry;
  onEat: () => void;
  onSkip: () => void;
  onLater: () => void;
  onUndo: () => void;
};

export function MealRow({ entry, onEat, onSkip, onLater, onUndo }: Props) {
  const p = usePalette();
  const isDue = entry.status === 'due' || entry.status === 'missed';

  return (
    <View style={styles.row}>
      <View style={styles.gutter}>
        {entry.time ? (
          <Text style={[type.label, { color: isDue ? p.accent : p.textDim }]}>{entry.time}</Text>
        ) : (
          <Ionicons name="add-circle-outline" size={16} color={p.textFaint} />
        )}
        {isDue && (
          <Text style={[type.caption, { color: p.accent, marginTop: 2 }]}>
            {entry.status === 'missed' ? 'MISSED' : 'NOW'}
          </Text>
        )}
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: p.card,
            borderColor: isDue ? p.accent : p.border,
            borderWidth: isDue ? 2 : 1,
            opacity: entry.status === 'upcoming' ? 0.55 : 1,
          },
        ]}
      >
        <View style={styles.cardHead}>
          <View style={styles.labelWrap}>
            <Text
              style={[
                type.body,
                {
                  color: p.text,
                  textDecorationLine: entry.status === 'skipped' ? 'line-through' : 'none',
                },
              ]}
            >
              {entry.label}
            </Text>
            <Text style={[type.label, { color: isDue ? p.accent : p.textDim, marginTop: 2 }]}>
              {entry.status === 'skipped'
                ? 'Skipped'
                : isDue
                  ? `Target: ${entry.kcal} kcal`
                  : `${entry.kcal} kcal`}
            </Text>
          </View>

          {entry.status === 'eaten' && (
            <Pressable onPress={onUndo} hitSlop={10}>
              <Ionicons name="checkmark-circle" size={22} color={p.accent} />
            </Pressable>
          )}
          {entry.status === 'skipped' && (
            <Pressable onPress={onUndo} hitSlop={10}>
              <Ionicons name="close-circle" size={22} color={p.textFaint} />
            </Pressable>
          )}
          {entry.status === 'upcoming' && (
            <Ionicons name="lock-closed-outline" size={16} color={p.textFaint} />
          )}
        </View>

        {isDue && (
          <View style={styles.actions}>
            <Pressable
              onPress={onEat}
              style={[styles.btn, styles.btnPrimary, { backgroundColor: p.accent }]}
            >
              <Text style={[type.label, { color: p.accentText }]}>Ate it</Text>
            </Pressable>
            <Pressable onPress={onLater} style={[styles.btn, { backgroundColor: p.track }]}>
              <Text style={[type.label, { color: p.text }]}>Later</Text>
            </Pressable>
            <Pressable onPress={onSkip} style={[styles.btn, { backgroundColor: p.track }]}>
              <Text style={[type.label, { color: p.textDim }]}>Skip</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: space.md },
  gutter: { width: 52, paddingTop: space.md, alignItems: 'flex-start' },
  card: { flex: 1, borderRadius: radius.md, padding: space.md },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start' },
  labelWrap: { flex: 1, paddingRight: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  btn: {
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.sm,
  },
  btnPrimary: { flexGrow: 0 },
});
