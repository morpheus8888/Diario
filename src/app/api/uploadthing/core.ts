import { createUploadthing, type FileRouter } from "uploadthing/next"

import { getCurrentUserIdFromAdapter } from "@/lib/auth"

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "1MB" } })
    .middleware(async () => {
      const userId = await getCurrentUserIdFromAdapter()

      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
