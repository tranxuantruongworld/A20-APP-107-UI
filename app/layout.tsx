import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import MicrosoftClarity from '@/components/Clarity'
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Q&A Conference Hub - AI-Powered Conference Platform",
  description: "Experience the future of conference interaction with our AI-powered Q&A platform. Real-time engagement, intelligent moderation, seamless collaboration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-background`}
      >
        <body className="min-h-full flex flex-col">
          <MicrosoftClarity />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
