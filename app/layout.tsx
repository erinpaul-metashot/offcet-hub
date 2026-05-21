import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/app/convex-client-provider";
import { getToken } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "SurplusLink",
  description: "Curated surplus inventory marketplace for suppliers, buyers, and agents.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <ConvexClientProvider initialToken={token}>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
