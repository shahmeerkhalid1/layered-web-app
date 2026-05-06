import cron from "node-cron";
import { cleanupTempImages } from "../lib/cloudinary";

let isCleanupRunning = false;

export function startTempUploadCleanup() {
  cron.schedule("0 * * * *", async () => {
    if (isCleanupRunning) {
      console.log("[cleanup] Previous cleanup still running, skipping");
      return;
    }

    isCleanupRunning = true;
    try {
      const result = await cleanupTempImages(6);
      console.log(
        `[cleanup] Temp images — scanned: ${result.scanned}, deleted: ${result.deleted}, failed: ${result.failed}`
      );
    } catch (err) {
      console.error("[cleanup] Temp cleanup failed:", err);
    } finally {
      isCleanupRunning = false;
    }
  });

  console.log("[cleanup] Temp upload cleanup scheduled (every hour, 6h retention)");
}
