"use client";

import { useTransition } from "react";
import { setLocaleAction } from "@/lib/locale-action";

const LOCALES = [
  { code: "vi", label: "🇻🇳 VI" },
  { code: "en", label: "🇬🇧 EN" },
];

interface LanguageSwitcherProps {
  currentLocale: string;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (locale: string) => {
    startTransition(async () => {
      await setLocaleAction(locale);
    });
  };

  return (
    <div className="flex items-center gap-1 bg-secondary/60 rounded-xl p-1 border border-border/50">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          disabled={isPending}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            currentLocale === code
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
