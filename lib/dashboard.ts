import { redirect } from "next/navigation";
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server";
import { api } from "@/convex/_generated/api";

export async function getCurrentAppUser() {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    return null;
  }

  return await fetchAuthQuery(api.users.getCurrentUser);
}

export async function requireApprovedUser() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!currentUser.user) {
    redirect("/register");
  }

  if (currentUser.user.status !== "approved") {
    redirect("/pending-approval");
  }

  return currentUser.user;
}

export async function requireRole(role: "supplier" | "buyer" | "agent" | "admin") {
  const user = await requireApprovedUser();

  if (user.role !== role) {
    redirect(`/${user.role}`);
  }

  return user;
}
