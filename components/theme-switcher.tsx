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
  // Hydration-safe mount detection without cascading setState
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
      <div
        className={`apple-theme-switcher ${compact ? "compact" : ""} ${className}`}
        aria-hidden="true"
      >
        <div className="apple-segmented-track skeleton-placeholder">
          <span className="apple-segment-btn opacity-0">
            <Sun size={14} />
          </span>
          <span className="apple-segment-btn opacity-0">
            <Moon size={14} />
          </span>
          <span className="apple-segment-btn opacity-0">
            <Laptop size={14} />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`apple-theme-switcher ${compact ? "compact" : ""} ${className}`}
      role="group"
      aria-label="Theme mode selector"
    >
      <div className="apple-segmented-track">
        {options.map(({ value, label, icon: Icon }) => {
          const isActive = theme === value;
          return (
            <button
              key={value}
              type="button"
              className={`apple-segment-btn ${isActive ? "active" : ""}`}
              onClick={() => setTheme(value)}
              title={`${label} mode`}
              aria-pressed={isActive}
              aria-label={`Switch to ${label} appearance`}
            >
              <Icon size={compact ? 13 : 14} className="apple-segment-icon" />
              {!compact && <span className="apple-segment-label">{label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
