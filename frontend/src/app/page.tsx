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

function SearchApp() {
  const [profile, setProfile] = useState<VehicleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

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
    
    // Update the URL silently to make sessions shareable
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
          throw new Error("לא נמצאו נתונים עבור לוחית הרישוי המבוקשת");
        }
        throw new Error("שגיאה בתקשורת מול השרת. אנא נסה שוב.");
      }
      
      const data = await res.json();
      if (!data || (data.datasets && Object.keys(data.datasets).length === 0)) {
        throw new Error("לא נמצאו נתונים עבור לוחית הרישוי המבוקשת");
      }
      setProfile(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("ארעה שגיאה בלתי צפויה.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-16 px-4 md:px-8 max-w-7xl mx-auto flex flex-col font-sans">
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 mt-8"
      >
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gradient mb-2">
          {process.env.NEXT_PUBLIC_APP_TITLE || "חיפוש רכב"}
        </h1>
        <p className="text-xs md:text-sm font-semibold tracking-wider text-neutral-400 uppercase opacity-85 mt-2">
          באירוח BaileyTV • Hosted on BaileyTV
        </p>
      </motion.div>

      {/* Search Input */}
      <SearchInput 
        onSearch={(plate) => fetchVehicleData(plate, true)} 
        isLoading={isLoading} 
        initialValue={searchParams.get("lp") || ""}
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
            className="mt-16 space-y-8 w-full"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              תוצאות עבור לוחית: <span className="text-[#4ECDC4]">{profile.license_plate}</span>
            </h2>

            {/* Red Flags & Handicapped Status */}
            <div className="flex flex-col gap-4 max-w-3xl mx-auto mb-12">
              {profile.is_handicapped && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                  className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-xl flex items-center justify-center gap-3 font-bold shadow-lg shadow-emerald-500/10"
                >
                  <span className="text-2xl">♿</span>
                  <span>לרכב זה קיים תג נכה רשמי</span>
                </motion.div>
              )}

              {profile.red_flags.map((flag, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 + (idx * 0.1) }}
                  className="bg-[#ef4444]/15 border border-[#ef4444]/30 text-[#ef4444] px-6 py-4 rounded-xl flex items-center gap-3 font-bold shadow-lg shadow-[#ef4444]/10"
                >
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <span>{flag}</span>
                </motion.div>
              ))}
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
                />
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}

// Wrapping the main app in Suspense is required by Next.js when using useSearchParams()
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#4ECDC4]">טוען ממשק...</div>}>
      <SearchApp />
    </Suspense>
  );
}
