import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

type Option = { value: number; label: string };
type Props = {
  options: Option[];
  value: number | undefined;
  onChange: (v: number) => void;
};

export function NumberChoice({ options, value, onChange }: Props) {
  return (
    <View style={styles.grid}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.selected,
              pressed && !selected && styles.pressed,
            ]}
          >
            <Text style={styles.label}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    flexBasis: "30%",
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  selected: { borderColor: colors.accent, backgroundColor: "#1a2620" },
  pressed: { borderColor: colors.muted },
  label: { color: colors.text, fontSize: 16, fontWeight: "500" },
});
