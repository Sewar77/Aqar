import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "عقار | Aqar",
  description: "نظام إدارة العقارات وجهات الاتصال",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
