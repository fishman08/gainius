import React, { useMemo } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  isActive?: boolean;
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
  isActive = false,
  onRepsChange,
  onWeightChange,
  onToggleComplete,
}: Props) {
  const { theme } = useAppTheme();

  const rowBg = useMemo(() => {
    if (completed) return theme.colors.primaryMuted;
    if (isActive) return 'rgba(249,115,22,0.05)';
    return 'transparent';
  }, [completed, isActive, theme]);

  const tileBg = useMemo(() => {
    if (completed) return 'rgba(249,115,22,0.1)';
    return theme.colors.surfaceElevated;
  }, [completed, theme]);

  const valueColor = completed ? theme.colors.primary : theme.colors.text;

  const checkBg = useMemo(() => {
    if (completed) return theme.colors.success;
    if (isActive) return theme.colors.primary;
    return 'transparent';
  }, [completed, isActive, theme]);

  const checkBorder = completed || isActive ? 'transparent' : theme.colors.textHint;

  return (
    <View style={[styles.row, { backgroundColor: rowBg }]}>
      {/* Set label */}
      <Text style={[styles.label, { color: theme.colors.textHint }]}>S{setNumber}</Text>

      {/* Input tiles */}
      <View style={styles.tiles}>
        {[
          { lbl: 'REPS', val: reps, onChange: onRepsChange },
          { lbl: 'LBS', val: weight, onChange: onWeightChange },
        ].map(({ lbl, val, onChange }) => (
          <View key={lbl} style={[styles.tile, { backgroundColor: tileBg }]}>
            <Text style={[styles.tileLabel, { color: theme.colors.textHint }]}>{lbl}</Text>
            <TextInput
              style={[styles.tileValue, { color: valueColor }]}
              value={val > 0 ? String(val) : ''}
              onChangeText={(t) =>
                onChange(lbl === 'LBS' ? parseFloat(t) || 0 : parseInt(t, 10) || 0)
              }
              keyboardType="numeric"
              selectTextOnFocus
            />
          </View>
        ))}
      </View>

      {/* Check button */}
      <TouchableOpacity
        onPress={onToggleComplete}
        style={[styles.checkBtn, { backgroundColor: checkBg, borderColor: checkBorder }]}
        activeOpacity={0.7}
      >
        {completed && (
          <Svg width={14} height={14} viewBox="0 0 24 24">
            <Path
              d="M5 12l5 5L20 7"
              stroke={theme.mode === 'dark' ? theme.colors.background : '#fff'}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
        {!completed && isActive && <View style={[styles.activeDot, { backgroundColor: '#fff' }]} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  label: {
    width: 20,
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 12,
  },
  tiles: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  tile: {
    flex: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tileLabel: {
    fontFamily: 'RethinkSans_400Regular',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tileValue: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    padding: 0,
    minHeight: 20,
  },
  checkBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
