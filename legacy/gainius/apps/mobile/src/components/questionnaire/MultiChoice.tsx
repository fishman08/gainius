import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

type Option = { value: string; label: string };
type Props = {
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  freeTextLabel?: string;
  freeTextValue?: string;
  onChangeFreeText?: (v: string) => void;
};

export function MultiChoice({
  options,
  value,
  onChange,
  freeTextLabel,
  freeTextValue,
  onChangeFreeText,
}: Props) {
  function toggle(v: string) {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else if (v === "none") {
      onChange(["none"]);
    } else {
      onChange([...value.filter((x) => x !== "none"), v]);
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.sm }}>
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <Pressable
              key={option.value}
              onPress={() => toggle(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                pressed && !selected && styles.pressed,
              ]}
            >
              <Text style={styles.label}>{option.label}</Text>
              <View
                style={[
                  styles.checkbox,
                  selected && {
                    borderColor: colors.accent,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      {freeTextLabel && onChangeFreeText && (
        <View>
          <Text style={styles.freeTextLabel}>{freeTextLabel}</Text>
          <TextInput
            multiline
            value={freeTextValue ?? ""}
            onChangeText={onChangeFreeText}
            maxLength={500}
            style={styles.textArea}
            placeholderTextColor={colors.muted}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  selected: { borderColor: colors.accent, backgroundColor: "#1a2620" },
  pressed: { borderColor: colors.muted },
  label: { color: colors.text, fontSize: 16, flex: 1 },
  checkbox: {
    width: 22,
    height: 22,
    borderColor: colors.muted,
    borderWidth: 1,
    borderRadius: 6,
    marginLeft: spacing.md,
  },
  freeTextLabel: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: spacing.xs,
  },
  textArea: {
    color: colors.text,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    minHeight: 90,
    textAlignVertical: "top",
  },
});
