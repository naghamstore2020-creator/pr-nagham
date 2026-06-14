"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db-client";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { requirePermission } from "@/lib/permissions";

export async function getUsers() {
  await requirePermission("settings:users");

  try {
    return await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.warn("Failed to fetch users from DB, returning static fallbacks:", error);
    return [
      {
        id: "admin-fallback-id",
        username: "admin",
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: "demo-fallback-id",
        username: "demo",
        role: UserRole.DEMO,
        isActive: true,
        createdAt: new Date(),
      },
    ];
  }
}

export async function createUser(username: string, password: string, role: UserRole) {
  await requirePermission("settings:users");

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        isActive: true,
      },
    });
    return { success: true, user: newUser };
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return { success: false, error: error.message || "فشل إنشاء المستخدم" };
  }
}

export async function changePassword(userId: string, newPassword: string) {
  await requirePermission("settings:users");

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  try {
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requirePermission("settings:users");

  try {
    await db.user.update({
      where: { id: userId },
      data: { isActive },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Failed to toggle user status:", error);
    return { success: false, error: error.message };
  }
}
