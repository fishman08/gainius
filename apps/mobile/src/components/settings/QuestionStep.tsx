import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import type { Question } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';
import { cmToFeetInches, feetInchesToCm, kgToLbs, lbsToKg } from '@fitness-tracker/shared';

interface Props {
  question: Question;
  value: unknown;
  onChange: (v: unknown) => void;
  imperial: boolean;
  freeTextValue?: string;
  onFreeTextChange?: (fieldKey: string, value: string) => void;
}

export default function QuestionStep({
  question,
  value,
  onChange,
  imperial,
  freeTextValue,
  onFreeTextChange,
}: Props) {
  const { theme } = useAppTheme();

  const chipStyle = (selected: boolean) => ({
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: selected ? theme.colors.primary : theme.colors.surfaceBorder,
    backgroundColor: selected ? theme.colors.primary : 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  });

  const chipTextStyle = (selected: boolean) => ({
    fontFamily: theme.typography.label.fontFamily,
    fontSize: theme.typography.label.fontSize,
    fontWeight: theme.typography.label.fontWeight as unknown as '500',
    color: selected ? theme.colors.primaryText : theme.colors.text,
  });

  if (question.kind === 'single' || question.kind === 'number_choice') {
    const selected = value as string | number | undefined;
    return (
      <View>
        {question.options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              style={chipStyle(isSelected)}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={chipTextStyle(isSelected)}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (question.kind === 'multi') {
    const selected = (value as string[] | undefined) ?? [];
    const toggle = (v: string) => {
      const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
      onChange(next);
    };
    return (
      <View>
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <TouchableOpacity
              key={opt.value}
              style={chipStyle(isSelected)}
              onPress={() => toggle(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={chipTextStyle(isSelected)}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
        {question.freeTextField && (
          <TextInput
            label={question.freeTextLabel ?? 'Additional notes (optional)'}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={{ marginTop: 8 }}
            value={freeTextValue ?? ''}
            onChangeText={(text) => onFreeTextChange?.(question.freeTextField!, text)}
          />
        )}
      </View>
    );
  }

  if (question.kind === 'date') {
    return (
      <TextInput
        label="Date of birth"
        mode="outlined"
        value={typeof value === 'string' ? value : ''}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        keyboardType="numeric"
        autoCapitalize="none"
      />
    );
  }

  if (question.kind === 'measurement') {
    if (question.metric === 'height') {
      if (imperial) {
        const cm = typeof value === 'number' ? value : 0;
        const { ft, inches } = cm > 0 ? cmToFeetInches(cm) : { ft: 0, inches: 0 };
        return (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TextInput
              label="Feet"
              mode="outlined"
              value={ft > 0 ? String(ft) : ''}
              onChangeText={(t) => onChange(feetInchesToCm(Number(t) || 0, inches))}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
            <TextInput
              label="Inches"
              mode="outlined"
              value={inches > 0 ? String(inches) : ''}
              onChangeText={(t) => onChange(feetInchesToCm(ft, Number(t) || 0))}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
          </View>
        );
      }
      return (
        <TextInput
          label="Height (cm)"
          mode="outlined"
          value={typeof value === 'number' && value > 0 ? String(value) : ''}
          onChangeText={(t) => onChange(Number(t) || undefined)}
          keyboardType="numeric"
        />
      );
    }

    if (question.metric === 'weight') {
      if (imperial) {
        const kg = typeof value === 'number' ? value : 0;
        const lbs = kg > 0 ? kgToLbs(kg) : 0;
        return (
          <TextInput
            label="Weight (lbs)"
            mode="outlined"
            value={lbs > 0 ? String(lbs) : ''}
            onChangeText={(t) => onChange(lbsToKg(Number(t) || 0))}
            keyboardType="numeric"
          />
        );
      }
      return (
        <TextInput
          label="Weight (kg)"
          mode="outlined"
          value={typeof value === 'number' && value > 0 ? String(value) : ''}
          onChangeText={(t) => onChange(Number(t) || undefined)}
          keyboardType="numeric"
        />
      );
    }
  }

  return null;
}
