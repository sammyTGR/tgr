"use client";

import React, { useState } from "react";
import { FeatureConfig, defaultFeatureConfig } from "./features";

export function ConfigurationPage() {
  const [config, setConfig] = useState<FeatureConfig>(defaultFeatureConfig);

  const handleToggle = (feature: keyof FeatureConfig) => {
    setConfig((prev) => ({ ...prev, [feature]: !prev[feature] }));
  };

  const saveConfig = () => {
    // Save config to localStorage or send to backend
    localStorage.setItem("featureConfig", JSON.stringify(config));
  };

  return (
    <div>
      <h1>Configuration</h1>
      {Object.entries(config).map(([feature, enabled]) => (
        <div key={feature}>
          <label>
            <input
              type="checkbox"
              checked={enabled}
              onChange={() => handleToggle(feature as keyof FeatureConfig)}
            />
            {feature}
          </label>
        </div>
      ))}
      <button onClick={saveConfig}>Save Configuration</button>
    </div>
  );
}
