// import { createUploadthing, type FileRouter } from "uploadthing/next";
// import { UploadThingError, UTFiles } from "uploadthing/server";

// const f = createUploadthing();

// const auth = async (req: Request) => {
//   // Fake authentication function, replace with actual logic
//   return { id: "user_" + Math.random().toString(36).substring(7) };
// };

// // FileRouter for your app, can contain multiple FileRoutes
// export const ourFileRouter = {
//   // Route to accept images with specific configurations
//   imageUploader: f({
//     "image/png": { maxFileSize: "4MB" },
//     "image/jpeg": { maxFileSize: "4MB" },
//   })
//   .middleware(async ({ req }) => {
//     const user = await auth(req);
//     if (!user) throw new UploadThingError("Unauthorized");
//     return { userId: user.id };
//   })
//   .onUploadComplete(async ({ metadata, file }) => {
//     console.log("Upload complete for userId:", metadata.userId);
//     console.log("File URL:", file.url);
    
//     // Here you might want to save the file information to your database
//     // await saveFileToDatabase(metadata.userId, file.url);

//     return { success: true, uploadedBy: metadata.userId, fileUrl: file.url };
//   }),

//   // Example "profile picture upload" route to accept any image
//   profilePicture: f(["image"])
//     .middleware(({ req }) => auth(req))
//     .onUploadComplete((data) => console.log("file", data)),

//   // Example route to accept image or video
//   messageAttachment: f(["image", "video"])
//     .middleware(({ req }) => auth(req))
//     .onUploadComplete((data) => console.log("file", data)),

//   // Route to accept one image with strict size limit
//   strictImageAttachment: f({
//     "image/png": { maxFileSize: "2MB", maxFileCount: 1, minFileCount: 1 },
//     "image/jpeg": { maxFileSize: "2MB", maxFileCount: 1, minFileCount: 1 },
//   })
//     .middleware(({ req }) => auth(req))
//     .onUploadComplete((data) => console.log("file", data)),

//   // Example route to accept up to 4 images or 1 video
//   mediaPost: f({
//     "image/png": { maxFileSize: "2MB", maxFileCount: 4 },
//     "image/jpeg": { maxFileSize: "2MB", maxFileCount: 4 },
//     video: { maxFileSize: "256MB", maxFileCount: 1 },
//   })
//     .middleware(({ req }) => auth(req))
//     .onUploadComplete((data) => console.log("file", data)),

// } satisfies FileRouter;

// export type OurFileRouter = typeof ourFileRouter;

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
    pdf: { maxFileSize: "8MB" },
    text: { maxFileSize: "1MB" },
  })
  .middleware(async ({ req }) => {
    const user = await auth(req);
    if (!user) throw new UploadThingError("Unauthorized");
    return { userId: user.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete for userId:", metadata.userId);
    console.log("File URL:", file.url);
    return { success: true, uploadedBy: metadata.userId, fileUrl: file.url };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;