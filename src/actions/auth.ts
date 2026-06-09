"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    
    if (!username || !password) {
      return "يرجى إدخال اسم المستخدم وكلمة المرور";
    }

    await signIn("credentials", {
      username,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "اسم المستخدم أو كلمة المرور غير صحيحة";
        default:
          return "حدث خطأ ما أثناء تسجيل الدخول";
      }
    }
    throw error; // Allow NextAuth redirect error to propagate
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
