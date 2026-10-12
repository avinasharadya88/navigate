"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Navigation2, Search, X } from "lucide-react";
import { BANGALORE_ROADS, type BangaloreRoad } from "../lib/bangalore-data";

interface RoadSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectRoad?: (road: BangaloreRoad) => void;
  placeholder?: string;
}

export function RoadSearchInput({
  value,
  onChange,
  onSelectRoad,
  placeholder = "Search road name (e.g. Outer Ring Road, Hosur Road, SH 9)...",
}: RoadSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = value.trim()
    ? BANGALORE_ROADS.filter((road) => {
        const q = value.toLowerCase();
        return (
          road.name.toLowerCase().includes(q) ||
          road.corridor.toLowerCase().includes(q) ||
          road.district.toLowerCase().includes(q)
        );
      })
    : BANGALORE_ROADS; // show full catalog when empty or on focus!

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(road: BangaloreRoad) {
    onChange(road.name);
    setIsOpen(false);
    if (onSelectRoad) {
      onSelectRoad(road);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1 < filtered.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filtered.length) {
        handleSelect(filtered[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container/80 border border-outline-variant/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-sm transition-all">
        <Search size={16} className="text-primary flex-shrink-0" />

        <input
          ref={inputRef}
          type="text"
          className="w-full bg-transparent border-0 p-0 text-on-surface font-body-medium text-body-medium placeholder:text-outline outline-none"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          maxLength={120}
          autoComplete="off"
        />

        {value && (
          <button
            type="button"
            className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
            onClick={() => {
              onChange("");
              if (inputRef.current) inputRef.current.focus();
            }}
            aria-label="Clear road name"
          >
            <X size={14} />
          </button>
        )}

        <button
          type="button"
          className="p-1 text-outline hover:text-on-surface transition-transform"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Toggle Bangalore roads dropdown"
        >
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <div className="road-dropdown-menu" role="listbox">
          <div className="dropdown-header">
            <span>
              Bangalore Roads ({filtered.length})
            </span>
            <span className="font-caption-meta text-outline lowercase">click to select</span>
          </div>

          <div className="overflow-y-auto max-h-56">
            {filtered.length > 0 ? (
              filtered.map((road, index) => {
                const isSelected = highlightIndex === index;
                const isUrban = road.district === "Bangalore Urban";
                const isRural = road.district === "Bangalore Rural";

                return (
                  <div
                    key={road.id}
                    className={`dropdown-item ${isSelected ? "highlighted" : ""}`}
                    onClick={() => handleSelect(road)}
                    onMouseEnter={() => setHighlightIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <Navigation2 size={14} className="text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="dropdown-item-title">{road.name}</span>
                      <span className="dropdown-item-subtitle">{road.corridor}</span>
                    </div>
                    <span
                      className={`district-badge ${
                        isUrban ? "badge-urban" : isRural ? "badge-rural" : "badge-both"
                      }`}
                    >
                      {isUrban ? "Urban" : isRural ? "Rural" : "Both"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-xs text-outline">
                &ldquo;{value}&rdquo; not in catalogue. Custom road label will be used.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
