import { prisma } from "../../lib/prisma";
import { uploadAvatarImage, deleteAvatarImage } from "../../lib/cloudinary";

export async function uploadProfileAvatar(instructorId: string, filePath: string) {
  const { url } = await uploadAvatarImage(instructorId, filePath);
  await prisma.instructor.update({
    where: { id: instructorId },
    data: { avatarUrl: url },
  });
  return { url };
}

export async function removeProfileAvatar(instructorId: string) {
  await deleteAvatarImage(instructorId);
  await prisma.instructor.update({
    where: { id: instructorId },
    data: { avatarUrl: null },
  });
}
