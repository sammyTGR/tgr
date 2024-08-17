import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTFiles } from "uploadthing/server";

const f = createUploadthing();

const auth = async (req: Request) => {
  // Fake authentication function, replace with actual logic
  return { id: "fakeId" }; 
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Route to accept images with specific configurations
  imageUploader: f({
    "image/png": { maxFileSize: "4MB" },
    "image/jpeg": { maxFileSize: "4MB" },
  })
    .middleware(async ({ req, files }) => {
      console.log("Middleware hit: API Route accessed");

      const user = await auth(req);

      if (!user) throw new UploadThingError("Unauthorized");

      // Optional: Override file names or add custom identifiers
      const fileOverrides = files.map((file) => {
        const newName = `custom-${file.name}`;
        const customId = `id-${Math.random().toString(36).substr(2, 9)}`;
        return { ...file, name: newName, customId };
      });

      return { userId: user.id, [UTFiles]: fileOverrides };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      console.log("custom id", file.customId);  // If you used custom IDs
      return { success: true, uploadedBy: metadata.userId, fileUrl: file.url };
    }),

  // Example "profile picture upload" route to accept any image
  profilePicture: f(["image"])
    .middleware(({ req }) => auth(req))
    .onUploadComplete((data) => console.log("file", data)),

  // Example route to accept image or video
  messageAttachment: f(["image", "video"])
    .middleware(({ req }) => auth(req))
    .onUploadComplete((data) => console.log("file", data)),

  // Route to accept one image with strict size limit
  strictImageAttachment: f({
    "image/png": { maxFileSize: "2MB", maxFileCount: 1, minFileCount: 1 },
    "image/jpeg": { maxFileSize: "2MB", maxFileCount: 1, minFileCount: 1 },
  })
    .middleware(({ req }) => auth(req))
    .onUploadComplete((data) => console.log("file", data)),

  // Example route to accept up to 4 images or 1 video
  mediaPost: f({
    "image/png": { maxFileSize: "2MB", maxFileCount: 4 },
    "image/jpeg": { maxFileSize: "2MB", maxFileCount: 4 },
    video: { maxFileSize: "256MB", maxFileCount: 1 },
  })
    .middleware(({ req }) => auth(req))
    .onUploadComplete((data) => console.log("file", data)),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
