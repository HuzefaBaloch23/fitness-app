import type { ReactNode } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette, radius, space, type } from '../theme';

export function Screen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: p.bg }}
      contentContainerStyle={{
        padding: space.lg,
        paddingTop: insets.top + space.md,
        paddingBottom: space.xxl * 2,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[type.title, { color: p.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[type.body, { color: p.textDim, marginTop: 2 }]}>{subtitle}</Text>
      )}
      <View style={{ marginTop: space.lg }}>{children}</View>
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  const p = usePalette();
  return (
    <View
      style={[
        { backgroundColor: p.card, borderColor: p.border, borderWidth: 1, borderRadius: radius.lg, padding: space.lg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Kicker({ children }: { children: ReactNode }) {
  const p = usePalette();
  return <Text style={[type.caption, { color: p.textDim }]}>{children}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const p = usePalette();
  return (
    <Text style={[type.caption, { color: p.textDim, marginTop: space.xl, marginBottom: space.sm }]}>
      {children}
    </Text>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  suffix,
  numeric = true,
  allowDecimal = false,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  numeric?: boolean;
  allowDecimal?: boolean;
}) {
  const p = usePalette();
  const clean = (t: string) =>
    numeric ? t.replace(allowDecimal ? /[^0-9.]/g : /[^0-9]/g, '') : t;

  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={[type.label, { color: p.textDim, marginBottom: space.xs }]}>{label}</Text>
      <View
        style={[
          styles.fieldWrap,
          { backgroundColor: p.card, borderColor: p.border },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(clean(t))}
          placeholder={placeholder}
          placeholderTextColor={p.textFaint}
          keyboardType={numeric ? (allowDecimal ? 'decimal-pad' : 'number-pad') : 'default'}
          style={[styles.fieldInput, { color: p.text }]}
        />
        {suffix && <Text style={[type.label, { color: p.textFaint }]}>{suffix}</Text>}
      </View>
    </View>
  );
}

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const p = usePalette();
  return (
    <View style={{ marginBottom: space.md }}>
      {label && <Text style={[type.label, { color: p.textDim, marginBottom: space.xs }]}>{label}</Text>}
      <View style={styles.segWrap}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={[
                styles.seg,
                {
                  backgroundColor: on ? p.accent : p.card,
                  borderColor: on ? p.accent : p.border,
                },
              ]}
            >
              <Text style={[type.label, { color: on ? p.accentText : p.textDim }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.primary,
        { backgroundColor: disabled ? p.track : p.accent },
      ]}
    >
      <Text style={[type.body, { color: disabled ? p.textFaint : p.accentText }]}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  const p = usePalette();
  return (
    <Pressable onPress={onPress} style={[styles.ghost, { borderColor: p.border }]}>
      <Text style={[type.label, { color: p.textDim }]}>{label}</Text>
    </Pressable>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'good' | 'bad';
}) {
  const p = usePalette();
  const hintColor = tone === 'good' ? p.accent : tone === 'bad' ? p.danger : p.textDim;

  return (
    <View style={[styles.tile, { backgroundColor: p.card }]}>
      <Text style={[type.caption, { color: p.textDim }]}>{label}</Text>
      <Text style={[type.heading, { color: p.text, fontSize: 20, marginTop: 3 }]}>{value}</Text>
      {hint && <Text style={[type.label, { color: hintColor, fontSize: 11 }]}>{hint}</Text>}
    </View>
  );
}

export function Row({
  left,
  right,
  sub,
  onPress,
  onLongPress,
}: {
  left: string;
  right: string;
  sub?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.row, { backgroundColor: p.card, borderColor: p.border }]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { color: p.text }]}>{left}</Text>
        {sub && <Text style={[type.label, { color: p.textDim, marginTop: 2 }]}>{sub}</Text>}
      </View>
      <Text style={[type.label, { color: p.text }]}>{right}</Text>
    </Pressable>
  );
}

export function Empty({ text }: { text: string }) {
  const p = usePalette();
  return (
    <Text style={[type.body, { color: p.textFaint, textAlign: 'center', paddingVertical: space.xl }]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
  },
  fieldInput: { flex: 1, paddingVertical: space.md, fontSize: 16 },
  segWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  seg: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  primary: {
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    marginTop: space.sm,
  },
  ghost: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: space.md,
    alignItems: 'center',
    marginTop: space.sm,
  },
  tile: { flex: 1, minWidth: 140, borderRadius: radius.md, padding: space.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.sm,
  },
});
