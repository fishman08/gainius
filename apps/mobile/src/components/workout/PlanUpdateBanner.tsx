import React from 'react';
import { Banner } from 'react-native-paper';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { isPlanExpired, isPlanExpiringSoon, getDaysRemainingInPlan } from '@fitness-tracker/shared';
import { useNavigation } from '@react-navigation/native';

export default function PlanUpdateBanner() {
  const currentPlan = useSelector((state: RootState) => state.workout.currentPlan);
  const navigation = useNavigation<any>();

  if (!currentPlan) return null;

  const expired = isPlanExpired(currentPlan);
  const expiringSoon = isPlanExpiringSoon(currentPlan, 1);

  if (!expired && !expiringSoon) return null;

  const daysLeft = getDaysRemainingInPlan(currentPlan);
  const message = expired
    ? "Your plan week has ended. Chat with AI Coach for next week's plan."
    : `Your plan expires ${daysLeft === 0 ? 'today' : `in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`}. Plan your next week!`;

  return (
    <Banner
      visible
      icon={expired ? 'alert-circle' : 'clock-outline'}
      actions={[
        {
          label: 'Go to Chat',
          onPress: () => navigation.navigate('Chat'),
        },
      ]}
      style={{ backgroundColor: expired ? '#FFF3E0' : '#E3F2FD', marginBottom: 12 }}
    >
      {message}
    </Banner>
  );
}
