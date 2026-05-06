import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  filePath: string,
  folder = "pilates-exercises"
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

// ─── Temp upload helpers ─────────────────────────────────────────────────────

export async function uploadTempImage(
  filePath: string
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "temp",
    unique_filename: true,
    transformation: [{ width: 800, height: 800, crop: "limit" }],
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteTempImage(publicId: string): Promise<void> {
  if (!publicId.startsWith("temp/")) {
    throw new Error("Only temp/ images can be deleted through this endpoint");
  }
  await cloudinary.uploader.destroy(publicId);
}

// ─── Image promotion (temp → exercises) ──────────────────────────────────────

export async function promoteImage(
  tempPublicId: string,
  exerciseId: string
): Promise<{ url: string; publicId: string }> {
  if (!tempPublicId.startsWith("temp/")) {
    throw new Error("Only temp/ images can be promoted");
  }

  const basename = tempPublicId.split("/").pop() ?? tempPublicId;
  const uniqueSuffix = crypto.randomUUID().slice(0, 8);
  const finalPublicId = `exercises/${exerciseId}/${uniqueSuffix}-${basename}`;

  const result = await cloudinary.uploader.rename(
    tempPublicId,
    finalPublicId,
    { overwrite: false }
  );

  return { url: result.secure_url, publicId: result.public_id };
}

// ─── Temp cleanup (paginated) ────────────────────────────────────────────────

export async function cleanupTempImages(maxAgeHours = 6): Promise<{
  scanned: number;
  deleted: number;
  failed: number;
}> {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  let nextCursor: string | undefined;
  let scanned = 0;
  let deleted = 0;
  let failed = 0;

  do {
    const response = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: "temp/",
      max_results: 500,
      ...(nextCursor ? { next_cursor: nextCursor } : {}),
    });

    const resources: { public_id: string; created_at: string }[] =
      response.resources ?? [];
    scanned += resources.length;

    const stale = resources
      .filter((r) => new Date(r.created_at) < cutoff)
      .map((r) => r.public_id);

    for (let i = 0; i < stale.length; i += 100) {
      const batch = stale.slice(i, i + 100);
      try {
        await cloudinary.api.delete_resources(batch);
        deleted += batch.length;
      } catch {
        failed += batch.length;
      }
    }

    nextCursor = response.next_cursor;
  } while (nextCursor);

  return { scanned, deleted, failed };
}

export default cloudinary;
