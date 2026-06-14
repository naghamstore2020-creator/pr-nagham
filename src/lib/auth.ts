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
          return {
            id: "admin-fallback-id",
            username: "admin",
            name: "مدير النظام (افتراضي)",
            role: "ADMIN",
          };
        }

        if (demoPass && username === "demo" && password === demoPass) {
          return {
            id: "demo-fallback-id",
            username: "demo",
            name: "حساب تجريبي (افتراضي)",
            role: "DEMO",
          };
        }

        if (editorPass && username === "editor" && password === editorPass) {
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
