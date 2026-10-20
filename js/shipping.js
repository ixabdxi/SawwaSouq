/* ============================================================
   SaWWA Souq — Shipping by Governorate
   ============================================================ */
window.Shipping = (() => {
  const ZONES = {
    "عمان":     { ar: "عمان",     en: "Amman",     fee: 200 },
    "الزرقاء":  { ar: "الزرقاء",  en: "Zarqa",     fee: 250 },
    "إربد":     { ar: "إربد",     en: "Irbid",     fee: 250 },
    "البلقاء":  { ar: "البلقاء",  en: "Balqa",     fee: 250 },
    "مادبا":    { ar: "مادبا",    en: "Madaba",    fee: 300 },
    "جرش":      { ar: "جرش",      en: "Jerash",    fee: 300 },
    "عجلون":    { ar: "عجلون",    en: "Ajloun",    fee: 300 },
    "المفرق":   { ar: "المفرق",   en: "Mafraq",    fee: 350 },
    "الكرك":    { ar: "الكرك",    en: "Karak",     fee: 350 },
    "معان":     { ar: "معان",     en: "Maan",      fee: 400 },
    "الطفيلة":  { ar: "الطفيلة",  en: "Tafilah",   fee: 400 },
    "العقبة":   { ar: "العقبة",   en: "Aqaba",     fee: 450 }
  };

  const FALLBACK = 300;

  const list = () => Object.keys(ZONES);
  const getFee = (city) => ZONES[city]?.fee ?? FALLBACK;
  const label = (city, lang = "ar") => {
    const z = ZONES[city];
    if (!z) return city;
    const fee = (z.fee / 100).toFixed(2);
    return lang === "ar" ? `${z.ar} — ${fee} دينار` : `${z.en} — ${fee} JOD`;
  };

  return { list, getFee, label, ZONES };
})();