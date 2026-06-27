"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function LangLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "he";

  const targetLang = lang === "he" ? "en" : "he";
  const label = lang === "he" ? "🇺🇸 EN" : "🇮🇱 עב";
  const title = lang === "he" ? "Switch to English" : "עבור לעברית";
  const isRtl = lang === "he";

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {/* Fixed top-right language switcher matching flights app style exactly */}
      <div className="fixed top-4 right-4 z-50" style={{ direction: "ltr" }}>
        <Link
          href={`/${targetLang}`}
          className="glass-panel rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-all inline-block border border-white/10"
          title={title}
          style={{
            background: 'rgba(24, 24, 27, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            fontWeight: 600
          }}
        >
          {label}
        </Link>
      </div>
      {children}
    </div>
  );
}
