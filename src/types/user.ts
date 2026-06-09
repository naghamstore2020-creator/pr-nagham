export type UserRole = 'ADMIN' | 'EDITOR' | 'DEMO';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  id: string;
  username: string;
  role: UserRole;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role: UserRole;
}

export type Permission =
  | "upload:store"
  | "upload:system"
  | "upload:shelf"
  | "inventory:daily"
  | "inventory:full"
  | "pricing:cost"
  | "pricing:sell"
  | "pricing:full"
  | "ai:match"
  | "settings:api"
  | "settings:users"
  | "logs:view"
  | "logs:export"
  | "export:download";

// الصلاحيات الدقيقة لكل عملية
export const PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "upload:store",
    "upload:system",
    "upload:shelf",
    "inventory:daily",
    "inventory:full",
    "pricing:cost",
    "pricing:sell",
    "pricing:full",
    "ai:match",
    "settings:api",
    "settings:users",
    "logs:view",
    "logs:export",
    "export:download",
  ],
  EDITOR: [
    "upload:store",
    "upload:system",
    "upload:shelf",
    "inventory:daily",
    "inventory:full",
    "pricing:cost",
    "pricing:sell",
    "pricing:full",
    "ai:match",
    "logs:view",
    "logs:export",
    "export:download",
  ],
  DEMO: [
    "upload:store",
    "upload:system",
    "inventory:daily",
    "pricing:sell",
    "logs:view",
    "export:download",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
