import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    role: "ADMIN" | "EDITOR" | "DEMO";
    username: string;
  }
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EDITOR" | "DEMO";
      username: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "EDITOR" | "DEMO";
    username: string;
  }
}
