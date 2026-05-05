import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

type Option = { value: string; label: string };
type Props = {
  options: Option[];
  value: string | undefined;
  onChange: (v: string) => void;
};

export function SingleChoice({ options, value, onChange }: Props) {
  return (
    <View style={{ gap: spacing.sm }}>
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
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  selected: {
    borderColor: colors.accent,
    backgroundColor: "#1a2620",
  },
  pressed: { borderColor: colors.muted },
  label: { color: colors.text, fontSize: 16 },
});
