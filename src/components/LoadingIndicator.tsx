import React from "react";
import { Progress } from "@/components/ui/progress";

const LoadingIndicator = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-[60%] mb-4">
        <Progress value={90} className="h-2 animate-pulse" />
      </div>
      <h2 className="text-center text-xl font-semibold">Chill...</h2>
      <p className="w-full max-w-md px-4 text-center">We're working on it!</p>
    </div>
  );
};

export default LoadingIndicator;
