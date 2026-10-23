"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, destroySession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.password !== password) return { error: "E-Mail oder Passwort stimmt nicht." };
  if (user.status === "gesperrt") return { error: "Dieses Konto ist gesperrt. Bitte wende dich an das Team." };
  await createSession(user.id);
  redirect(user.onboarded ? "/dashboard" : "/onboarding");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// Demo-Rollenwechsler: wechselt ohne Passwort zwischen den drei Seed-Accounts
export async function switchDemoUser(email: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) return;
  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect(user.isAdmin ? "/admin" : "/dashboard");
}
