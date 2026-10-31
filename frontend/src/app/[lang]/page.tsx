import { Suspense } from "react";
import SearchApp from "@/components/SearchApp";

export default async function LangPage({ params }: { params: Promise<{ lang: string }> | { lang: string } }) {
  const resolved = await params;
  const lang = resolved?.lang === "en" ? "en" : "he";
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#4ECDC4]">טוען ממשק...</div>}>
      <SearchApp initialLang={lang} />
    </Suspense>
  );
}
