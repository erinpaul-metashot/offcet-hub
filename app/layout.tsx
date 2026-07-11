import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/app/convex-client-provider";
import { getToken } from "@/lib/auth-server";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cirka",
  description: "The missing infrastructure for secondary textile resources.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = await getToken();

  return (
    <html lang="en" className={`h-full antialiased ${inter.className}`}>
      <body className="min-h-full">
        <ConvexClientProvider initialToken={token}>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
