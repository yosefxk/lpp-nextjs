"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SearchInput from "@/components/SearchInput";
import ResultCard from "@/components/ResultCard";
import { AlertTriangle, Globe } from "lucide-react";

type Dataset = {
  source_key: string;
  source_name: string;
  data: Record<string, string>;
  ordered_keys?: string[];
};

type VehicleProfile = {
  license_plate: string;
  is_handicapped: boolean;
  red_flags: string[];
  datasets: Record<string, Dataset>;
};

// UI Translations
const UI_TRANSLATIONS = {
  title: { en: "Vehicle License Finder", he: "איתור רכב ולוחיות רישוי" },
  subtitle: { en: "באירוח BaileyTV • Hosted on BaileyTV", he: "באירוח BaileyTV • Hosted on BaileyTV" },
  resultsTitle: { en: "Results for License Plate", he: "תוצאות עבור לוחית הרישוי" },
  handicappedMsg: { en: "♿ This vehicle has an official disabled parking permit", he: "♿ לרכב זה קיים תג חניה לנכה רשמי" },
  noDataError: { en: "No data found for the requested license plate number.", he: "לא נמצאו נתונים עבור לוחית הרישוי המבוקשת." },
  connError: { en: "Failed to communicate with the server. Please try again.", he: "שגיאה בתקשורת מול השרת. אנא נסה שוב." },
  unknownError: { en: "An unexpected error occurred.", he: "ארעה שגיאה בלתי צפויה." },
  loadingText: { en: "Loading interface...", he: "טוען ממשק..." }
};

// Flag Translations
const FLAG_TRANSLATIONS: Record<string, string> = {
  "⚠️ קריאת שירות (ריקול) פתוחה רשומה על רכב זה": "⚠️ Open Safety Recall registered for this vehicle",
  "🚨 רישיון הרכב מוגבל עקב אי-ביצוע ריקול בזמן": "🚨 Vehicle license restricted due to outstanding safety recall",
  "❌ רכב זה הורד מהכביש או בוטל סופית": "❌ This vehicle has been permanently taken off the road or cancelled",
  "❗ רכב זה רשום במשרד הרישוי כלא פעיל": "❗ This vehicle is registered as inactive in the licensing registry",
  "⚠️ תוקף רישיון הרכב (טסט) פג": "⚠️ The M.O.T. test / vehicle license has expired"
};

