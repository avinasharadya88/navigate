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
    <div className="road-search-wrapper" ref={containerRef}>
      <div className="road-input-box">
        <Search size={16} className="road-search-icon" />

        <input
          ref={inputRef}
          type="text"
          className="road-text-field"
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
            className="input-clear-btn"
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
          className="road-dropdown-toggle-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          title="Toggle Bangalore roads dropdown"
        >
          <ChevronDown size={16} className={isOpen ? "rotate-180" : ""} />
        </button>
      </div>

      {isOpen && (
        <div className="road-dropdown-menu" role="listbox">
          <div className="dropdown-header">
            <span>
              Bangalore Roads & Highways ({filtered.length} {filtered.length === 1 ? "road" : "roads"})
            </span>
            <small>Click to select or type custom</small>
          </div>

          <div className="dropdown-scroll-list">
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
                    <Navigation2 size={15} className="dropdown-road-icon" />
                    <div className="dropdown-item-content">
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
              <div className="dropdown-empty-item">
                <span>&ldquo;{value}&rdquo; not in preset list. Your custom road label will be submitted.</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
