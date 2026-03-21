"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, Clock } from "lucide-react";

interface ResultCardProps {
  sourceName: string;
  data: Record<string, string>;
  orderedKeys?: string[];
  delay?: number;
}

export default function ResultCard({ sourceName, data, orderedKeys = [], delay = 0 }: ResultCardProps) {
  // Determine the most important keys to display at the top in large metrics
  const allKeys = Object.keys(data);
  const importantKeys = orderedKeys.length > 0 ? orderedKeys.slice(0, 4) : allKeys.slice(0, 4);
  const remainingKeys = allKeys.filter((k) => !importantKeys.includes(k));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className="glass-panel rounded-2xl p-6 border-r-4 border-r-[#4ECDC4] hover:border-r-[#FF6B6B] transition-colors relative overflow-hidden group"
    >
      {/* Subtle ambient light inside the card */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ECDC4]/5 rounded-full blur-3xl group-hover:bg-[#FF6B6B]/10 transition-colors" />

      <h3 className="text-2xl font-bold text-white mb-6 relative z-10">{sourceName}</h3>

      {/* Top Metrics Grid */}
      {importantKeys.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
          {importantKeys.map((key) => {
            if (!data[key]) return null;
            return (
              <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <span className="text-xs text-gray-400 font-medium mb-1">{key}</span>
                <span className="text-lg font-bold text-white">{data[key]}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Details List */}
      {remainingKeys.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 border-t border-white/10 pt-4 mt-2">
          {remainingKeys.map((key) => {
            if (!data[key]) return null;
            return (
              <div key={key} className="flex justify-between items-center bg-black/20 rounded-lg p-3">
                <span className="text-sm font-semibold text-gray-300">{key}:</span>
                <span className="text-sm text-gray-100">{data[key]}</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
