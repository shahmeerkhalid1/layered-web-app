import sharp from "sharp";

/** Resize exercise images to max 800x800, output WebP. */
export async function resizeExerciseImage(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

/** Resize avatar to 400x400 cover crop, output WebP. */
export async function resizeAvatar(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(400, 400, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();
}
