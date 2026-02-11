import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, IconButton } from 'react-native-paper';

interface Props {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  onRepsChange: (reps: number) => void;
  onWeightChange: (weight: number) => void;
  onToggleComplete: () => void;
}

export default function SetRow({
  setNumber,
  reps,
  weight,
  completed,
  onRepsChange,
  onWeightChange,
  onToggleComplete,
}: Props) {
  return (
    <View style={[styles.row, completed && styles.completedRow]}>
      <Text variant="bodyMedium" style={styles.label}>
        Set {setNumber}
      </Text>
      <TextInput
        mode="outlined"
        dense
        label="Reps"
        keyboardType="numeric"
        value={reps > 0 ? String(reps) : ''}
        onChangeText={(text) => onRepsChange(parseInt(text, 10) || 0)}
        style={styles.input}
      />
      <TextInput
        mode="outlined"
        dense
        label="lbs"
        keyboardType="numeric"
        value={weight > 0 ? String(weight) : ''}
        onChangeText={(text) => onWeightChange(parseFloat(text) || 0)}
        style={styles.input}
      />
      <IconButton
        icon={completed ? 'check-circle' : 'check-circle-outline'}
        iconColor={completed ? '#4CAF50' : '#999'}
        size={24}
        onPress={onToggleComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  completedRow: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  label: {
    width: 48,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    marginHorizontal: 4,
  },
});
