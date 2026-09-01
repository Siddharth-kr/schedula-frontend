import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Schedula | Appointment operations starter",
  description: "A production-minded starter for doctor appointment booking workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans text-[var(--ink)]">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
