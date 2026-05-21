import { redirect } from "next/navigation";

export default function PendingUsersRedirectPage() {
  redirect("/admin/users");
}
