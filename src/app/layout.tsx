import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import './globals.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "CRM System";
const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Professional CRM with user management";

export const metadata: Metadata = {
  title: `${siteName} - Professional Customer Relationship Management`,
  description: `${siteDescription}. Manage users, track calls, and boost productivity.`,
  keywords: "CRM, Customer Relationship Management, staff management, user management, call tracking, business management",
  authors: [{ name: "CRM Team" }],
  robots: "index, follow",
  openGraph: {
    title: `${siteName} - Professional Customer Relationship Management`,
    description: siteDescription,
    type: "website",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
