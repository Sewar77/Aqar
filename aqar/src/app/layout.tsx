import type { Metadata } from "next";
import { Cairo } from "next/font/google";

import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-aqar-arabic",
});

export const metadata: Metadata = {
  title: "عقار | إدارة العقارات",
  description:
    "نظام عربي لإدارة العقارات والمناطق وجهات الاتصال",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={cairo.variable}
    >
      <body>{children}</body>
    </html>
  );
}