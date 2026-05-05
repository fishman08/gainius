import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { colors, radius, spacing } from "@/lib/theme";

type Props = {
  value: string | undefined;
  onChange: (v: string) => void;
};

export function DateInput({ value, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios");
  const today = new Date();
  const max = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate(),
  );
  const min = new Date(
    today.getFullYear() - 100,
    today.getMonth(),
    today.getDate(),
  );
  const date = value ? new Date(value) : max;

  function onChangeNative(
    _: DateTimePickerEvent,
    selected: Date | undefined,
  ) {
    if (Platform.OS === "android") setShowPicker(false);
    if (selected) {
      onChange(toISODate(selected));
    }
  }

  return (
    <View style={{ gap: spacing.md }}>
      {Platform.OS === "android" && (
        <Pressable onPress={() => setShowPicker(true)} style={styles.field}>
          <Text style={styles.text}>{value ?? "Tap to choose date"}</Text>
        </Pressable>
      )}
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          maximumDate={max}
          minimumDate={min}
          onChange={onChangeNative}
          themeVariant="dark"
          display={Platform.OS === "ios" ? "inline" : "default"}
        />
      )}
    </View>
  );
}

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  text: { color: colors.text, fontSize: 16 },
});
