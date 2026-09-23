import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zivira Labs Field Force",
  description: "Mobile-first field force portal for Zivira Labs"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-100 text-slate-800 antialiased font-sans min-h-screen selection:bg-emerald-200`}>{children}</body>
    </html>
  );
}
