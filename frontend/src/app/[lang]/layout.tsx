"use client";
 
import { useParams } from "next/navigation";
import Link from "next/link";
 
function FlagIcon({ country }: { country: "us" | "il" }) {
  if (country === "il") {
    return (
      <svg width="15" stroke="#d4d4d8" strokeWidth="0.5" height="10" viewBox="0 0 220 160" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', borderRadius: '1.5px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
        <rect width="220" height="160" fill="white"/>
        <rect y="15" width="220" height="25" fill="#0038a8"/>
        <rect y="120" width="220" height="25" fill="#0038a8"/>
        <text x="110" y="92" fontSize="42" fill="#0038a8" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">✡</text>
      </svg>
    );
  }
  return (
    <svg width="15" stroke="#d4d4d8" strokeWidth="0.5" height="10" viewBox="0 0 74 50" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px', borderRadius: '1.5px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
      <rect width="74" height="50" fill="#b22234"/>
      <path d="M0,3.8h74M0,11.5h74M0,19.2h74M0,26.9h74M0,34.6h74M0,42.3h74" stroke="white" strokeWidth="3.8"/>
      <rect width="32" height="27" fill="#3c3b6e"/>
      <text x="16" y="20" fontSize="18" fill="white" textAnchor="middle" fontFamily="sans-serif">★</text>
    </svg>
  );
}

export default function LangLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "he";
 
  const targetLang = lang === "he" ? "en" : "he";
  const title = lang === "he" ? "Switch to English" : "עבור לעברית";
  const isRtl = lang === "he";
 
  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      {/* Fixed top-right language switcher matching flights app style exactly */}
      <div className="fixed top-4 right-4 z-50" style={{ direction: "ltr" }}>
        <Link
          href={`/${targetLang}`}
          className="glass-panel rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-all inline-flex items-center"
          title={title}
          style={{
            background: 'rgba(24, 24, 27, 0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
            fontWeight: 600
          }}
        >
          <FlagIcon country={lang === "he" ? "us" : "il"} />
          <span>{lang === "he" ? "EN" : "עב"}</span>
        </Link>
      </div>
      {children}
    </div>
  );
}

