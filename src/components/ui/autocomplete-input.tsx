import * as React from "react";
import { cn } from "@/components/ui/button";

export interface AutoCompleteInputProps {
  id?: string;
  placeholder?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  /** Async function that receives the current query and returns an array of suggestion strings. */
  fetchSuggestions: (query: string) => Promise<string[]>;
  /** Optional debounce delay in ms (default 300) */
  debounceDelay?: number;
  /** Maximum number of suggestions to display (default 5) */
  maxSuggestions?: number;
}

export function AutoCompleteInput({
  id,
  placeholder,
  value,
  onChange,
  fetchSuggestions,
  debounceDelay = 300,
  maxSuggestions = 5,
}: AutoCompleteInputProps) {
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const [highlightIndex, setHighlightIndex] = React.useState(-1);
  const debounceTimer = React.useRef<number | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounced fetch
  React.useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    if (!value) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceTimer.current = window.setTimeout(() => {
      fetchSuggestions(value).then((results) => {
        const limited = results.slice(0, maxSuggestions);
        setSuggestions(limited);
        setOpen(limited.length > 0);
        setHighlightIndex(-1);
      });
    }, debounceDelay);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [value, fetchSuggestions, debounceDelay, maxSuggestions]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      const chosen = suggestions[highlightIndex];
      onChange(chosen);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          ""
        )}
      />
      {open && (
        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-muted max-h-60 overflow-y-auto">
          {suggestions.map((s, idx) => (
            <li
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(s);
              }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 ${idx === highlightIndex ? "bg-muted" : ""}`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
