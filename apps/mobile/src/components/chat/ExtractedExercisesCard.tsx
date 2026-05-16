import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import type { ExtractedExercise } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';
import ExercisePicker from '../workout/ExercisePicker';

interface Props {
  exercises: ExtractedExercise[];
  onConfirm: (exercises: ExtractedExercise[]) => void;
  onDismiss: () => void;
}

function formatDetail(ex: ExtractedExercise): string {
  const reps = typeof ex.reps === 'number' ? ex.reps : ex.reps;
  const base = `${ex.sets}×${reps}`;
  return ex.weight ? `${base} · ${ex.weight} lbs` : base;
}

export default function ExtractedExercisesCard({ exercises, onConfirm, onDismiss }: Props) {
  const { theme } = useAppTheme();
  const [editableExercises, setEditableExercises] = useState<ExtractedExercise[]>(exercises);

  if (exercises.length === 0) return null;

  const cardBg = theme.mode === 'dark' ? '#1a1000' : '#FEF9F0';

  const updateName = (index: number, name: string) => {
    setEditableExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, name } : ex)));
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: 'rgba(249,115,22,0.25)' }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.headerDot, { backgroundColor: theme.colors.primary }]} />
        <Text style={[styles.headerLabel, { color: theme.colors.primary }]}>
          {exercises.length} EXERCISE{exercises.length > 1 ? 'S' : ''} EXTRACTED
        </Text>
      </View>

      {/* Exercise rows */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {editableExercises.map((ex, i) => (
          <View key={i} style={[styles.exerciseRow, { borderBottomColor: 'rgba(249,115,22,0.1)' }]}>
            <View style={styles.pickerWrap}>
              <ExercisePicker
                value={ex.name}
                onChangeText={(text) => updateName(i, text)}
                onSelect={(name) => updateName(i, name)}
                label="Exercise name"
              />
            </View>
            <Text style={[styles.detail, { color: theme.colors.textSecondary }]}>
              {formatDetail(ex)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onConfirm(editableExercises)}
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>ADD TO PLAN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDismiss}
          style={[styles.dismissBtn, { borderColor: theme.colors.surfaceElevated }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.dismissText, { color: theme.colors.textSecondary }]}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginLeft: 36 + 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerLabel: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scroll: { maxHeight: 200 },
  scrollContent: { paddingBottom: 4 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    gap: 8,
  },
  pickerWrap: { flex: 1 },
  detail: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  addBtn: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 13,
    letterSpacing: 0.78,
    textTransform: 'uppercase',
    color: '#fff',
  },
  dismissBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  dismissText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 13,
    color: '#fff',
  },
});
