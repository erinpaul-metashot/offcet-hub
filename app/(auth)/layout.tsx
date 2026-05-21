export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-10 sm:px-8">
      <div className="grid w-full gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden border border-[var(--line)] bg-[var(--surface)] p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--ink-muted)]">
              SurplusLink
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.06em]">
              A monochrome workflow for surplus that feels operational, not improvised.
            </h2>
          </div>
          <div className="space-y-3 text-sm leading-6 text-[var(--ink-muted)]">
            <p>Suppliers submit surplus lots with real addresses, quantities, and expected pricing.</p>
            <p>Admins verify accounts manually, review lots, and assign to approved buyers or agents.</p>
            <p>Assigned feeds update live so the right people see the right opportunities immediately.</p>
          </div>
        </div>
        <div className="flex items-center justify-center">{children}</div>
      </div>
    </main>
  );
}
