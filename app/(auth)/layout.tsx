import NetworkBackground from "@/components/NetworkBackground";
import Navbar from "@/components/Navbar";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[100dvh] w-full items-center justify-center px-4 py-10 sm:px-6">
        {/* Constellation network behind the panel */}
        <NetworkBackground className="text-[var(--line-strong)]" />

        <div className="relative z-10 flex w-full items-center justify-center">
          {children}
        </div>
      </main>
    </>
  );
}
