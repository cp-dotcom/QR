import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QrVaultProvider } from "../context/QrVaultContext";
import { ToastProvider } from "../components/ui/Toast";
import { AppLayout } from "../components/layout/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QR Vault - Secure QR Document Generator",
  description: "Generate, customize, and store QR Codes securely in your browser. Supports WiFi, vCard, PDFs, Geolocation, SMS, iCalendar and bulk generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <QrVaultProvider>
          <ToastProvider>
            <AppLayout>{children}</AppLayout>
          </ToastProvider>
        </QrVaultProvider>
      </body>
    </html>
  );
}
