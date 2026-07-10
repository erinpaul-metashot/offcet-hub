"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { authClient } from "@/lib/auth-client";
import { Button, Field, Input, Panel } from "@/components/ui";

export function LoginForm({ onSwitch }: { onSwitch?: () => void }) {
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
    <Panel className="w-full max-w-xl p-8 sm:p-10 shadow-[8px_8px_0_0_var(--black)]">
      <div className="mb-8 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[var(--espresso)]">
          Secure Access
        </p>
        <h1 className="text-4xl font-bold tracking-[-0.05em] text-[var(--black)] uppercase">Log in to SurplusLink</h1>
        <p className="text-sm leading-6 text-[var(--espresso)]">
          Use your approved email and password to access your role-specific dashboard.
        </p>
      </div>

      {registered ? (
        <p className="mb-4 border-2 border-dashed border-[var(--black)] bg-[var(--cream)] px-4 py-3 text-sm text-[var(--espresso)] font-bold">
          Registration submitted. Sign in to check your approval status.
        </p>
      ) : null}

      {rejected ? (
        <p className="mb-4 border-2 border-dashed border-[var(--black)] bg-[var(--sand)] px-4 py-3 text-sm text-[var(--espresso)] font-bold">
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

        {error ? <p className="text-sm font-bold text-red-500">{error}</p> : null}

        <Button disabled={isPending} type="submit">
          {isPending ? "Signing In" : "Login"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-[var(--espresso)] font-bold">
        Need an account?{" "}
        {onSwitch ? (
          <button type="button" onClick={onSwitch} className="underline decoration-2 decoration-[var(--black)] underline-offset-4 hover:text-[var(--black)] cursor-pointer">
            Register here
          </button>
        ) : (
          <a href="/register" className="underline decoration-2 decoration-[var(--black)] underline-offset-4 hover:text-[var(--black)]">
            Register here
          </a>
        )}
        .
      </p>
    </Panel>
  );
}
