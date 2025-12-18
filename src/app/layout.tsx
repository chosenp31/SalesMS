import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Sales MS - リース販売管理システム",
  description: "リース販売管理システム（CRM）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
