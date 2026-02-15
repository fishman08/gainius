import React, { useState, useCallback, useRef, useMemo } from 'react';
import { FlatList, StyleSheet, View, Pressable } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import { searchExercises } from '@fitness-tracker/shared';
import type { CatalogExercise } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (name: string) => void;
  label?: string;
  autoFocus?: boolean;
}

export default function ExercisePicker({
  value,
  onChangeText,
  onSelect,
  label = 'Exercise name',
  autoFocus,
}: Props) {
  const { theme } = useAppTheme();
  const [suggestions, setSuggestions] = useState<CatalogExercise[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const themedStyles = useMemo(
    () => ({
      dropdown: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.surfaceBorder,
      },
      itemText: { color: theme.colors.text },
      categoryText: { color: theme.colors.textSecondary },
    }),
    [theme],
  );

  const handleChange = useCallback(
    (text: string) => {
      onChangeText(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (text.trim().length >= 2) {
          const results = searchExercises(text, 8);
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 300);
    },
    [onChangeText],
  );

  const handleSelect = useCallback(
    (exercise: CatalogExercise) => {
      onSelect(exercise.name);
      onChangeText(exercise.name);
      setShowSuggestions(false);
    },
    [onSelect, onChangeText],
  );

  return (
    <View>
      <TextInput
        label={label}
        value={value}
        onChangeText={handleChange}
        mode="outlined"
        autoFocus={autoFocus}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        onBlur={() => {
          // Delay to allow press event on suggestion
          setTimeout(() => setShowSuggestions(false), 200);
        }}
      />
      {showSuggestions && (
        <View style={[styles.dropdown, themedStyles.dropdown]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.name}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={styles.item} onPress={() => handleSelect(item)}>
                <Text variant="bodyMedium" style={themedStyles.itemText}>
                  {item.name}
                </Text>
                <Text variant="labelSmall" style={themedStyles.categoryText}>
                  {item.category}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 2,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
});
