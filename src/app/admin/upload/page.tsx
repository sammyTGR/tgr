"use client";

import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <UploadButton
        endpoint="fileUploader"
        onClientUploadComplete={(res) => {
          console.log("Files: ", res);
          // You can handle the successful upload here, e.g., display a success message
        }}
        onUploadError={(error: Error) => {
          console.error("Upload Error:", error.message);
          console.error("Error Stack:", error.stack);
          // You can handle the error here, e.g., display an error message to the user
        }}
      />
    </main>
  );
}
