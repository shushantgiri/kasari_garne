import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "../supabase/server";

export type Role = "editor" | "reviewer" | "owner";
export interface AdminSession {
  live: true;
  db: NonNullable<Awaited<ReturnType<typeof supabaseServer>>>;
  userId: string;
  name: string;
  role: Role;
}
export type MaybeAdmin = AdminSession | { live: false; name: string; role: Role };

/** Server-side admin check. Every admin page and action calls this; RLS enforces it again in the database. */
export async function getAdmin(): Promise<MaybeAdmin> {
  const db = await supabaseServer();
  if (!db) return { live: false, name: "Demo", role: "owner" };
  const { data: u } = await db.auth.getUser();
  if (!u.user) redirect("/admin/login");
  const { data: a } = await db.from("admins").select("display_name,role").eq("user_id", u.user.id).maybeSingle();
  if (!a) redirect("/admin/login?error=not_admin");
  return { live: true, db, userId: u.user.id, name: a.display_name as string, role: a.role as Role };
}

export const canReview = (r: Role) => r === "reviewer" || r === "owner";
