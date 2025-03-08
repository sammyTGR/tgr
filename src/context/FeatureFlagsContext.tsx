"use client";

import { createContext, useContext, ReactNode } from "react";

interface FeatureFlags {
  is_todo_enabled: boolean;
  is_barchart_enabled: boolean;
  is_historical_barchart_enabled: boolean;
  is_timesheet_dashboard_enabled: boolean;
  // Add any other feature flags here
}

const defaultFlags: FeatureFlags = {
  is_todo_enabled: true,
  is_barchart_enabled: true,
  is_historical_barchart_enabled: true,
  is_timesheet_dashboard_enabled: true,
  // Set default values for other flags
};

const FeatureFlagsContext = createContext<FeatureFlags>(defaultFlags);

export function useFlags(flagNames: (keyof FeatureFlags)[]) {
  const flags = useContext(FeatureFlagsContext);
  return flagNames.reduce((acc, flagName) => {
    acc[flagName] = flags[flagName];
    return acc;
  }, {} as Partial<FeatureFlags>);
}

interface FeatureFlagsProviderProps {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlags>;
}

export function FeatureFlagsProvider({
  children,
  initialFlags = {},
}: FeatureFlagsProviderProps) {
  const flags = {
    ...defaultFlags,
    ...initialFlags,
  };

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}
