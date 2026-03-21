import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "חיפוש מספרי רישוי | LPP AI",
  description: "מנוע חכם לאיתור נתוני רכבים ישראליים, בעלויות, ריקולים וסטטוס מבני.",
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
