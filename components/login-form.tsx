"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { Button, Field, Input, Panel } from "@/components/ui";

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
    <Panel className="w-full max-w-xl p-8 sm:p-10">
      <div className="mb-8 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--ink-muted)]">
          Secure Access
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.05em]">Log in to SurplusLink</h1>
        <p className="text-sm leading-6 text-[var(--ink-muted)]">
          Use your approved email and password to access your role-specific dashboard.
        </p>
      </div>

      {registered ? (
        <p className="mb-4 border border-[var(--line)] bg-[var(--muted)] px-4 py-3 text-sm">
          Registration submitted. Sign in to check your approval status.
        </p>
      ) : null}

      {rejected ? (
        <p className="mb-4 border border-[var(--line)] bg-[var(--muted)] px-4 py-3 text-sm">
          Your account is not approved yet. Review the note on the pending page after signing in.
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

        {error ? <p className="text-sm">{error}</p> : null}

        <Button disabled={isPending} type="submit">
          {isPending ? "Signing In" : "Login"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-[var(--ink-muted)]">
        Need an account?{" "}
        <Link className="underline decoration-[var(--ink)] underline-offset-4" href="/register">
          Register here
        </Link>
        .
      </p>
    </Panel>
  );
}
