import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  secondsLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  duration: number;
  onStart: (seconds?: number) => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetDuration: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function RestTimer({
  secondsLeft,
  isRunning,
  isPaused,
  duration,
  onStart,
  onResume,
  onStop,
  onReset,
  onSetDuration,
}: Props) {
  const { theme } = useAppTheme();
  const [draftDuration, setDraftDuration] = useState(String(duration));

  const themedStyles = useMemo(
    () => ({
      container: {
        alignItems: 'center' as const,
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginBottom: 12,
      },
    }),
    [theme],
  );

  const handleDurationChange = (text: string) => {
    setDraftDuration(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num > 0 && num <= 600) {
      onSetDuration(num);
    }
  };

  return (
    <View style={themedStyles.container}>
      <Text variant="titleMedium" style={styles.label}>
        Rest Timer
      </Text>
      <View style={styles.presetRow}>
        {[
          { label: '30s', value: 30 },
          { label: '60s', value: 60 },
          { label: '90s', value: 90 },
          { label: '2m', value: 120 },
        ].map((preset) => (
          <Button
            key={preset.value}
            mode="outlined"
            compact
            disabled={isRunning}
            onPress={() => {
              setDraftDuration(String(preset.value));
              onSetDuration(preset.value);
            }}
            style={duration === preset.value ? styles.presetActive : undefined}
          >
            {preset.label}
          </Button>
        ))}
      </View>
      <View style={styles.durationRow}>
        <TextInput
          mode="outlined"
          label="Seconds"
          value={draftDuration}
          onChangeText={handleDurationChange}
          keyboardType="numeric"
          style={styles.durationInput}
          dense
          disabled={isRunning}
        />
      </View>
      <Text variant="displaySmall" style={styles.time}>
        {formatTime(secondsLeft)}
      </Text>
      <View style={styles.buttons}>
        {isRunning ? (
          <Button mode="outlined" onPress={onStop}>
            Pause
          </Button>
        ) : isPaused ? (
          <Button mode="contained" onPress={onResume}>
            Resume
          </Button>
        ) : (
          <Button mode="contained" onPress={() => onStart()}>
            Start
          </Button>
        )}
        <Button mode="text" onPress={onReset} disabled={secondsLeft === 0 && !isRunning}>
          Reset
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  presetActive: {
    borderWidth: 2,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  durationInput: {
    width: 80,
    textAlign: 'center',
  },
  time: {
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
});
