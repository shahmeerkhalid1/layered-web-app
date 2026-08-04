import { betterAuth, type Auth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import {
  isMailConfigured,
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from "./mail";
import { prisma } from "./prisma";

// Admin plugin types reference internal better-auth modules; cast to Auth for portable .d.ts emit.
export const auth: Auth = betterAuth({
  trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      const result = await sendEmailVerificationEmail({
        to: user.email,
        verifyLink: url,
      });
      if (!result.ok) {
        if (!isMailConfigured()) {
          console.warn(
            `[auth] Verification email not sent (SMTP not configured). Verify link for ${user.email}: ${url}`
          );
          return;
        }
        console.error(
          `[auth] Failed to send verification email to ${user.email}: ${result.message}`
        );
      }
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const result = await sendPasswordResetEmail({
        to: user.email,
        resetLink: url,
      });
      if (!result.ok) {
        if (!isMailConfigured()) {
          console.warn(
            `[auth] Password reset email not sent (SMTP not configured). Reset link for ${user.email}: ${url}`
          );
          return;
        }
        console.error(`[auth] Failed to send password reset email to ${user.email}: ${result.message}`);
      }
    },
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
          await prisma.subscription.create({
            data: {
              instructorId: user.id,
              status: "free",
            },
          });

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
  rateLimit: {
    enabled: process.env.NODE_ENV === "production",
    window: 60,
    max: 100,
    storage: "memory",
    customRules: {
      "/request-password-reset": {
        window: 15 * 60,
        max: 3,
      },
      "/reset-password": {
        window: 15 * 60,
        max: 5,
      },
      "/reset-password/*": {
        window: 60,
        max: 30,
      },
      "/send-verification-email": {
        window: 15 * 60,
        max: 3,
      },
    },
  },
  advanced: {
    cookiePrefix: "pilates",
  },
}) as unknown as Auth;
