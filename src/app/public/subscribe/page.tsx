"use client";

import { Toaster } from "sonner";
import SubscribeForm from "./form";
import Image from "next/image";

const SubscribePage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-400px)]">
      <SubscribeForm />
      <Toaster richColors />
    </div>
  );
};

export default SubscribePage;
