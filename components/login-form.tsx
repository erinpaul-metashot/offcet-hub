"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { Button, Field, Input } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registered = searchParams.get("registered");
  const rejected = searchParams.get("rejected");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Login failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      {registered ? (
        <p className="rounded-lg border border-[var(--brand-secondary)] bg-[var(--brand-secondary-muted)] px-4 py-3 text-sm font-medium text-[var(--ink)]">
          Registration submitted. Sign in to check your approval status.
        </p>
      ) : null}

      {rejected ? (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          Your account is not approved yet. Check back after admin review.
        </p>
      ) : null}

      <form className="grid gap-5" onSubmit={onSubmit}>
        <Field label="Email">
          <Input
            autoComplete="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
          />
        </Field>

        <Field label="Password">
          <Input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />
        </Field>

        {error ? (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <Button disabled={isPending} type="submit" className="mt-1">
          {isPending ? "Signing in…" : "Log in"}
        </Button>
      </form>
    </div>
  );
}
