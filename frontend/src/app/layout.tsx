import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BaileyTV LP Project",
  description: "Advanced Israeli License Plate Finder",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
