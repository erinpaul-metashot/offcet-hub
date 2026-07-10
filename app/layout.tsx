import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/app/convex-client-provider";
import { getToken } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Offcet Hub — Where surplus finds its next owner",
  description: "The B2B platform that connects suppliers, admins, and buyers around excess inventory.",
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
