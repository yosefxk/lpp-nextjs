"use client";

import { motion } from "framer-motion";

interface ResultCardProps {
  sourceName: string;
  data: Record<string, string>;
  orderedKeys?: string[];
  delay?: number;
  lang: "he" | "en";
}

const TRANSLATE_KEYS_EN: Record<string, string> = {
  'שם דגם': 'Model Name',
  'כינוי מסחרי': 'Commercial Name',
  'רמת גימור': 'Trim Level',
  'שנת ייצור': 'Manufacture Year',
  'שנת יצור': 'Manufacture Year',
  'מספר רכב': 'License Plate',
  'סוג דגם (פרטי/מסחרי)': 'Model Type',
  'שם יצרן': 'Manufacturer',
  'שם תוצר': 'Manufacturer',
  'רמת אבזור בטיחותי': 'Safety Equipment Rating',
  'קבוצת זיהום': 'Pollution Group',
  'דגם מנוע': 'Engine Model',
  'תאריך מבחן מעשי לרכב (טסט)': 'Last M.O.T. Test Date',
  'תאריך טסט אחרון': 'Last M.O.T. Test Date',
  'תוקף רישיון רכב': 'License Expiry Date',
  'סוג בעלות': 'Ownership Type',
  'מסגרת': 'Chassis Number',
  'מספר שילדה': 'Chassis Number',
  'צבע רכב': 'Vehicle Color',
  'צמיג קדמי': 'Front Tire',
  'צמיג אחורי': 'Rear Tire',
  'סוג דלק': 'Fuel Type',
  'מועד עליה לכביש': 'Road Ascent Date',
  'תו נכה': 'Disabled Tag',
  'תאריך הפקת תו נכה': 'Disabled Tag Issue Date',
  'סוג תו נכה': 'Disabled Tag Type',
  'חברה מפעילה': 'Operator',
  'ממוגן אבנים?': 'Stone Proof?',
  'ממוגן ירי?': 'Bullet Proof?',
  'ארץ ייצור': 'Country of Manufacture',
  "קילומטרז' סה'כ": 'Total Mileage',
  'נפח מנוע': 'Engine Displacement',
  'הספק מנוע': 'Engine Power',
  'משקל כולל': 'Total Weight',
  'קוד תוצר': 'Product Code',
  'קוד סוג רכב': 'Vehicle Type Code',
  'סוג רכב': 'Vehicle Type',
  'סוג יבוא (חדש/משומש)': 'Import Type',
  'היסטוריית העברת בעלויות': 'Ownership Transfer History'
};

const TRANSLATE_SOURCE_EN: Record<string, string> = {
  "כלי רכב פרטיים ומסחריים": "Private & Commercial Vehicles",
  "אוטובוסים, מוניות ורכבים ציבוריים": "Buses, Taxis & Public Vehicles",
  "כלי רכב דו גלגליים": "Two-Wheeled Vehicles (Motorcycles)",
  "כלי רכב עם תג חניה לנכה": "Disabled Parking Tag Permit",
  "כלי רכב ביבוא אישי": "Personal Import Vehicles"
};

const TRANSLATE_VALUES_EN: Record<string, string> = {
  "כן": "Yes",
  "לא": "No",
  "פרטי": "Private",
  "מסחרי": "Commercial",
  "לא ידוע": "Unknown",
  "אין נתונים": "No Data"
};

function translate(text: string, lang: "he" | "en"): string {
  if (lang === "he") return text;
  return TRANSLATE_KEYS_EN[text] || TRANSLATE_SOURCE_EN[text] || TRANSLATE_VALUES_EN[text] || text;
}

export default function ResultCard({ sourceName, data, orderedKeys = [], delay = 0, lang }: ResultCardProps) {
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
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ECDC4]/5 rounded-full blur-3xl group-hover:bg-[#FF6B6B]/10 transition-colors" />

      <h3 className="text-xl font-bold text-white mb-6 relative z-10">
        {translate(sourceName, lang)}
      </h3>

      {/* Top Metrics Grid */}
      {importantKeys.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 relative z-10">
          {importantKeys.map((key) => {
            if (!data[key]) return null;
            return (
              <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                <span className="text-xs text-gray-400 font-medium mb-1">
                  {translate(key, lang)}
                </span>
                <span className="text-lg font-bold text-white">
                  {translate(data[key], lang)}
                </span>
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
                <span className="text-sm font-semibold text-gray-300">
                  {translate(key, lang)}:
                </span>
                <span className="text-sm text-gray-100">
                  {translate(data[key], lang)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
