import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../src/lib/auth";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@pilates.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin12345";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Platform Admin";

async function main() {
  // Seed default platform settings
  await prisma.platformSetting.upsert({
    where: { key: "signupEnabled" },
    update: {},
    create: { key: "signupEnabled", value: "false" },
  });
  console.log("Seeded platform setting: signupEnabled = false");

  // Promote the first registered user to ADMIN (if one exists and none are admin yet)
  const adminExists = await prisma.instructor.findFirst({
    where: { role: "ADMIN" },
  });

  if (!adminExists) {
    const userCount = await prisma.instructor.count();

    if (userCount === 0) {
      const response = await auth.api.signUpEmail({
        body: {
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          name: ADMIN_NAME,
        },
      });

      await prisma.instructor.update({
        where: { id: response.user.id },
        data: { role: "ADMIN" },
      });

      console.log(`Created admin user: ${ADMIN_EMAIL}`);
      console.log(
        "Admin password loaded from ADMIN_PASSWORD env or local seed default."
      );
      return;
    }

    const firstUser = await prisma.instructor.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!firstUser) {
      throw new Error("Expected an instructor to exist after user count check.");
    }

    await prisma.instructor.update({
      where: { id: firstUser.id },
      data: { role: "ADMIN" },
    });
    console.log(`Promoted first user to ADMIN: ${firstUser.email}`);
  } else {
    console.log(`Admin already exists: ${adminExists.email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
