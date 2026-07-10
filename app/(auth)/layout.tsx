import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[var(--cream,#F4F0E6)]">
      <header className="flex w-full items-center justify-between p-6 sm:px-12 sm:py-8">
        {/* Logo */}
        <Link href="/" className="flex items-center border-2 border-black bg-white px-3 py-1.5">
          <span className="text-xl font-black tracking-tight text-black">Offcet</span>
          <span className="ml-1.5 border-2 border-black bg-[#D1F53B] px-1.5 py-0.5 text-sm font-bold text-black">Hub</span>
        </Link>

        {/* Actions */}
        <div className="flex items-center border-2 border-black bg-white">
          <Link href="/login" className="px-5 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-gray-100">
            LOGIN
          </Link>
          <div className="w-[2px] self-stretch bg-black"></div>
          <Link href="/register" className="bg-[#D1F53B] px-5 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-[#bce628]">
            REGISTER
          </Link>
        </div>
      </header>

      <main className="mx-auto flex flex-1 w-full items-center justify-center p-6 pb-20 sm:p-8">
        {children}
      </main>
    </div>
  );
}
