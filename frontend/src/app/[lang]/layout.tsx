"use client";

export default function LangLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl">
      {children}
    </div>
  );
}
