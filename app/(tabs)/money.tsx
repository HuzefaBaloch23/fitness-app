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
  Row,
  Segmented,
} from '../../src/components/ui';
import {
  addTransaction,
  deleteTransaction,
  transactionsSince,
  spendTotal,
  EXPENSE_CATEGORIES,
  type Transaction,
} from '../../src/db/health';
import { startOfMonthIso, startOfWeekIso } from '../../src/lib/day';

export default function MoneyScreen() {
  const p = usePalette();

  const [items, setItems] = useState<Transaction[]>([]);
  const [week, setWeek] = useState(0);
  const [month, setMonth] = useState(0);

  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Food');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await transactionsSince(startOfMonthIso()));
    setWeek(await spendTotal(startOfWeekIso()));
    setMonth(await spendTotal(startOfMonthIso()));
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const save = async () => {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return setError('Enter an amount');
    setError(null);
    await addTransaction(value, merchant.trim() || category, category);
    setAmount('');
    setMerchant('');
    await load();
  };

  const foodSpend = items
    .filter((t) => t.category === 'Food' || t.category === 'Groceries' || t.category === 'Supplements')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <Screen title="Money" subtitle="Spending this month">
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <StatTile label="THIS WEEK" value={`Rs ${Math.round(week).toLocaleString()}`} hint="spent" />
        <StatTile label="THIS MONTH" value={`Rs ${Math.round(month).toLocaleString()}`} hint="spent" />
      </View>

      {foodSpend > 0 && (
        <Card style={{ marginTop: space.md }}>
          <Text style={[type.caption, { color: p.textDim }]}>COST OF THE PLAN</Text>
          <Text style={[type.heading, { color: p.text, marginTop: 4 }]}>
            Rs {Math.round(foodSpend).toLocaleString()} on food and supplements
          </Text>
          <Text style={[type.label, { color: p.textDim, marginTop: 4 }]}>
            {month > 0 ? Math.round((foodSpend / month) * 100) : 0}% of everything you spent this
            month
          </Text>
        </Card>
      )}

      <SectionTitle>ADD AN EXPENSE</SectionTitle>
      <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="1000" suffix="PKR" />
      <Field
        label="What was it (optional)"
        value={merchant}
        onChangeText={setMerchant}
        placeholder="Al-Fatah Store"
        numeric={false}
      />
      <Segmented
        label="Category"
        value={category}
        onChange={setCategory}
        options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
      />
      {error && <Text style={[type.label, { color: p.danger, marginBottom: space.sm }]}>{error}</Text>}
      <PrimaryButton label="Add expense" onPress={save} disabled={!amount} />

      <Card style={{ marginTop: space.lg }}>
        <Text style={[type.caption, { color: p.textDim }]}>ABOUT AUTOMATIC TRACKING</Text>
        <Text style={[type.label, { color: p.textDim, marginTop: space.sm, lineHeight: 19 }]}>
          Reading bank and JazzCash messages automatically is not possible on iPhone - Apple gives
          apps no access to Messages at all. The workaround is an Apple Shortcut that forwards a
          matching message into this app. Until that is set up, entries go in here by hand.
        </Text>
      </Card>

      <SectionTitle>THIS MONTH</SectionTitle>
      {items.length === 0 ? (
        <Empty text="Nothing recorded yet" />
      ) : (
        items.map((t) => (
          <Row
            key={t.id}
            left={t.merchant ?? 'Expense'}
            sub={`${t.category ?? 'Other'} · ${new Date(t.occurred_at).toLocaleDateString()}`}
            right={`Rs ${Math.round(t.amount).toLocaleString()}`}
            onLongPress={async () => {
              await deleteTransaction(t.id);
              await load();
            }}
          />
        ))
      )}
      {items.length > 0 && (
        <Text style={[type.label, { color: p.textFaint, marginTop: space.xs }]}>
          Long-press an entry to delete it.
        </Text>
      )}
    </Screen>
  );
}
