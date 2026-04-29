"use client";

import { useTheme, ThemeColor } from "./ThemeProvider";

const THEMES: { code: ThemeColor; label: string }[] = [
  { code: "blue", label: "🔵" },
  { code: "red", label: "🔴" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-secondary/60 rounded-xl p-1 border border-border/50">
      {THEMES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setTheme(code)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            theme === code
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
          }`}
          title={code === "blue" ? "Blue theme" : "Red theme"}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
