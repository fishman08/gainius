import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, IconButton } from 'react-native-paper';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  onRepsChange: (reps: number) => void;
  onWeightChange: (weight: number) => void;
  onToggleComplete: () => void;
  onDelete?: () => void;
}

export default function SetRow({
  setNumber,
  reps,
  weight,
  completed,
  onRepsChange,
  onWeightChange,
  onToggleComplete,
  onDelete,
}: Props) {
  const { theme } = useAppTheme();

  const themedStyles = useMemo(
    () => ({
      completedRow: {
        backgroundColor: theme.mode === 'dark' ? '#1b3d1b' : '#E8F5E9',
        borderRadius: 8,
      },
    }),
    [theme],
  );

  return (
    <View style={[styles.row, completed && themedStyles.completedRow]}>
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
        iconColor={completed ? theme.colors.success : theme.colors.textHint}
        size={24}
        onPress={onToggleComplete}
      />
      {onDelete && (
        <IconButton icon="close" size={18} iconColor={theme.colors.textHint} onPress={onDelete} />
      )}
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
  label: {
    width: 48,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    marginHorizontal: 4,
  },
});
