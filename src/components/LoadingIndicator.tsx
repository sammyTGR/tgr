import React from "react";
import { Progress } from "@/components/ui/progress";
import { useSidebar } from "@/components/ui/sidebar";

const LoadingIndicator = () => {
  const { state } = useSidebar();

  return (
    <div
      className={`w-full flex flex-col items-center justify-center ${state === "collapsed" ? "ml-4 mx-auto" : "ml-64 mx-auto"} transition-all duration-300`}
    >
      <div className="w-[60%] mb-4">
        <Progress value={90} className="h-2 animate-pulse" />
      </div>
      <h2 className="text-center text-xl font-semibold">Chill...</h2>
      <p className="w-full max-w-md px-4 text-center">We're working on it!</p>
    </div>
  );
};

export default LoadingIndicator;
