"use client";

import { ReactNode } from "react";
import useRealtimeNotifications from "@/utils/useRealtimeNotifications";

const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  useRealtimeNotifications(); // Activate the real-time notifications

  return <>{children}</>; // Render children
};

export default NotificationsProvider;
