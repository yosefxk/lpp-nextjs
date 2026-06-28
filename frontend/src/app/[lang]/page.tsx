"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import SearchInput from "@/components/SearchInput";
import ResultCard from "@/components/ResultCard";
import { AlertTriangle } from "lucide-react";

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
  title: { he: "חיפוש כלי רכב" },
  subtitle: { he: "בשיתוף BaileyTV" },
  resultsTitle: { he: "" },
  handicappedMsg: { he: "♿ לרכב זה קיים תג חניה לנכה רשמי" },
  noDataError: { he: "לא נמצאו נתונים עבור לוחית הרישוי המבוקשת." },
  connError: { he: "שגיאה בתקשורת מול השרת. אנא נסה שוב." },
  unknownError: { he: "ארעה שגיאה בלתי צפויה." },
  loadingText: { he: "טוען ממשק..." }
};

// Flag Translations (match raw backend flag text exactly to translate to clean text)
const FLAG_TRANSLATIONS: Record<string, string> = {
  "⚠️ קריאת שירות (ריקול) פתוחה רשומה על רכב זה": "Open Safety Recall registered for this vehicle",
  "🚨 רישיון הרכב מוגבל עקב אי-ביצוע ריקול בזמן": "Vehicle license restricted due to outstanding safety recall",
  "❌ רכב זה הורד מהכביש או בוטל סופית": "This vehicle has been permanently taken off the road or cancelled",
  "❗ רכב זה רשום במשרד הרישוי כלא פעיל": "This vehicle is registered as inactive in the licensing registry",
  "⚠️ תוקף רישיון הרכב (טסט) פג": "The M.O.T. test / vehicle license has expired"
};

// Helper to strip leading emojis/icons from alert strings for clean text alignment
const cleanFlagText = (text: string) => {
  return text.replace(/^[⚠️🚨❌❗\s]+/, '').trim();
};

// Realistic HTML/CSS Israeli License Plate component (rendered as an image so it is copyable & saveable)
function LicensePlate({ number }: { number: string }) {
  const [imgUrl, setImgUrl] = useState("");

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 70;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw yellow plate background
    ctx.fillStyle = "#FCD116";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw outer thick black border
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#0d0d0d";
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    // Draw inner thin black border (double border)
    ctx.lineWidth = 1.2;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    // Draw left blue strip
    ctx.fillStyle = "#0038A8";
    ctx.fillRect(6, 6, 36, canvas.height - 12);

    // Draw black divider line
    ctx.strokeStyle = "#0d0d0d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(42, 6);
    ctx.lineTo(42, canvas.height - 6);
    ctx.stroke();

    // Draw Israel Flag on blue strip
    const flagX = 14;
    const flagY = 16;
    const flagW = 20;
    const flagH = 12;

    // Flag background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(flagX, flagY, flagW, flagH);

    // Flag stripes
    ctx.fillStyle = "#0038A8";
    ctx.fillRect(flagX, flagY + 2, flagW, 1.5);
    ctx.fillRect(flagX, flagY + flagH - 3.5, flagW, 1.5);

    // Flag star
    ctx.fillStyle = "#0038A8";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✡", flagX + flagW/2, flagY + flagH/2 + 0.5);

    // Draw 'IL' text
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("IL", 24, 46);

    // Format plate numbers
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

    const formatted = formatPlate(number);

    // Draw numbers
    ctx.fillStyle = "#0d0d0d";
    ctx.font = "900 32px monospace, Courier New, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    const textCenterX = 42 + (canvas.width - 42) / 2;
    ctx.fillText(formatted, textCenterX, canvas.height / 2 + 1);

    setImgUrl(canvas.toDataURL("image/png"));
  }, [number]);

  if (!imgUrl) {
    return <div className="h-[70px] w-[300px] bg-neutral-800 animate-pulse rounded-lg" />;
  }

  return (
    <img 
      src={imgUrl} 
      alt={`License Plate ${number}`} 
      className="shadow-xl rounded-lg border-2 border-neutral-900/50 cursor-pointer max-w-full hover:scale-102 transition-transform select-all" 
      style={{ width: "300px", height: "70px" }}
    />
  );
}

function SearchApp() {
  const [profile, setProfile] = useState<VehicleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Hebrew only
  const lang = "he" as const;

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
      const res = await fetch(`/api/search/${encodeURIComponent(plate)}`);
      
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
    <div className="w-full flex flex-col min-h-screen animate-fadeIn" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      {/* Sticky Floating Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-4 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
        </div>
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
                  const rawTranslated = FLAG_TRANSLATIONS[flag] || flag;
                  const finalMessageText = cleanFlagText(rawTranslated);
                  
                  return (
                    <motion.div 
                      key={idx}
                      initial={{ scale: 0.95, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      transition={{ delay: 0.2 + (idx * 0.1) }}
                      className="bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] px-6 py-4 rounded-xl flex items-center gap-3 font-bold shadow-lg shadow-[#ef4444]/10"
                      style={{ 
                        direction: isRtl ? "rtl" : "ltr",
                        textAlign: isRtl ? "right" : "left"
                      }}
                    >
                      <AlertTriangle className="w-6 h-6 shrink-0 text-[#ef4444]" />
                      <span className="flex-1">{finalMessageText}</span>
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
