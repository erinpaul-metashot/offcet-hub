"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui";

import { Power } from "lucide-react";

export function SignOutButton({ collapsed }: { collapsed?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    });
  };

  if (collapsed) {
    return (
      <button
        disabled={isPending}
        onClick={handleSignOut}
        type="button"
        className="flex items-center justify-center p-2 rounded-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        title="Sign Out"
      >
        <Power size={20} className={isPending ? "animate-pulse" : ""} />
      </button>
    );
  }

  return (
    <Button
      disabled={isPending}
      onClick={handleSignOut}
      variant="secondary"
      type="button"
      className="w-full text-center"
    >
      {isPending ? "Leaving" : "Sign Out"}
    </Button>
  );
}
