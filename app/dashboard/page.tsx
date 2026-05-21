import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/dashboard";

export default async function DashboardRedirect() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser?.user) {
    redirect("/login");
  }

  redirect(`/${currentUser.user.role}`);
}
