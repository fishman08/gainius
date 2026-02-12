import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function EmptyPlanView() {
  const { theme } = useAppTheme();

  const themedStyles = useMemo(
    () => ({
      container: { backgroundColor: theme.colors.background },
      title: { color: theme.colors.primary },
      hint: { color: theme.colors.textSecondary },
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
  },
});
