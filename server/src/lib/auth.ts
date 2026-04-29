import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { prisma } from "./prisma";

export const auth = betterAuth({
  trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  user: {
    modelName: "Instructor",
    fields: {
      image: "avatarUrl",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh session every 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  plugins: [
    admin({
      defaultRole: "INSTRUCTOR",
      adminRoles: ["ADMIN"],
      roles: {
        ADMIN: adminAc,
        INSTRUCTOR: userAc,
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // If user signed up with an email that has a pending invitation, accept it and apply the role
          const invitation = await prisma.invitation.findFirst({
            where: { email: user.email, status: "PENDING" },
          });
          if (invitation) {
            await prisma.$transaction([
              prisma.invitation.update({
                where: { id: invitation.id },
                data: { status: "ACCEPTED" },
              }),
              prisma.instructor.update({
                where: { id: user.id },
                data: { role: invitation.role },
              }),
            ]);
          }
        },
      },
    },
  },
  advanced: {
    cookiePrefix: "pilates",
  },
});
