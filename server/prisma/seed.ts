import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "../src/lib/auth";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@pilates.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin12345";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Platform Admin";

const DROPDOWN_CATEGORIES: { key: string; name: string; defaults: string[] }[] = [
  {
    key: "orientation",
    name: "Orientation",
    defaults: [
      "Prone",
      "Supine",
      "Sitting",
      "Standing",
      "Side-lying",
      "Kneeling",
      "All Fours",
    ],
  },
  {
    key: "direction_faced",
    name: "Direction Faced",
    defaults: ["Front-Facing", "Side-Facing", "Rear-Facing"],
  },
  {
    key: "movement_type",
    name: "Movement Type",
    defaults: ["Bilateral", "Unilateral", "Alternating"],
  },
  {
    key: "equipment",
    name: "Equipment Used",
    defaults: [
      "Reformer",
      "Cadillac",
      "Chair",
      "Barrel",
      "Mat",
      "Tower",
      "Spine Corrector",
    ],
  },
  {
    key: "machine_setup",
    name: "Machine Setup",
    defaults: [
      "Headrest Up",
      "Headrest Down",
      "Footbar High",
      "Footbar Low",
      "Long Box",
      "Short Box",
    ],
  },
  {
    key: "spinal_movement",
    name: "Spinal Movement",
    defaults: [
      "Flexion",
      "Extension",
      "Rotation",
      "Lateral Flexion",
      "Articulation",
    ],
  },
  {
    key: "chain_type",
    name: "Chain Type",
    defaults: [
      "Open Chain",
      "Closed Chain",
      "Both",
      "Lower Chain Closed",
      "Upper Open",
    ],
  },
  {
    key: "joint_loading",
    name: "Joint Loading",
    defaults: ["Knee Loading", "Wrist Loading"],
  },
];

async function seedDropdownDefaults() {
  for (const cat of DROPDOWN_CATEGORIES) {
    const category = await prisma.dropdownCategory.upsert({
      where: { key: cat.key },
      update: { name: cat.name },
      create: { key: cat.key, name: cat.name },
    });

    for (let i = 0; i < cat.defaults.length; i++) {
      const value = cat.defaults[i];
      const existing = await prisma.dropdownOption.findFirst({
        where: {
          categoryId: category.id,
          instructorId: null,
          value,
        },
      });
      if (!existing) {
        await prisma.dropdownOption.create({
          data: {
            categoryId: category.id,
            label: value,
            value,
            order: i,
            instructorId: null,
          },
        });
      }
    }
  }
  console.log("Seeded dropdown categories and default options");
}

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
      await seedDropdownDefaults();
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

  await seedDropdownDefaults();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
