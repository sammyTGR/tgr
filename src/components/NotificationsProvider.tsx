"use client";

// import useRealtimeNotifications from "@/utils/useRealtimeNotifications";

const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  // useRealtimeNotifications(); // Activate the real-time notifications

  return <>{children}</>; // Render children
};

export default NotificationsProvider;
