import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
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

const RADIUS = 22;
const CIRC = 2 * Math.PI * RADIUS;
const SIZE = 52;
const CENTER = SIZE / 2;

const PRESETS = [
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2m', value: 120 },
];

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

  const progress = duration > 0 ? secondsLeft / duration : 0;
  const dashOffset = CIRC * (1 - progress);

  const themedStyles = useMemo(
    () => ({
      widget: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.surfaceBorder,
      },
    }),
    [theme],
  );

  const handlePreset = (value: number) => {
    onSetDuration(value);
    onReset();
  };

  const handleRingPress = () => {
    if (isRunning) {
      onStop();
    } else if (isPaused) {
      onResume();
    } else {
      onStart();
    }
  };

  return (
    <View style={[styles.widget, themedStyles.widget]}>
      {/* SVG Ring */}
      <TouchableOpacity onPress={handleRingPress} activeOpacity={0.7}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={theme.colors.surfaceBorder}
            strokeWidth={3}
          />
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth={3}
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation={-90}
            originX={CENTER}
            originY={CENTER}
          />
          <SvgText
            x={CENTER}
            y={CENTER + 4}
            textAnchor="middle"
            fontFamily="BarlowCondensed_700Bold"
            fontSize={13}
            fontWeight="700"
            fill={theme.colors.text}
          >
            {formatTime(secondsLeft)}
          </SvgText>
        </Svg>
      </TouchableOpacity>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={[styles.overline, { color: theme.colors.textSecondary }]}>REST TIMER</Text>
        <View style={styles.presetRow}>
          {PRESETS.map((p) => {
            const active = duration === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                onPress={() => handlePreset(p.value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? theme.colors.primary : 'transparent',
                    borderColor: active ? theme.colors.primary : theme.colors.surfaceElevated,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.chipText, { color: active ? '#fff' : theme.colors.textSecondary }]}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    margin: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
  },
  controls: {
    flex: 1,
  },
  overline: {
    fontFamily: 'RethinkSans_700Bold',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    fontFamily: 'RethinkSans_600SemiBold',
    fontSize: 11,
  },
});
