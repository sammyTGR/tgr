'use client';

import { useRealTimeNotifications } from '@/hooks/useRealTimeNotifications';

export default function RealTimeNotificationsWrapper() {
  useRealTimeNotifications();
  return null;
}
