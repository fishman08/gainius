import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { isPlanExpired, isPlanExpiringSoon } from '@fitness-tracker/shared';
import { useNotificationBanner } from '../providers/NotificationBannerProvider';
import { showBrowserNotification } from '../services/notificationService';

export function useNotificationCheck() {
  const currentPlan = useSelector((state: RootState) => state.workout.currentPlan);
  const { showBanner } = useNotificationBanner();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!currentPlan || checkedRef.current) return;
    checkedRef.current = true;

    if (isPlanExpired(currentPlan)) {
      showBanner(
        'Plan Expired',
        "Your plan week has ended. Chat with AI Coach for next week's plan.",
        'warning',
      );
      showBrowserNotification('Plan Expired', 'Time to plan your next week!');
    } else if (isPlanExpiringSoon(currentPlan, 1)) {
      showBanner(
        'Plan Ending Soon',
        'Your plan expires soon. Consider planning your next week!',
        'info',
      );
    }
  }, [currentPlan, showBanner]);
}
