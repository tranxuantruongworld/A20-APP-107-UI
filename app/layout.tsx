import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import MicrosoftClarity from "@/components/Clarity";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "hoi thao - AI-Powered Q&A Platform for Conferences",
  description:
    "Experience the future of conference interaction with hoi thao's AI-powered Q&A platform. Real-time interaction, intelligent moderation, and seamless connection.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html
        lang={locale}
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-background`}
      >
        <body className="min-h-full flex flex-col">
          <MicrosoftClarity />
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
