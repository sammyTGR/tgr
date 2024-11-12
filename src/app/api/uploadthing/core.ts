
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

const auth = async (req: Request) => {
  // Your auth logic here
  return { id: "user_" + Math.random().toString(36).substring(7) };
};

export const ourFileRouter = {
  fileUploader: f({
    image: { maxFileSize: "4MB" },
    video: { maxFileSize: "16MB" },
    audio: { maxFileSize: "8MB" },
    pdf: { maxFileSize: "4MB" },
    text: { maxFileSize: "64KB" },
  })
  .middleware(async ({ req }) => {
    const user = await auth(req);
    if (!user) throw new UploadThingError("Unauthorized");
    return { userId: user.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    // console.log("Upload complete for userId:", metadata.userId);
    // console.log("File URL:", file.url);
    return { success: true, uploadedBy: metadata.userId, fileUrl: file.url };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;