import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLbs,
  lbsToKg,
} from "@workout/core";
import { colors, radius, spacing } from "@/lib/theme";

type Props = {
  metric: "height" | "weight";
  unitsPref: "metric" | "imperial";
  onChangeUnitsPref: (v: "metric" | "imperial") => void;
  value: number | undefined;
  onChange: (v: number) => void;
};

export function MeasurementInput(props: Props) {
  if (props.metric === "height") return <HeightInput {...props} />;
  return <WeightInput {...props} />;
}

function UnitToggle({
  unitsPref,
  onChange,
  metricLabel,
  imperialLabel,
}: {
  unitsPref: "metric" | "imperial";
  onChange: (v: "metric" | "imperial") => void;
  metricLabel: string;
  imperialLabel: string;
}) {
  return (
    <View style={styles.toggle}>
      {(["metric", "imperial"] as const).map((u) => {
        const active = unitsPref === u;
        return (
          <Pressable
            key={u}
            onPress={() => onChange(u)}
            style={[styles.toggleItem, active && styles.toggleItemActive]}
          >
            <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
              {u === "metric" ? metricLabel : imperialLabel}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function HeightInput({
  unitsPref,
  onChangeUnitsPref,
  value,
  onChange,
}: Props) {
  const [cmText, setCmText] = useState<string>(value ? String(value) : "");
  const [ftText, setFtText] = useState<string>("");
  const [inText, setInText] = useState<string>("");

  useEffect(() => {
    if (value == null) return;
    setCmText(String(value));
    const { ft, inches } = cmToFeetInches(value);
    setFtText(String(ft));
    setInText(String(inches));
  }, [value]);

  return (
    <View style={{ gap: spacing.md }}>
      <UnitToggle
        unitsPref={unitsPref}
        onChange={onChangeUnitsPref}
        metricLabel="cm"
        imperialLabel="ft / in"
      />
      {unitsPref === "metric" ? (
        <TextInput
          inputMode="decimal"
          keyboardType="decimal-pad"
          placeholder="cm"
          placeholderTextColor={colors.muted}
          value={cmText}
          onChangeText={(t) => {
            setCmText(t);
            const n = Number.parseFloat(t);
            if (Number.isFinite(n)) onChange(n);
          }}
          style={styles.input}
        />
      ) : (
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <TextInput
            inputMode="decimal"
            keyboardType="decimal-pad"
            placeholder="ft"
            placeholderTextColor={colors.muted}
            value={ftText}
            onChangeText={(t) => {
              setFtText(t);
              const ft = Number.parseFloat(t);
              const inches = Number.parseFloat(inText || "0");
              if (Number.isFinite(ft)) {
                onChange(
                  feetInchesToCm(ft, Number.isFinite(inches) ? inches : 0),
                );
              }
            }}
            style={[styles.input, { flex: 1 }]}
          />
          <TextInput
            inputMode="decimal"
            keyboardType="decimal-pad"
            placeholder="in"
            placeholderTextColor={colors.muted}
            value={inText}
            onChangeText={(t) => {
              setInText(t);
              const inches = Number.parseFloat(t);
              const ft = Number.parseFloat(ftText || "0");
              if (Number.isFinite(inches)) {
                onChange(
                  feetInchesToCm(Number.isFinite(ft) ? ft : 0, inches),
                );
              }
            }}
            style={[styles.input, { flex: 1 }]}
          />
        </View>
      )}
    </View>
  );
}

function WeightInput({
  unitsPref,
  onChangeUnitsPref,
  value,
  onChange,
}: Props) {
  const [text, setText] = useState<string>(
    value == null
      ? ""
      : unitsPref === "metric"
        ? String(value)
        : String(kgToLbs(value)),
  );

  useEffect(() => {
    if (value == null) return;
    setText(unitsPref === "metric" ? String(value) : String(kgToLbs(value)));
  }, [value, unitsPref]);

  return (
    <View style={{ gap: spacing.md }}>
      <UnitToggle
        unitsPref={unitsPref}
        onChange={onChangeUnitsPref}
        metricLabel="kg"
        imperialLabel="lbs"
      />
      <TextInput
        inputMode="decimal"
        keyboardType="decimal-pad"
        placeholder={unitsPref === "metric" ? "kg" : "lbs"}
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={(t) => {
          setText(t);
          const n = Number.parseFloat(t);
          if (Number.isFinite(n)) {
            onChange(unitsPref === "metric" ? n : lbsToKg(n));
          }
        }}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    color: colors.text,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 16,
  },
  toggle: {
    alignSelf: "flex-start",
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 3,
  },
  toggleItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
  },
  toggleItemActive: { backgroundColor: colors.accent },
  toggleText: { color: colors.muted, fontSize: 13 },
  toggleTextActive: { color: colors.bg, fontWeight: "600" },
});
