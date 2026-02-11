import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, Card } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { clearPlanComparison } from '../../store/slices/workoutSlice';
import type { PlanChange } from '@fitness-tracker/shared';

const CHANGE_COLORS: Record<PlanChange['changeType'], string> = {
  added: '#E8F5E9',
  removed: '#FFEBEE',
  modified: '#FFF8E1',
  unchanged: '#F5F5F5',
};

const CHANGE_LABELS: Record<PlanChange['changeType'], string> = {
  added: 'New',
  removed: 'Removed',
  modified: 'Modified',
  unchanged: '',
};

export default function PlanComparisonModal() {
  const dispatch = useDispatch();
  const comparison = useSelector((state: RootState) => state.workout.planComparison);

  if (!comparison) return null;

  return (
    <Portal>
      <Modal
        visible
        onDismiss={() => dispatch(clearPlanComparison())}
        contentContainerStyle={styles.modal}
      >
        <ScrollView>
          <Text variant="titleLarge" style={styles.title}>
            Week {comparison.oldPlan.weekNumber} → Week {comparison.newPlan.weekNumber}
          </Text>
          <Text variant="bodySmall" style={styles.dates}>
            {comparison.oldPlan.startDate} — {comparison.newPlan.endDate}
          </Text>

          {comparison.changes.map((change, i) => (
            <Card
              key={i}
              style={[styles.changeCard, { backgroundColor: CHANGE_COLORS[change.changeType] }]}
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
                  <Text variant="bodySmall" style={styles.oldValue}>
                    Before: {change.oldValue}
                  </Text>
                )}
                {change.newValue && (
                  <Text variant="bodySmall" style={styles.newValue}>
                    After: {change.newValue}
                  </Text>
                )}
                {change.details && (
                  <Text variant="bodySmall" style={styles.details}>
                    {change.details}
                  </Text>
                )}
              </Card.Content>
            </Card>
          ))}

          {comparison.claudeReasoning && (
            <Card style={styles.reasoningCard}>
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
            buttonColor="#4A90E2"
          >
            Accept New Plan
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { backgroundColor: 'white', margin: 20, borderRadius: 12, padding: 20, maxHeight: '85%' },
  title: { textAlign: 'center', marginBottom: 4 },
  dates: { textAlign: 'center', color: '#666', marginBottom: 16 },
  changeCard: { marginBottom: 8, borderRadius: 8 },
  changeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  changeLabel: { fontWeight: '700', textTransform: 'uppercase' },
  oldValue: { color: '#888', marginTop: 4 },
  newValue: { color: '#333', marginTop: 2 },
  details: { color: '#E65100', marginTop: 4, fontStyle: 'italic' },
  reasoningCard: { marginTop: 12, backgroundColor: '#E3F2FD' },
  reasoningTitle: { marginBottom: 8 },
  acceptButton: { marginTop: 16 },
});
