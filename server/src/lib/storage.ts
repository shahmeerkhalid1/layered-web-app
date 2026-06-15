import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import fs from "fs/promises";
import { resizeExerciseImage, resizeAvatar } from "./image-processing";

const region = process.env.AWS_REGION ?? "us-east-1";
const bucket = process.env.AWS_S3_BUCKET ?? "";
const signedUrlTtlSeconds = Number(
  process.env.S3_SIGNED_URL_TTL_SECONDS ?? "3600"
);

const s3 = new S3Client({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

function assertBucket(): string {
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }
  return bucket;
}

export function exerciseImageKey(exerciseId: string): string {
  const suffix = crypto.randomUUID().slice(0, 8);
  return `exercises/${exerciseId}/${suffix}.webp`;
}

export function avatarStorageKey(instructorId: string): string {
  return `avatars/${instructorId}/profile.webp`;
}

/** True when value is an S3 object key (not a legacy full URL). */
export function isStorageKey(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return !value.startsWith("http://") && !value.startsWith("https://");
}

export async function uploadExerciseImage(
  filePath: string,
  exerciseId: string
): Promise<{ storageKey: string }> {
  const bucketName = assertBucket();
  const storageKey = exerciseImageKey(exerciseId);
  const raw = await fs.readFile(filePath);
  const body = await resizeExerciseImage(raw);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      Body: body,
      ContentType: "image/webp",
    })
  );

  return { storageKey };
}

export async function uploadAvatar(
  instructorId: string,
  filePath: string
): Promise<{ storageKey: string }> {
  const bucketName = assertBucket();
  const storageKey = avatarStorageKey(instructorId);
  const raw = await fs.readFile(filePath);
  const body = await resizeAvatar(raw);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      Body: body,
      ContentType: "image/webp",
    })
  );

  return { storageKey };
}

export async function deleteObject(storageKey: string): Promise<void> {
  const bucketName = assertBucket();
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    })
  );
}

export async function deleteAvatar(instructorId: string): Promise<void> {
  await deleteObject(avatarStorageKey(instructorId)).catch(() => {});
}

export async function getSignedReadUrl(
  storageKey: string,
  ttlSeconds = signedUrlTtlSeconds
): Promise<string> {
  const bucketName = assertBucket();
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    }),
    { expiresIn: ttlSeconds }
  );
}

/** Upload a buffer directly to S3 (used by migration script). */
export async function putObjectBuffer(
  storageKey: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const bucketName = assertBucket();
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      Body: body,
      ContentType: contentType,
    })
  );
}
