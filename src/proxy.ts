import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Protect all dashboard paths, settings, operations, etc.
  // We exclude api routes, login page, public files, and NextJS internals.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)", "/"],
};