// Realistic HTML/CSS Israeli License Plate component
function LicensePlate({ number }: { number: string }) {
  const formatPlate = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (clean.length === 7) {
      return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
    }
    if (clean.length === 8) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 5)}-${clean.slice(5)}`;
    }
    return num;
  };

  return (
    <div className="relative inline-flex items-center justify-center bg-[#FCD116] border-[3px] border-neutral-950 rounded-lg shadow-xl px-4 py-2.5 font-bold text-neutral-900 select-none overflow-hidden h-[60px] min-w-[210px] pl-10 border-double border-8">
      {/* Left Side Blue Strip (Israel / IL badge) */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-[#0038A8] flex flex-col items-center justify-center text-white py-0.5 border-r border-neutral-950 select-none">
        {/* Flag Graphic */}
        <div className="w-[15px] h-[10px] bg-white relative flex flex-col justify-between border-[0.5px] border-blue-900 py-[0.5px] px-[1px]">
          <div className="w-full h-[1px] bg-[#0038A8]" />
          <div className="text-[5px] leading-none text-center text-[#0038A8] -mt-[2px] font-bold">✡</div>
          <div className="w-full h-[1px] bg-[#0038A8]" />
        </div>
        <span className="text-[8px] font-sans font-extrabold tracking-normal mt-0.5 leading-none">IL</span>
      </div>
      {/* License plate text */}
      <span className="font-mono text-2xl md:text-3xl tracking-widest text-center w-full font-black leading-none pl-1 text-black">
        {formatPlate(number)}
      </span>
    </div>
  );
}

function SearchApp() {
  const [profile, setProfile] = useState<VehicleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Detect language state
  const [lang, setLang] = useState<"he" | "en">("he");

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Load language from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem("lpp_lang");
    if (saved === "he" || saved === "en") {
      setLang(saved as "he" | "en");
    }
  }, []);

  // Sync language selection to localStorage
  const handleLangToggle = () => {
    const newLang = lang === "he" ? "en" : "he";
    setLang(newLang);
    localStorage.setItem("lpp_lang", newLang);
  };

  // Handle direct url load like ?lp=1234567
  useEffect(() => {
    const lp = searchParams.get("lp");
    if (lp) {
      fetchVehicleData(lp, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVehicleData = async (plate: string, updateUrl: boolean = true) => {
    setIsLoading(true);
    setError(null);
    setProfile(null);
    
    if (updateUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("lp", plate);
      router.push(`${pathname}?${params.toString()}`);
    }

    try {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/+$/, '');
      const res = await fetch(`${backendUrl}/api/search/${encodeURIComponent(plate)}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("no_data");
        }
        throw new Error("conn_error");
      }
      
      const data = await res.json();
      if (!data || (data.datasets && Object.keys(data.datasets).length === 0)) {
        throw new Error("no_data");
      }
      setProfile(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "no_data") {
        setError(UI_TRANSLATIONS.noDataError[lang]);
      } else if (err instanceof Error && err.message === "conn_error") {
        setError(UI_TRANSLATIONS.connError[lang]);
      } else {
        setError(UI_TRANSLATIONS.unknownError[lang]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isRtl = lang === "he";

  return (
    <div className="w-full flex flex-col min-h-screen" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      {/* Sticky Floating Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-4 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] bg-clip-text text-transparent">
            🚗 IBLP Finder
          </span>
        </div>
        <button 
          onClick={handleLangToggle}
          className="glass-panel text-white hover:text-[#4ECDC4] px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-white/5 transition-all cursor-pointer border border-white/10"
        >
          <Globe size={14} />
          {lang === "he" ? "English" : "עברית"}
        </button>
      </header>

      <main className="flex-1 py-8 px-4 md:px-8 max-w-7xl mx-auto flex flex-col w-full">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 mt-4"
        >
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gradient mb-3">
            {UI_TRANSLATIONS.title[lang]}
          </h1>
          <p className="text-[10px] md:text-xs font-semibold tracking-widest text-neutral-400 uppercase opacity-80">
            {UI_TRANSLATIONS.subtitle[lang]}
          </p>
        </motion.div>

        {/* Search Input */}
        <SearchInput 
          onSearch={(plate) => fetchVehicleData(plate, true)} 
          isLoading={isLoading} 
          initialValue={searchParams.get("lp") || ""}
          lang={lang}
        />

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 text-center"
            >
              <div className="inline-block glass-panel border border-[#FF6B6B]/30 bg-[#FF6B6B]/10 text-[#FF6B6B] px-6 py-4 rounded-xl font-medium">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {profile && (
            <motion.div 
              key={profile.license_plate}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-12 space-y-8 w-full"
            >
              {/* Graphic License Plate representation */}
              <div className="flex flex-col items-center justify-center gap-3 mb-8">
                <span className="text-sm font-bold text-neutral-400 tracking-wide uppercase opacity-75">
                  {UI_TRANSLATIONS.resultsTitle[lang]}
                </span>
                <LicensePlate number={profile.license_plate} />
              </div>

              {/* Red Flags & Handicapped Status */}
              <div className="flex flex-col gap-4 max-w-3xl mx-auto mb-10">
                {profile.is_handicapped && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ delay: 0.1 }}
                    className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-xl flex items-center justify-center gap-3 font-bold shadow-lg shadow-emerald-500/10 text-center"
                  >
                    <span>{UI_TRANSLATIONS.handicappedMsg[lang]}</span>
                  </motion.div>
                )}

                {profile.red_flags.map((flag, idx) => {
                  const translatedFlag = lang === "en" ? (FLAG_TRANSLATIONS[flag] || flag) : flag;
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ scale: 0.95, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      transition={{ delay: 0.2 + (idx * 0.1) }}
                      className="bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] px-6 py-4 rounded-xl flex items-center gap-3 font-bold shadow-lg shadow-[#ef4444]/10 text-right"
                      style={{ direction: isRtl ? "rtl" : "ltr" }}
                    >
                      <AlertTriangle className="w-6 h-6 shrink-0" />
                      <span>{translatedFlag}</span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Datasets Grid */}
              <div className="grid grid-cols-1 gap-6 pb-20">
                {Object.values(profile.datasets).sort((a, b) => {
                  const getPrio = (k: string) => ['private_vehicles', 'busses', 'motorcycles'].includes(k) ? 0 : (k === 'private_import' ? 1 : 2);
                  return getPrio(a.source_key) - getPrio(b.source_key);
                }).map((dataset, idx) => (
                  <ResultCard
                    key={dataset.source_key}
                    sourceName={dataset.source_name}
                    data={dataset.data}
                    orderedKeys={dataset.ordered_keys}
                    delay={idx + 1}
                    lang={lang}
                  />
                ))}
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#4ECDC4]">טוען ממשק...</div>}>
      <SearchApp />
    </Suspense>
  );
}
