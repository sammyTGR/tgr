import React from "react";

const BackfillButton = () => {
  const handleBackfill = async () => {
    try {
      const response = await fetch("/api/backfillUsers", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Backfill successful:", data);
      } else {
        const error = await response.text();
        console.error("Backfill failed:", error);
      }
    } catch (error) {
      console.error("An error occurred during the backfill:", error);
    }
  };

  return <button onClick={handleBackfill}>Backfill Users</button>;
};

export default BackfillButton;
