import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs/promises";
import { uploadTempImage, deleteTempImage } from "../../lib/cloudinary";

const router = Router();

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
    }
  },
});

router.post(
  "/temp",
  upload.array("images", 3),
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "No image files provided" });
      return;
    }

    const results: { publicId: string; url: string }[] = [];
    try {
      for (const file of files) {
        const uploaded = await uploadTempImage(file.path);
        results.push(uploaded);
      }
    } finally {
      for (const file of files) {
        await fs.unlink(file.path).catch(() => {});
      }
    }

    res.status(201).json({ images: results });
  }
);

router.delete("/temp/:publicId", async (req: Request, res: Response) => {
  const publicId = decodeURIComponent(req.params.publicId as string);

  if (!publicId.startsWith("temp/")) {
    res.status(400).json({ error: "Only temp images can be deleted" });
    return;
  }

  await deleteTempImage(publicId);
  res.status(204).send();
});

export default router;
