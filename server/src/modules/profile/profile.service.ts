import { prisma } from "../../lib/prisma";
import { uploadAvatar, deleteAvatar } from "../../lib/storage";
import { signAvatarUrl } from "../../lib/media-urls";

export async function getProfileAvatarUrl(instructorId: string) {
  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { avatarUrl: true },
  });
  const url = await signAvatarUrl(instructor?.avatarUrl);
  return { url };
}

export async function uploadProfileAvatar(instructorId: string, filePath: string) {
  const { storageKey } = await uploadAvatar(instructorId, filePath);
  await prisma.instructor.update({
    where: { id: instructorId },
    data: { avatarUrl: storageKey },
  });
  const url = await signAvatarUrl(storageKey);
  return { url, storageKey };
}

export async function removeProfileAvatar(instructorId: string) {
  await deleteAvatar(instructorId);
  await prisma.instructor.update({
    where: { id: instructorId },
    data: { avatarUrl: null },
  });
}
