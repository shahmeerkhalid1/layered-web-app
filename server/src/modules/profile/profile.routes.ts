import { Router, Request, Response } from "express";
import multer from "multer";
import fs from "fs/promises";
import { authenticate } from "../../middleware/auth.middleware";
import * as profileService from "./profile.service";

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

router.use(authenticate);

router.post(
  "/avatar",
  upload.single("image"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    try {
      const result = await profileService.uploadProfileAvatar(
        req.user!.instructorId,
        file.path
      );
      res.status(200).json(result);
    } finally {
      await fs.unlink(file.path).catch(() => {});
    }
  }
);

router.delete("/avatar", async (req: Request, res: Response) => {
  await profileService.removeProfileAvatar(req.user!.instructorId);
  res.status(204).send();
});

export default router;
