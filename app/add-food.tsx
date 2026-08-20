import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePalette, space, type, radius } from '../src/theme';
import { addAdHoc, searchFoods, type FoodRow } from '../src/db/queries';
import { toDayKey } from '../src/lib/day';

const QUANTITY_STEP = 0.5;

export default function AddFoodScreen() {
  const p = usePalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [term, setTerm] = useState('');
  const [results, setResults] = useState<FoodRow[]>([]);
  const [picked, setPicked] = useState<FoodRow | null>(null);
  const [qty, setQty] = useState(1);

  // Fields for a food the catalogue does not have yet.
  const [customKcal, setCustomKcal] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    searchFoods(term).then((rows) => alive && setResults(rows));
    return () => {
      alive = false;
    };
  }, [term]);

  const logPicked = async () => {
    if (!picked) return;
    const total = Math.round(picked.kcal * qty);
    const protein = Math.round((picked.protein_g ?? 0) * qty);
    const label = qty === 1 ? picked.name : `${picked.name} x${formatQty(qty)}`;
    await addAdHoc(toDayKey(), label, total, protein);
    router.back();
  };

  const logCustom = async () => {
    const name = term.trim();
    const kcal = Number(customKcal);
    if (!name) return setError('Type a name first');
    if (!Number.isFinite(kcal) || kcal <= 0) return setError('Enter the calories');
    setError(null);
    const protein = Number(customProtein);
    await addAdHoc(
      toDayKey(),
      name,
      Math.round(kcal),
      Number.isFinite(protein) && protein > 0 ? Math.round(protein) : 0,
    );
    router.back();
  };

  if (picked) {
    const total = Math.round(picked.kcal * qty);
    return (
      <View style={{ flex: 1, backgroundColor: p.bg, padding: space.lg, paddingTop: insets.top + space.lg }}>
        <Pressable onPress={() => setPicked(null)} hitSlop={12} style={styles.back}>
          <Ionicons name="chevron-back" size={20} color={p.textDim} />
          <Text style={[type.body, { color: p.textDim }]}>Back</Text>
        </Pressable>

        <Text style={[type.title, { color: p.text, marginTop: space.lg }]}>{picked.name}</Text>
        <Text style={[type.body, { color: p.textDim, marginTop: 2 }]}>
          {picked.kcal} kcal per {picked.serving ?? 'serving'}
        </Text>

        <View style={[styles.qtyCard, { backgroundColor: p.card, borderColor: p.border }]}>
          <Text style={[type.caption, { color: p.textDim }]}>HOW MUCH</Text>
          <View style={styles.qtyRow}>
            <Pressable
              onPress={() => setQty((q) => Math.max(QUANTITY_STEP, q - QUANTITY_STEP))}
              style={[styles.stepper, { backgroundColor: p.track }]}
            >
              <Ionicons name="remove" size={22} color={p.text} />
            </Pressable>
            <View style={styles.qtyMiddle}>
              <Text style={[type.title, { color: p.text }]}>{formatQty(qty)}</Text>
              <Text style={[type.label, { color: p.textDim }]}>{picked.serving ?? 'serving'}</Text>
            </View>
            <Pressable
              onPress={() => setQty((q) => q + QUANTITY_STEP)}
              style={[styles.stepper, { backgroundColor: p.track }]}
            >
              <Ionicons name="add" size={22} color={p.text} />
            </Pressable>
          </View>

          <View style={[styles.totalRow, { borderTopColor: p.border }]}>
            <Text style={[type.body, { color: p.textDim }]}>Total</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[type.heading, { color: p.accent }]}>{total} kcal</Text>
              <Text style={[type.label, { color: p.textDim }]}>
                {Math.round((picked.protein_g ?? 0) * qty)} g protein
              </Text>
            </View>
          </View>
        </View>

        <Pressable onPress={logPicked} style={[styles.save, { backgroundColor: p.accent }]}>
          <Text style={[type.body, { color: p.accentText }]}>Log it</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={{ padding: space.lg, paddingTop: insets.top + space.lg }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.head}>
        <Text style={[type.title, { color: p.text }]}>Add food</Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={[type.body, { color: p.textDim }]}>Cancel</Text>
        </Pressable>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: p.card, borderColor: p.border }]}>
        <Ionicons name="search" size={18} color={p.textFaint} />
        <TextInput
          value={term}
          onChangeText={(t) => {
            setTerm(t);
            setError(null);
          }}
          placeholder="samosa, anda, biryani..."
          placeholderTextColor={p.textFaint}
          autoCorrect={false}
          style={[styles.searchInput, { color: p.text }]}
        />
        {term.length > 0 && (
          <Pressable onPress={() => setTerm('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={p.textFaint} />
          </Pressable>
        )}
      </View>

      {results.map((f) => (
        <Pressable
          key={f.id}
          onPress={() => {
            setPicked(f);
            setQty(1);
          }}
          style={[styles.result, { borderColor: p.border, backgroundColor: p.card }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { color: p.text }]}>{f.name}</Text>
            <Text style={[type.label, { color: p.textDim, marginTop: 2 }]}>
              {f.serving ?? 'serving'}
              {f.protein_g ? `  ·  ${f.protein_g}g protein` : ''}
              {f.times_used > 0 ? '  ·  eaten before' : ''}
            </Text>
          </View>
          <Text style={[type.label, { color: p.accent }]}>{f.kcal} kcal</Text>
        </Pressable>
      ))}

      {results.length === 0 && (
        <View style={{ marginTop: space.md }}>
          <Text style={[type.body, { color: p.textDim, marginBottom: space.md }]}>
            Not in the list. Add "{term.trim()}" with its calories and it'll be there next time.
          </Text>
          <TextInput
            value={customKcal}
            onChangeText={(t) => {
              setCustomKcal(t.replace(/[^0-9]/g, ''));
              setError(null);
            }}
            placeholder="Calories"
            keyboardType="number-pad"
            placeholderTextColor={p.textFaint}
            style={[styles.input, { backgroundColor: p.card, borderColor: p.border, color: p.text }]}
          />
          <TextInput
            value={customProtein}
            onChangeText={(t) => setCustomProtein(t.replace(/[^0-9]/g, ''))}
            placeholder="Protein in grams (optional)"
            keyboardType="number-pad"
            placeholderTextColor={p.textFaint}
            style={[styles.input, { backgroundColor: p.card, borderColor: p.border, color: p.text }]}
          />
          {error && (
            <Text style={[type.label, { color: p.danger, marginBottom: space.sm }]}>{error}</Text>
          )}
          <Pressable onPress={logCustom} style={[styles.save, { backgroundColor: p.accent }]}>
            <Text style={[type.body, { color: p.accentText }]}>Save and log</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function formatQty(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toFixed(1);
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    marginBottom: space.md,
  },
  searchInput: { flex: 1, paddingVertical: space.md, fontSize: 15 },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 15,
    marginBottom: space.md,
  },
  save: { borderRadius: radius.md, paddingVertical: space.md, alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center' },
  qtyCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
    marginTop: space.xl,
    marginBottom: space.lg,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
  },
  qtyMiddle: { alignItems: 'center' },
  stepper: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    marginTop: space.lg,
    paddingTop: space.md,
  },
});
