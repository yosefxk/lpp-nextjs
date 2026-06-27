"use client";

import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  onSearch: (plate: string) => void;
  isLoading: boolean;
  initialValue?: string;
  lang: "he" | "en";
}

export default function SearchInput({ onSearch, isLoading, initialValue = "", lang }: SearchInputProps) {
  const [plate, setPlate] = useState(initialValue);

  // Sync state if url changes initially
  useEffect(() => {
    if (initialValue) {
      setPlate(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plate.trim()) {
      onSearch(plate.trim());
      if (e.target instanceof HTMLFormElement) {
        const input = e.target.querySelector('input');
        if (input) input.blur();
      }
    }
  };

  const isRtl = lang === "he";

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto group">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex items-center"
      >
        {/* Glow effect on focus */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6B6B] to-[#4ECDC4] rounded-2xl blur opacity-0 group-focus-within:opacity-30 transition duration-500" />
        
        <input 
          autoFocus
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          placeholder={lang === "en" ? "Enter license plate number..." : "הזן מספר רישוי..."}
          className={cn(
            "relative w-full glass-panel text-white rounded-2xl py-5",
            isRtl ? "pl-14 pr-6 text-right" : "pr-14 pl-6 text-left",
            "text-xl font-medium focus:outline-none focus:border-[#4ECDC4]/50 transition-all",
            "placeholder:text-gray-500"
          )}
          dir={isRtl ? "rtl" : "ltr"}
        />
        <button 
          type="submit" 
          disabled={isLoading || !plate} 
          className={cn(
            "absolute text-gray-400 group-focus-within:text-[#4ECDC4] transition-colors disabled:opacity-50",
            isRtl ? "left-4" : "right-4"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-7 h-7 animate-spin text-[#4ECDC4]" />
          ) : (
            <Search className="w-7 h-7" />
          )}
        </button>
      </motion.div>
    </form>
  );
}
