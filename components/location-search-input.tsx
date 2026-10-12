"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin, Search, X } from "lucide-react";
import { BANGALORE_LOCATIONS, type BangaloreLocation } from "../lib/bangalore-data";

interface LocationSearchInputProps {
  label: string;
  placeholder: string;
  selectedPoint: { lat: number; lng: number } | null;
  selectedLabel: string;
  onSelect: (location: { name: string; lat: number; lng: number }) => void;
  onClear: () => void;
  onUseMyLocation?: () => void;
  iconType?: "start" | "end";
}

export function LocationSearchInput({
  label,
  placeholder,
  selectedPoint,
  selectedLabel,
  onSelect,
  onClear,
  onUseMyLocation,
  iconType = "start",
}: LocationSearchInputProps) {
  const [query, setQuery] = useState(selectedLabel || "");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [prevPropLabel, setPrevPropLabel] = useState(selectedLabel);

  if (selectedLabel !== prevPropLabel) {
    setPrevPropLabel(selectedLabel);
    setQuery(
      selectedLabel ||
        (selectedPoint ? `${selectedPoint.lat.toFixed(4)}, ${selectedPoint.lng.toFixed(4)}` : ""),
    );
  }

  // Filter locations
  const filtered = query.trim()
    ? BANGALORE_LOCATIONS.filter((loc) => {
        const q = query.toLowerCase();
        return (
          loc.name.toLowerCase().includes(q) ||
          loc.area.toLowerCase().includes(q) ||
          loc.district.toLowerCase().includes(q) ||
          (loc.aliases && loc.aliases.some((a) => a.toLowerCase().includes(q)))
        );
      }).slice(0, 8)
    : BANGALORE_LOCATIONS.slice(0, 8); // show popular default locations on empty query

  // Outside click listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(loc: BangaloreLocation) {
    setQuery(loc.name);
    setIsOpen(false);
    onSelect({ name: loc.name, lat: loc.lat, lng: loc.lng });
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

  function handleClear() {
    setQuery("");
    onClear();
    if (inputRef.current) inputRef.current.focus();
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="font-label-eyebrow text-label-eyebrow text-outline uppercase tracking-wider">{label}</label>
        {onUseMyLocation && (
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-outline-variant/60 bg-surface-container-high/80 text-primary hover:bg-primary-container/20 font-caption-meta text-caption-meta transition-colors"
            onClick={onUseMyLocation}
            title="Use current device GPS location"
          >
            <LocateFixed size={12} />
            <span>My GPS</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container/80 border border-outline-variant/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-sm transition-all">
        <span className="flex-shrink-0 flex items-center justify-center">
          {iconType === "start" ? (
            <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(85,238,113,0.7)]" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(163,201,255,0.7)]" />
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          className="w-full bg-transparent border-0 p-0 text-on-surface font-body-medium text-body-medium placeholder:text-outline outline-none"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {query && (
          <button
            type="button"
            className="p-1 rounded-full text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
            onClick={handleClear}
            aria-label="Clear location"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="location-dropdown-menu" role="listbox">
          <div className="dropdown-header">
            <span>Bengaluru Locations ({filtered.length} found)</span>
            <span className="font-caption-meta text-outline lowercase">select or tap map</span>
          </div>

          <div className="overflow-y-auto max-h-56">
            {filtered.length > 0 ? (
              filtered.map((loc, index) => {
                const isSelected = highlightIndex === index;
                const isUrban = loc.district === "Bangalore Urban";
                return (
                  <div
                    key={loc.id}
                    className={`dropdown-item ${isSelected ? "highlighted" : ""}`}
                    onClick={() => handleSelect(loc)}
                    onMouseEnter={() => setHighlightIndex(index)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <MapPin size={15} className="text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className="dropdown-item-title">{loc.name}</span>
                      <span className="dropdown-item-subtitle">{loc.area}</span>
                    </div>
                    <span className={`district-badge ${isUrban ? "badge-urban" : "badge-rural"}`}>
                      {isUrban ? "Urban" : "Rural"}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-xs text-outline flex items-center gap-2">
                <Search size={14} />
                <span>No catalog match for &ldquo;{query}&rdquo;. Tap map to choose point.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
