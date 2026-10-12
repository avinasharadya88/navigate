"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";

interface ThemeSwitcherProps {
  compact?: boolean;
  className?: string;
}

const emptySubscribe = () => () => {};

export function ThemeSwitcher({ compact = false, className = "" }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Laptop },
  ] as const;

  if (!mounted) {
    return (
      <div className={`flex items-center p-0.5 rounded-full bg-surface-container/70 border border-outline-variant/40 ${className}`}>
        <div className="w-7 h-7 rounded-full opacity-0" />
        <div className="w-7 h-7 rounded-full opacity-0" />
        <div className="w-7 h-7 rounded-full opacity-0" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center p-0.5 rounded-full bg-surface-container/80 border border-outline-variant/40 shadow-inner ${className}`}
      role="group"
      aria-label="Theme mode selector"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            className={
              compact
                ? `w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                    isActive
                      ? "bg-surface-bright text-primary shadow-[0_2px_8px_rgba(0,0,0,0.28)]"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                  }`
                : `flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-surface-bright text-primary shadow-[0_2px_8px_rgba(0,0,0,0.28)] font-semibold"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60"
                  }`
            }
            onClick={() => setTheme(value)}
            title={`${label} mode`}
            aria-pressed={isActive}
            aria-label={`Switch to ${label} appearance`}
          >
            <Icon size={14} />
            {!compact && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
