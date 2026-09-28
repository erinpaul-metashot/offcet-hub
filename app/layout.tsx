import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { ConvexClientProvider } from "@/app/convex-client-provider";
import { getToken } from "@/lib/auth-server";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n/locale";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { landing } from "@/lib/i18n/messages/landing";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

async function requestLocale() {
  return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = landing[await requestLocale()];
  return { title: "Cirka", description: meta.description };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [token, locale] = await Promise.all([getToken(), requestLocale()]);

  return (
    <html lang={locale} className={`h-full antialiased ${inter.className}`}>
      <body className="min-h-full">
        <LocaleProvider initialLocale={locale}>
          <ConvexClientProvider initialToken={token}>{children}</ConvexClientProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
