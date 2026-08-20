import { View, Text, StyleSheet } from 'react-native';
import { usePalette, radius, space, type } from '../theme';

type Props = {
  consumed: number;
  target: number;
  protein: number;
  proteinGoal: number;
};

/**
 * The headline number is what is LEFT to eat, not what has been eaten.
 * On a gain plan the gap is the thing you act on.
 */
export function EnergyCard({ consumed, target, protein, proteinGoal }: Props) {
  const p = usePalette();
  const remaining = Math.max(target - consumed, 0);
  const over = consumed > target;
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  const proteinPct = proteinGoal > 0 ? Math.min(protein / proteinGoal, 1) : 0;
  const proteinHit = proteinGoal > 0 && protein >= proteinGoal;

  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }]}>
      <Text style={[type.caption, styles.kicker, { color: p.textDim }]}>DAILY ENERGY TRACKER</Text>

      <View style={styles.headline}>
        <Text style={[type.hero, { color: p.accent }]}>
          {over ? '+' : ''}
          {(over ? consumed - target : remaining).toLocaleString()}
        </Text>
        <Text style={[type.heading, styles.unit, { color: p.text }]}>
          {over ? 'kcal over target' : 'kcal remaining'}
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: p.track }]}>
        <View
          style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: p.accent }]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[type.label, { color: p.textDim }]}>
          {consumed.toLocaleString()} kcal consumed
        </Text>
        <Text style={[type.label, { color: p.textDim }]}>
          {target.toLocaleString()} target
        </Text>
      </View>

      {proteinGoal > 0 && (
        <View style={[styles.protein, { borderTopColor: p.border }]}>
          <View style={styles.footer}>
            <Text style={[type.label, { color: p.textDim }]}>Protein</Text>
            <Text style={[type.label, { color: proteinHit ? p.accent : p.textDim }]}>
              {protein} / {proteinGoal} g
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: p.track, marginTop: space.sm }]}>
            <View
              style={[
                styles.fill,
                { width: `${proteinPct * 100}%`, backgroundColor: proteinHit ? p.accent : p.warning },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: space.lg,
  },
  kicker: { marginBottom: space.sm },
  headline: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  unit: { marginLeft: space.sm },
  track: {
    height: 6,
    borderRadius: radius.pill,
    marginTop: space.lg,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: radius.pill },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  protein: {
    borderTopWidth: 1,
    marginTop: space.lg,
    paddingTop: space.sm,
  },
});
