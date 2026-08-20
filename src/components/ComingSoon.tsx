import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePalette, space, type } from '../theme';

export function ComingSoon({
  title,
  icon,
  note,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  note: string;
}) {
  const p = usePalette();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { backgroundColor: p.bg, paddingTop: insets.top + space.md }]}>
      <Text style={[type.title, { color: p.text, alignSelf: 'flex-start', paddingHorizontal: space.lg }]}>
        {title}
      </Text>
      <View style={styles.body}>
        <Ionicons name={icon} size={40} color={p.textFaint} />
        <Text style={[type.body, { color: p.textDim, textAlign: 'center', marginTop: space.md }]}>
          {note}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
});
