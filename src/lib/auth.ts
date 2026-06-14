import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "./db-client";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string() })
          .safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        const { username, password } = parsedCredentials.data;

        // 1. Check fallback credentials from environment variables (never hardcoded)
        const adminPass = process.env.ADMIN_FALLBACK_PASS;
        const demoPass = process.env.DEMO_FALLBACK_PASS;
        const editorPass = process.env.EDITOR_FALLBACK_PASS;

        if (adminPass && username === "admin" && password === adminPass) {
          await ensureUserInDb("admin");
          return {
            id: "admin-fallback-id",
            username: "admin",
            name: "مدير النظام (افتراضي)",
            role: "ADMIN",
          };
        }

        if (demoPass && username === "demo" && password === demoPass) {
          await ensureUserInDb("demo");
          return {
            id: "demo-fallback-id",
            username: "demo",
            name: "حساب تجريبي (افتراضي)",
            role: "DEMO",
          };
        }

        if (editorPass && username === "editor" && password === editorPass) {
          await ensureUserInDb("editor");
          return {
            id: "editor-fallback-id",
            username: "editor",
            name: "محرر (افتراضي)",
            role: "EDITOR",
          };
        }

        // 2. Try database check
        try {
          const user = await db.user.findUnique({
            where: { username },
          });

          if (!user || !user.isActive) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            return {
              id: user.id,
              username: user.username,
              name: user.role === "ADMIN" ? "مدير النظام" : "مستخدم تجريبي",
              role: user.role,
            };
          }
        } catch (error) {
          console.error("Database auth check failed, using fallback only:", error);
        }

        return null;
      },
    }),
  ],
});

export async function ensureUserInDb(username: string) {
  try {
    const user = await db.user.findUnique({
      where: { username },
    });
    if (user) {
      return user;
    }

    const adminPass = process.env.ADMIN_FALLBACK_PASS;
    const demoPass = process.env.DEMO_FALLBACK_PASS;
    const editorPass = process.env.EDITOR_FALLBACK_PASS;

    if (username === "admin") {
      const pass = adminPass || "admin";
      const hashedPassword = await bcrypt.hash(pass, 10);
      return await db.user.create({
        data: {
          id: "admin-fallback-id",
          username: "admin",
          password: hashedPassword,
          role: "ADMIN",
          isActive: true,
        },
      });
    }

    if (username === "demo") {
      const pass = demoPass || "demo";
      const hashedPassword = await bcrypt.hash(pass, 10);
      return await db.user.create({
        data: {
          id: "demo-fallback-id",
          username: "demo",
          password: hashedPassword,
          role: "DEMO",
          isActive: true,
        },
      });
    }

    if (username === "editor") {
      const pass = editorPass || "editor";
      const hashedPassword = await bcrypt.hash(pass, 10);
      return await db.user.create({
        data: {
          id: "editor-fallback-id",
          username: "editor",
          password: hashedPassword,
          role: "EDITOR",
          isActive: true,
        },
      });
    }
  } catch (error) {
    console.error(`Error ensuring user ${username} in DB:`, error);
  }
  return null;
}

