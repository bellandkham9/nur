import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PushNotificationManager from "@/components/PushNotificationManager";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import AuthGuard from "@/components/auth/AuthGuard";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bahá'í Companion",
  description: "Created Belland KHAM",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PushNotificationManager />
        <AnalyticsTracker />

        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
