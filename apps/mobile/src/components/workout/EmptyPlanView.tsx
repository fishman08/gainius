import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../providers/ThemeProvider';

interface Props {
  onStartGzclp?: () => void;
}

export default function EmptyPlanView({ onStartGzclp }: Props) {
  const { theme } = useAppTheme();

  const themedStyles = useMemo(
    () => ({
      container: { backgroundColor: theme.colors.background },
      title: { color: theme.colors.primary },
      hint: { color: theme.colors.textSecondary },
      card: {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.surfaceBorder,
        borderWidth: 1,
        borderRadius: theme.borderRadius.md,
      },
      overline: { color: theme.colors.textSecondary },
      cardTitle: { color: theme.colors.text },
      cardBody: { color: theme.colors.textSecondary },
      button: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm },
      buttonLabel: { color: theme.colors.primaryText },
    }),
    [theme],
  );

  return (
    <View style={[styles.container, themedStyles.container]}>
      <Text variant="headlineSmall" style={[styles.title, themedStyles.title]}>
        No workout plan yet
      </Text>
      <Text variant="bodyMedium" style={[styles.hint, themedStyles.hint]}>
        Chat with your AI coach to create one!
      </Text>

      {onStartGzclp && (
        <View style={[styles.card, themedStyles.card]}>
          <Text style={[styles.overline, themedStyles.overline]}>OR START A PRESET PROGRAM</Text>
          <Text variant="titleMedium" style={[styles.cardTitle, themedStyles.cardTitle]}>
            GZCLP Linear Progression
          </Text>
          <Text variant="bodySmall" style={[styles.cardBody, themedStyles.cardBody]}>
            A proven beginner strength program. 4-session rotation (A1/B1/A2/B2) with automatic
            T1/T2/T3 tier progression. Weights start at 45 lbs.
          </Text>
          <TouchableOpacity style={[styles.button, themedStyles.button]} onPress={onStartGzclp}>
            <Text style={[styles.buttonLabel, themedStyles.buttonLabel]}>Start GZCLP Program</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 8,
  },
  hint: {
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    width: '100%',
    padding: 20,
    gap: 8,
  },
  overline: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardBody: {
    lineHeight: 20,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
