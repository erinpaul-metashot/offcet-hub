import { redirect } from "next/navigation";

export default function PendingLotsRedirectPage() {
  redirect("/admin/lots");
}
