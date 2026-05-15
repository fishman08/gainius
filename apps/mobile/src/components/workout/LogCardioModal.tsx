import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Chip } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { useStorage } from '../../providers/StorageProvider';
import { useAuth } from '../../providers/AuthProvider';
import type { CardioActivityType } from '@fitness-tracker/shared';
import { logCardioSession } from '../../store/slices/workoutSlice';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const ACTIVITIES: { type: CardioActivityType; label: string }[] = [
  { type: 'run', label: 'Run' },
  { type: 'swim', label: 'Swim' },
  { type: 'walk', label: 'Walk' },
  { type: 'bike', label: 'Bike' },
];

export default function LogCardioModal({ visible, onDismiss }: Props) {
  const { theme } = useAppTheme();
  const dispatch = useDispatch<AppDispatch>();
  const storage = useStorage();
  const { user } = useAuth();
  const userId = user?.id ?? 'local-user';

  const [activity, setActivity] = useState<CardioActivityType>('run');
  const [minutes, setMinutes] = useState('');
  const [miles, setMiles] = useState('');

  const durationSeconds = parseFloat(minutes) * 60 || 0;
  const distanceMeters = parseFloat(miles) > 0 ? parseFloat(miles) * 1609.344 : undefined;

  const pace = useMemo(() => {
    const mins = parseFloat(minutes);
    const mi = parseFloat(miles);
    if (!mins || !mi || mi <= 0) return null;
    const secsPerMile = (mins * 60) / mi;
    const paceMin = Math.floor(secsPerMile / 60);
    const paceSec = Math.round(secsPerMile % 60);
    return `${paceMin}:${String(paceSec).padStart(2, '0')} / mi`;
  }, [minutes, miles]);

  const canLog = durationSeconds > 0;
  const activityLabel = ACTIVITIES.find((a) => a.type === activity)?.label ?? 'Cardio';

  const handleLog = async () => {
    if (!canLog) return;
    await dispatch(
      logCardioSession({
        storage,
        userId,
        activityType: activity,
        durationSeconds,
        distanceMeters,
      }),
    );
    setMinutes('');
    setMiles('');
    onDismiss();
  };

  const handleDismiss = () => {
    setMinutes('');
    setMiles('');
    onDismiss();
  };

  const themedStyles = useMemo(
    () => ({
      container: {
        backgroundColor: theme.colors.surface,
        padding: 24,
        margin: 20,
        borderRadius: theme.borderRadius.md,
      },
      paceText: { color: theme.colors.textSecondary },
    }),
    [theme],
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={themedStyles.container}
      >
        <Text variant="titleMedium" style={styles.title}>
          Log cardio
        </Text>

        <View style={styles.chips}>
          {ACTIVITIES.map((a) => (
            <Chip
              key={a.type}
              selected={activity === a.type}
              onPress={() => setActivity(a.type)}
              style={styles.chip}
              selectedColor={theme.colors.primary}
            >
              {a.label}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Duration (min)"
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Distance (mi) — optional"
          value={miles}
          onChangeText={setMiles}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.input}
        />

        {pace && (
          <Text variant="bodySmall" style={[styles.pace, themedStyles.paceText]}>
            Pace: {pace}
          </Text>
        )}

        <View style={styles.buttons}>
          <Button mode="outlined" onPress={handleDismiss} style={styles.button}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleLog}
            disabled={!canLog}
            style={styles.button}
            buttonColor={theme.colors.primary}
          >
            Log {activityLabel}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700', marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { marginRight: 4 },
  input: { marginBottom: 12 },
  pace: { marginBottom: 12 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
  button: { minWidth: 100 },
});
