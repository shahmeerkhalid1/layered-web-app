"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { AccountAvatar } from "@/components/account/account-avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { profileApi } from "@/services/profile-api";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ConfirmDestructiveDialog } from "@/components/ui/confirm-destructive-dialog";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface ProfilePhotoUploadProps {
  name: string;
  avatarUrl: string | null;
  imageVersion?: number;
  onAvatarChange?: (url: string | null) => void;
}

export function ProfilePhotoUpload({
  name,
  avatarUrl,
  imageVersion = 0,
  onAvatarChange,
}: ProfilePhotoUploadProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  const clearBlobPreview = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setLocalPreview(null);
  }, []);

  useEffect(() => () => clearBlobPreview(), [clearBlobPreview]);

  const previewImage = localPreview ?? avatarUrl;

  const syncSessionImage = useCallback(async (image: string | null) => {
    const { error } = await authClient.updateUser({
      image: image ?? "",
    });
    if (error) {
      throw new Error(error.message ?? "Could not sync profile photo");
    }
  }, []);

  const onDrop = useCallback(
    async (accepted: File[], rejections: FileRejection[]) => {
      for (const r of rejections) {
        for (const err of r.errors) {
          if (err.code === "file-too-large") {
            toast.error(`${r.file.name} exceeds the 5 MB limit`);
          } else if (err.code === "file-invalid-type") {
            toast.error(`${r.file.name} is not a supported image type`);
          } else {
            toast.error(err.message);
          }
        }
      }

      const file = accepted[0];
      if (!file) return;

      clearBlobPreview();
      const blobUrl = URL.createObjectURL(file);
      blobUrlRef.current = blobUrl;
      setLocalPreview(blobUrl);

      setUploading(true);
      try {
        const { url, storageKey } = await profileApi.uploadAvatar(file);
        clearBlobPreview();
        await syncSessionImage(storageKey);
        onAvatarChange?.(url);
        toast.success("Profile photo updated");
      } catch (e) {
        clearBlobPreview();
        toast.error(
          e instanceof ApiError || e instanceof Error
            ? e.message
            : "Failed to upload photo"
        );
      } finally {
        setUploading(false);
      }
    },
    [clearBlobPreview, onAvatarChange, syncSessionImage]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    multiple: false,
    disabled: uploading || removing,
    noClick: true,
    noKeyboard: true,
  });

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await profileApi.deleteAvatar();
      clearBlobPreview();
      await syncSessionImage(null);
      onAvatarChange?.(null);
      toast.success("Profile photo removed");
      setRemoveConfirmOpen(false);
    } catch (e) {
      toast.error(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Failed to remove photo"
      );
    } finally {
      setRemoving(false);
    }
  };

  const busy = uploading || removing;
  const hasPhoto = Boolean(previewImage);

  return (
    <div className="space-y-3">
      
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div
          className="relative flex shrink-0 flex-col items-center gap-2"
          {...getRootProps()}
        >
          <input {...getInputProps()} aria-label="Upload profile photo" />
          <div
            className={cn(
              "relative rounded-full ring-2 ring-border transition-shadow",
              isDragActive && "ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            <AccountAvatar
              name={name}
              image={previewImage}
              imageVersion={localPreview ? undefined : imageVersion}
              className="size-28"
              fallbackClassName="text-2xl"
            />
            {busy ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/70">
                <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
              </div>
            ) : null}
          </div>
          <p className="text-center text-xs text-muted-foreground">Preview</p>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!busy) open();
              }
            }}
            onClick={() => {
              if (!busy) open();
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border px-4 py-8 text-center transition-colors",
              isDragActive && "border-primary bg-primary/5",
              !busy && "hover:border-ring/50 hover:bg-muted/30",
              busy && "pointer-events-none opacity-60",
            )}
          >
            <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-sm font-medium text-foreground">
              {isDragActive ? "Drop image here" : "Drag and drop or choose a file"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG, or WebP · max 5 MB
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={busy}
              onClick={() => open()}
            >
              {hasPhoto ? "Replace photo" : "Upload photo"}
            </Button>
            {hasPhoto ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full text-destructive hover:text-destructive"
                disabled={busy}
                onClick={() => setRemoveConfirmOpen(true)}
              >
                <Trash2 className="mr-2 size-4" aria-hidden />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmDestructiveDialog
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        title="Remove profile photo?"
        description="Your profile photo will be removed. You can upload a new one anytime."
        confirmLabel="Remove"
        confirmPendingLabel="Removing…"
        pending={removing}
        onConfirm={handleRemove}
      />
    </div>
  );
}
