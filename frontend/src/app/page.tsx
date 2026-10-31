import { Suspense } from "react";
import SearchApp from "@/components/SearchApp";

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#4ECDC4]">טוען ממשק...</div>}>
      <SearchApp initialLang="he" />
    </Suspense>
  );
}
