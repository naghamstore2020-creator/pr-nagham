import { auth } from "./auth";
import { hasPermission, Permission, UserRole } from "@/types/user";

export async function requirePermission(permission: Permission): Promise<{ username: string; role: UserRole }> {
  const session = await auth();
  if (!session) {
    throw new Error("غير مصرح لك بالوصول. يرجى تسجيل الدخول أولاً.");
  }
  const role = session.user?.role as UserRole;
  const username = session.user?.username || "unknown";
  if (!hasPermission(role, permission)) {
    throw new Error(`لا تملك صلاحية "${permission}"، يتطلب صلاحية أعلى.`);
  }
  return { username, role };
}

export async function optionalAuth(): Promise<{ username: string; role: UserRole } | null> {
  const session = await auth();
  if (!session) return null;
  return {
    username: session.user?.username || "unknown",
    role: session.user?.role as UserRole,
  };
}
