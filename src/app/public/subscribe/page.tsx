"use client";

import { Toaster } from "sonner";
import SubscribeForm from "./form";

const SubscribePage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <SubscribeForm />
      <Toaster richColors />
    </div>
  );
};

export default SubscribePage;
