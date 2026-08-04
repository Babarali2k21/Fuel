"use client";

import { Loader2, MapPin } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { useTranslation } from "@/i18n/provider";
import { api, type GeocodeSearchResult } from "@/lib/api";

interface AddressAutocompleteProps {
  label: string;
  placeholder: string;
  value: string;
  locale: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodeSearchResult) => void;
  onSubmit?: () => void;
}

export function AddressAutocomplete({
  label,
  placeholder,
  value,
  locale,
  onChange,
  onSelect,
  onSubmit,
}: AddressAutocompleteProps) {
  const { t } = useTranslation();
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      api
        .geocodeSuggest(query, locale)
        .then((results) => {
          setSuggestions(results);
          setOpen(results.length > 0);
          setActiveIndex(-1);
        })
        .catch(() => {
          setSuggestions([]);
          setOpen(false);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [value, locale]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pickSuggestion = (result: GeocodeSearchResult) => {
    onChange(result.display_name);
    onSelect(result);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block">
        <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
          <MapPin className="h-3.5 w-3.5" />
          {label}
        </span>
        <div className="relative">
          <input
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            className="input-field pr-10"
            placeholder={placeholder}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                if (open && suggestions.length > 0) {
                  event.preventDefault();
                  const index = activeIndex >= 0 ? activeIndex : 0;
                  pickSuggestion(suggestions[index]);
                  return;
                }
                if (onSubmit && value.trim().length >= 3) {
                  event.preventDefault();
                  onSubmit();
                }
                return;
              }

              if (!open || suggestions.length === 0) return;

              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(index - 1, 0));
              } else if (event.key === "Escape") {
                setOpen(false);
              }
            }}
          />
          {loading && (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-300" />
          )}
        </div>
      </label>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] py-1 shadow-xl ring-1 ring-black/20"
        >
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.latitude}-${suggestion.longitude}-${index}`} role="option">
              <button
                type="button"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => pickSuggestion(suggestion)}
                className={`flex w-full flex-col items-start px-3 py-2.5 text-left transition ${
                  index === activeIndex
                    ? "bg-teal-400/10 text-teal-100"
                    : "text-[var(--text-secondary)] hover:bg-white/5"
                }`}
              >
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {suggestion.display_name}
                </span>
                {suggestion.state && (
                  <span className="text-xs text-[var(--text-muted)]">{suggestion.state}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && value.trim().length >= 2 && open && suggestions.length === 0 && (
        <p className="mt-2 rounded-xl border border-[var(--border)] bg-black/20 px-3 py-2 text-xs text-[var(--text-muted)]">
          {t("home.noAddressSuggestions")}
        </p>
      )}
    </div>
  );
}
