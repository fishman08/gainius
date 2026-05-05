import { StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

type Props = { current: number; total: number };

export function ProgressBar({ current, total }: Props) {
  const pct = Math.min(100, Math.round((current / total) * 100));
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.row}>
        <Text style={styles.label}>
          Question {current} of {total}
        </Text>
        <Text style={styles.label}>{pct}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: colors.muted, fontSize: 12 },
  track: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: colors.accent },
});
