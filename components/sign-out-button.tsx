"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui";

import { Power } from "lucide-react";

export function SignOutButton({ collapsed }: { collapsed?: boolean }) {
  const [isPending, setIsPending] = useState(false);

  const handleSignOut = async () => {
    if (isPending) {
      return;
    }

    setIsPending(true);

    try {
      await authClient.signOut();
      window.location.replace("/login");
    } catch (error) {
      console.error("Failed to sign out", error);
      setIsPending(false);
    }
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
