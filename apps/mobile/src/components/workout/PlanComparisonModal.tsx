import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, Card } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { clearPlanComparison } from '../../store/slices/workoutSlice';
import type { PlanChange } from '@fitness-tracker/shared';
import { useAppTheme } from '../../providers/ThemeProvider';

const CHANGE_LABELS: Record<PlanChange['changeType'], string> = {
  added: 'New',
  removed: 'Removed',
  modified: 'Modified',
  unchanged: '',
};

export default function PlanComparisonModal() {
  const dispatch = useDispatch();
  const { theme } = useAppTheme();
  const comparison = useSelector((state: RootState) => state.workout.planComparison);

  const changeColors = useMemo<Record<PlanChange['changeType'], string>>(
    () => ({
      added: theme.mode === 'dark' ? '#1b3d1b' : '#E8F5E9',
      removed: theme.mode === 'dark' ? '#3d1b1b' : '#FFEBEE',
      modified: theme.mode === 'dark' ? '#3d2e00' : '#FFF3E0',
      unchanged: theme.colors.background,
    }),
    [theme],
  );

  const themedStyles = useMemo(
    () => ({
      modal: { backgroundColor: theme.colors.surface },
      dates: { color: theme.colors.textSecondary },
      oldValue: { color: theme.colors.textHint },
      newValue: { color: theme.colors.text },
      details: { color: theme.mode === 'dark' ? '#FFB74D' : '#E65100' },
      reasoningCard: { backgroundColor: theme.mode === 'dark' ? '#1b2d3d' : '#E3F2FD' },
    }),
    [theme],
  );

  if (!comparison) return null;

  return (
    <Portal>
      <Modal
        visible
        onDismiss={() => dispatch(clearPlanComparison())}
        contentContainerStyle={[styles.modal, themedStyles.modal]}
      >
        <ScrollView>
          <Text variant="titleLarge" style={styles.title}>
            Week {comparison.oldPlan.weekNumber} → Week {comparison.newPlan.weekNumber}
          </Text>
          <Text variant="bodySmall" style={[styles.dates, themedStyles.dates]}>
            {comparison.oldPlan.startDate} — {comparison.newPlan.endDate}
          </Text>

          {comparison.changes.map((change, i) => (
            <Card
              key={i}
              style={[styles.changeCard, { backgroundColor: changeColors[change.changeType] }]}
            >
              <Card.Content>
                <View style={styles.changeHeader}>
                  <Text variant="titleSmall">{change.exerciseName}</Text>
                  {CHANGE_LABELS[change.changeType] ? (
                    <Text variant="labelSmall" style={styles.changeLabel}>
                      {CHANGE_LABELS[change.changeType]}
                    </Text>
                  ) : null}
                </View>
                {change.oldValue && (
                  <Text variant="bodySmall" style={[styles.oldValue, themedStyles.oldValue]}>
                    Before: {change.oldValue}
                  </Text>
                )}
                {change.newValue && (
                  <Text variant="bodySmall" style={[styles.newValue, themedStyles.newValue]}>
                    After: {change.newValue}
                  </Text>
                )}
                {change.details && (
                  <Text variant="bodySmall" style={[styles.details, themedStyles.details]}>
                    {change.details}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}

          {comparison.claudeReasoning && (
            <Card style={[styles.reasoningCard, themedStyles.reasoningCard]}>
              <Card.Content>
                <Text variant="titleSmall" style={styles.reasoningTitle}>
                  AI Coach Reasoning
                </Text>
                <Text variant="bodySmall">{comparison.claudeReasoning}</Text>
              </Card.Content>
            </Card>
          )}

          <Button
            mode="contained"
            onPress={() => dispatch(clearPlanComparison())}
            style={styles.acceptButton}
            buttonColor={theme.colors.primary}
          >
            Accept New Plan
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: 20, borderRadius: 12, padding: 20, maxHeight: '85%' },
  title: { textAlign: 'center', marginBottom: 4 },
  dates: { textAlign: 'center', marginBottom: 16 },
  changeCard: { marginBottom: 8, borderRadius: 8 },
  changeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  changeLabel: { fontWeight: '700', textTransform: 'uppercase' },
  oldValue: { marginTop: 4 },
  newValue: { marginTop: 2 },
  details: { marginTop: 4, fontStyle: 'italic' },
  reasoningCard: { marginTop: 12 },
  reasoningTitle: { marginBottom: 8 },
  acceptButton: { marginTop: 16 },
});
