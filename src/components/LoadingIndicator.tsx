import React from "react";

const LoadingIndicator = () => (
  <div className="min-h-screen w-full flex flex-col items-center justify-center">
    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
    <h2 className="text-center text-xl font-semibold">Loading...</h2>
    <p className="w-full max-w-md px-4 text-center">
      The hamsters are working as fast as they can! Thank you for your patience.
    </p>
  </div>
);

export default LoadingIndicator;
