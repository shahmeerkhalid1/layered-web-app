import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

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
    const firstUser = await prisma.instructor.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (firstUser) {
      await prisma.instructor.update({
        where: { id: firstUser.id },
        data: { role: "ADMIN" },
      });
      console.log(`Promoted first user to ADMIN: ${firstUser.email}`);
    } else {
      console.log(
        "No users found. Register an account, then run this seed again to promote it to ADMIN."
      );
    }
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
