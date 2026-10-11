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
    <div className="location-search-wrapper" ref={containerRef}>
      <div className="location-label-row">
        <label className="input-label-small">{label}</label>
        {onUseMyLocation && (
          <button
            type="button"
            className="gps-pill-btn"
            onClick={onUseMyLocation}
            title="Use current device GPS location"
          >
            <LocateFixed size={12} />
            <span>My GPS</span>
          </button>
        )}
      </div>

      <div className={`location-input-box ${iconType === "start" ? "start-theme" : "end-theme"}`}>
        <span className="input-prefix-icon">
          {iconType === "start" ? <div className="dot start-dot" /> : <div className="dot end-dot" />}
        </span>

        <input
          ref={inputRef}
          type="text"
          className="location-text-field"
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
          <button type="button" className="input-clear-btn" onClick={handleClear} aria-label="Clear location">
            <X size={15} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="location-dropdown-menu" role="listbox">
          <div className="dropdown-header">
            <span>Bengaluru Urban & Rural Locations ({filtered.length} found)</span>
          </div>

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
                  <MapPin size={15} className="dropdown-pin-icon" />
                  <div className="dropdown-item-content">
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
            <div className="dropdown-empty-item">
              <Search size={14} />
              <span>No predefined location matches &ldquo;{query}&rdquo;. Tap map to choose exact spot.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
