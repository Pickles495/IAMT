"use client";
import { createContext, useContext, useEffect, useState } from "react";
const C = createContext({
  en: false,
  setEn: (_v: boolean) => {},
  t: (ja: string, en: string) => ja,
});
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [en, setEn] = useState(false);
  useEffect(() => {
    try {
      setEn(localStorage.getItem("iamt-language") === "en");
    } catch {}
  }, []);
  function change(v: boolean) {
    setEn(v);
    try {
      localStorage.setItem("iamt-language", v ? "en" : "ja");
    } catch {}
  }
  useEffect(() => {
    document.documentElement.lang = en ? "en" : "ja";
  }, [en]);
  return (
    <C.Provider
      value={{ en, setEn: change, t: (ja, english) => (en ? english : ja) }}
    >
      {children}
    </C.Provider>
  );
}
export const useLocale = () => useContext(C);
