import React from "react";
import { Progress } from "@/components/ui/progress";
import { useSidebar } from "@/components/ui/sidebar";

const LoadingIndicator = () => {
  const { state } = useSidebar();

  return (
    <div
      className={`relative max-w-lg mx-auto ml-16 md:ml-16 lg:ml-16 md:w-lg lg:w-lg overflow-hidden flex-1 transition-all duration-300`}
    >
      <div className="w-full mb-4">
        <Progress value={90} className="h-2 animate-pulse" />
      </div>
      <h2 className="text-center text-xl font-semibold">Chill...</h2>
      <p className="w-full max-w-lg px-4 text-center">We're working on it!</p>
    </div>
  );
};

export default LoadingIndicator;
