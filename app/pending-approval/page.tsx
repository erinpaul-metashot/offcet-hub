import Link from "next/link";
import { redirect } from "next/navigation";
import { Button, Panel, StatusBadge } from "@/components/ui";
import { getCurrentAppUser } from "@/lib/dashboard";

export default async function PendingApprovalPage() {
  const currentUser = await getCurrentAppUser();

  if (currentUser?.user?.status === "approved") {
    redirect(currentUser.dashboardPath);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-10">
      <Panel className="w-full p-8 sm:p-10">
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--ink-muted)]">
            Account Review
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.05em]">
            {currentUser?.user?.status === "rejected"
              ? "Your account needs another pass."
              : "Your account is pending approval."}
          </h1>
          <p className="text-sm leading-6 text-[var(--ink-muted)]">
            {currentUser?.user?.status === "rejected"
              ? "An admin returned the account for changes. Review the note below before trying again."
              : "A SurplusLink admin is verifying your profile and will unlock dashboard access after approval."}
          </p>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <StatusBadge status={(currentUser?.user?.status ?? "pending") as "pending" | "rejected"} />
          <span className="text-sm text-[var(--ink-muted)]">
            {currentUser?.user ? currentUser.user.email : "Sign in to inspect your status."}
          </span>
        </div>

        {currentUser?.user?.reviewNotes ? (
          <div className="mt-6 border border-[var(--line)] bg-[var(--surface)] p-4 text-sm leading-6">
            {currentUser.user.reviewNotes}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login">
            <Button variant="secondary">Back To Login</Button>
          </Link>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </Panel>
    </main>
  );
}
