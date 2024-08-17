"use client";

import { UploadButton } from "@/utils/uploadthing";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <UploadButton
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          console.log("Files: ", res);
        }}
        onUploadError={(error: Error) => {
          console.error("Upload Error:", error.message);
          console.error("Error Stack:", error.stack);
        }}
      />
    </main>
  );
}
