"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import {
  Value,
  Country,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumber,
  isValidPhoneNumber as defaultIsValidPhoneNumber,
} from "react-phone-number-input";
import RPNInput from "react-phone-number-input/input";
import flags from "react-phone-number-input/flags";
import { ChevronDown, Search, Check } from "lucide-react";
import enLabels from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";

// ─── Validation helper ───────────────────────────────────────────────
export function isValidPhoneNumber(value?: string): boolean {
  if (!value) return false;
  try {
    return defaultIsValidPhoneNumber(value);
  } catch {
    return false;
  }
}

// ─── Auto-detect Country from phone number ───────────────────────────
export function getCountryFromPhoneNumber(value?: string, fallback: Country = "BD"): Country {
  if (!value || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  try {
    const parsed = parsePhoneNumber(trimmed.startsWith("+") ? trimmed : `+${trimmed}`);
    if (parsed && parsed.country) {
      return parsed.country as Country;
    }
  } catch {
    // continue to fallback
  }

  // Fallback: match prefix against all countries sorted by longest calling code
  if (trimmed.startsWith("+")) {
    const countries = getCountries();
    const sorted = [...countries].sort(
      (a, b) => getCountryCallingCode(b).length - getCountryCallingCode(a).length
    );
    for (const c of sorted) {
      const dialCode = `+${getCountryCallingCode(c)}`;
      if (trimmed.startsWith(dialCode)) {
        return c;
      }
    }
  }

  return fallback;
}

// ─── Country Flag Component (Vector SVG flag from react-phone-number-input) ─────────
export function CountryFlag({
  country,
  className = "w-4 h-3",
}: {
  country?: Country | string;
  className?: string;
}) {
  if (!country) return <span className="text-xs">🌐</span>;
  const FlagComponent = flags[country as Country];
  if (!FlagComponent) return <span className="text-xs">🌐</span>;

  return (
    <span className={`inline-flex items-center justify-center flex-shrink-0 overflow-hidden rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.1)] border border-gray-200 dark:border-slate-700 bg-white ${className}`}>
      <FlagComponent title={String(country)} />
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────
export interface PhoneInputProps {
  value?: string;
  onChange?: (value?: string) => void;
  defaultCountry?: Country;
  placeholder?: string;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  name?: string;
  id?: string;
  onBlur?: () => void;
  /** Use light theme (dark text on white bg) for use inside white modals/cards */
  light?: boolean;
  /** Adapt to the app theme automatically (light by default, dark via `dark:` classes). Overrides `light`. */
  auto?: boolean;
}

// ─── Country Dropdown Portal ──────────────────────────────────────────
interface CountryDropdownPortalProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  isOpen: boolean;
  onClose: () => void;
  selectedCountry: Country;
  onSelect: (country: Country) => void;
}

function CountryDropdownPortal({
  anchorRef,
  isOpen,
  onClose,
  selectedCountry,
  onSelect,
}: CountryDropdownPortalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 260 });

  const allCountries = getCountries();

  const filteredCountries = allCountries.filter((country) => {
    const name = ((enLabels as any)[country] || country).toLowerCase();
    const code = country.toLowerCase();
    const callingCode = getCountryCallingCode(country);
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      name.includes(query) ||
      code.includes(query) ||
      `+${callingCode}`.includes(query) ||
      callingCode.includes(query)
    );
  });

  // Calculate position based on button anchor
  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    // Never wider than the screen on small phones
    const dropdownWidth = Math.min(280, viewportWidth - 16);
    let left = rect.left;
    if (left + dropdownWidth > viewportWidth - 8) {
      left = viewportWidth - dropdownWidth - 8;
    }
    left = Math.max(8, left);
    // Flip above the button when there isn't enough room below (e.g. keyboard open / bottom sheet)
    const dropdownHeight = 300;
    const spaceBelow = viewportHeight - rect.bottom;
    const top =
      spaceBelow < dropdownHeight && rect.top > spaceBelow
        ? Math.max(8, rect.top - Math.min(dropdownHeight, rect.top - 8) - 6)
        : rect.bottom + 6;
    setPosition({ top, left, width: dropdownWidth });
  }, [anchorRef]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen, updatePosition]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      )
        return;
      onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 99999,
      }}
    >
      {/* Scrollbar styles */}
      <style>{`
        .pni-scroll::-webkit-scrollbar { width: 5px; }
        .pni-scroll::-webkit-scrollbar-track { background: transparent; }
        .pni-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 99px; }
        .pni-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>

      <div
        className="flex flex-col overflow-hidden rounded-xl border border-white/10 shadow-2xl"
        style={{
          background: "rgba(10, 15, 30, 0.97)",
          backdropFilter: "blur(24px)",
          maxHeight: "min(288px, calc(100vh - 80px))",
        }}
      >
        {/* Search */}
        <div className="p-2 border-b border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.08] rounded-lg px-2.5 py-1.5">
            <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search country or dial code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-white placeholder:text-white/30 text-base sm:text-xs leading-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto pni-scroll p-1 space-y-px">
          {filteredCountries.length === 0 ? (
            <div className="py-4 text-center text-xs text-white/40">
              No country found
            </div>
          ) : (
            filteredCountries.map((country) => {
              const Flag = flags[country];
              const callingCode = getCountryCallingCode(country);
              const countryName = (enLabels as any)[country] || country;
              const isSelected = country === selectedCountry;

              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => {
                    onSelect(country);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2.5 sm:py-[7px] rounded-lg text-[13px] sm:text-[12px] transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                      : "text-white/75 hover:text-white hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-[18px] h-[13px] flex items-center justify-center overflow-hidden rounded-[2px] flex-shrink-0 bg-slate-800">
                      {Flag ? (
                        <Flag title={country} />
                      ) : (
                        <span className="text-[8px] text-white/60">
                          {country}
                        </span>
                      )}
                    </div>
                    <span className="truncate leading-none">{countryName}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    <span className="font-mono text-[11px] text-emerald-400/70">
                      +{callingCode}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-emerald-400 ml-0.5" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── PhoneInput Component ────────────────────────────────────────────
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      defaultCountry = "BD",
      placeholder = "Enter phone number",
      disabled = false,
      hasError = false,
      light = false,
      auto = false,
      className = "",
      name,
      id,
      onBlur,
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [selectedCountryOverride, setSelectedCountryOverride] = useState<Country | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Compute effective country synchronously during render to prevent react-phone-number-input mismatch errors
    const effectiveCountry: Country = useMemo(() => {
      if (selectedCountryOverride) return selectedCountryOverride;
      if (value && typeof value === "string" && value.trim().startsWith("+")) {
        return getCountryFromPhoneNumber(value, defaultCountry);
      }
      return defaultCountry;
    }, [selectedCountryOverride, value, defaultCountry]);

    // Reset override if value is changed externally to a different country dial code
    const prevValueRef = useRef(value);
    useEffect(() => {
      if (value !== prevValueRef.current) {
        prevValueRef.current = value;
        if (value && typeof value === "string" && value.trim().startsWith("+")) {
          const detected = getCountryFromPhoneNumber(value, defaultCountry);
          if (selectedCountryOverride && detected !== selectedCountryOverride) {
            try {
              const currentDial = `+${getCountryCallingCode(selectedCountryOverride)}`;
              if (!value.trim().startsWith(currentDial)) {
                setSelectedCountryOverride(null);
              }
            } catch {
              setSelectedCountryOverride(null);
            }
          }
        }
      }
    }, [value, defaultCountry, selectedCountryOverride]);

    const FlagComponent = flags[effectiveCountry];
    const inputRef = useRef<HTMLInputElement | null>(null);

    // ── Theme classes ──
    const wrapperCls = auto
      ? hasError
        ? "h-11 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-400 dark:border-rose-700 ring-4 ring-rose-500/10 shadow-xs"
        : "h-11 rounded-xl bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 shadow-xs"
      : hasError
      ? light
        ? "rounded-lg bg-red-50 border-red-400 ring-1 ring-red-300"
        : "rounded-lg bg-rose-500/5 border-rose-500/35 ring-1 ring-rose-500/10"
      : light
      ? "rounded-lg bg-white border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20"
      : "rounded-lg bg-white/[0.05] border-white/[0.08] focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/15 focus-within:bg-white/[0.07]";

    const buttonCls = auto
      ? "h-full px-3 rounded-l-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 border-r border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
      : light
      ? "py-[11px] px-3 rounded-l-[10px] hover:bg-gray-100 border-gray-200 text-gray-700 hover:text-gray-900"
      : "py-[11px] px-3 rounded-l-[10px] hover:bg-white/[0.06] border-white/[0.08] text-white/80 hover:text-white";

    const codeCls = auto
      ? "text-indigo-600 dark:text-indigo-400"
      : light
      ? "text-indigo-600"
      : "text-emerald-400";

    const chevronCls = auto ? "text-gray-400" : light ? "text-gray-400" : "text-white/35";

    const inputCls = auto
      ? "h-full text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 py-2.5"
      : light
      ? "text-[13px] py-[11px] text-gray-900 placeholder:text-gray-400"
      : "text-[13px] py-[11px] text-white placeholder:text-white/20";

    return (
      <div className={`relative w-full ${className}`}>
        <div className={`flex items-center transition-all duration-200 ${wrapperCls}`}>
          {/* ── Country Selector ── */}
          <button
            ref={buttonRef}
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen((v) => !v)}
            aria-label={`Country code +${getCountryCallingCode(effectiveCountry)}, change country`}
            aria-expanded={isOpen}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer border-r flex-shrink-0 ${buttonCls}`}
            title="Select country"
          >
            <div className="w-[20px] h-[14px] flex items-center justify-center overflow-hidden rounded-[2px] shadow-sm flex-shrink-0 bg-slate-700">
              {FlagComponent ? (
                <FlagComponent title={effectiveCountry} />
              ) : (
                <span className="text-[9px] font-bold text-white">
                  {effectiveCountry}
                </span>
              )}
            </div>
            <span className={`text-[13px] font-mono font-semibold leading-none ${codeCls}`}>
              +{getCountryCallingCode(effectiveCountry)}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              } ${chevronCls}`}
            />
          </button>

          {/* ── Phone Number Input (Clicking anywhere focuses the input) ── */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex-1 min-w-0 h-full flex items-center px-3 cursor-text"
          >
            <RPNInput
              id={inputId}
              name={name}
              ref={(node: any) => {
                inputRef.current = node;
                if (typeof ref === "function") ref(node);
                else if (ref) (ref as any).current = node;
              }}
              value={(value as Value) || ""}
              onChange={(val) => {
                if (val && typeof val === "string" && val.startsWith("+")) {
                  const detected = getCountryFromPhoneNumber(val, effectiveCountry);
                  if (detected && detected !== effectiveCountry) {
                    try {
                      const currentDial = `+${getCountryCallingCode(effectiveCountry)}`;
                      if (!val.startsWith(currentDial)) {
                        setSelectedCountryOverride(detected);
                      }
                    } catch {
                      setSelectedCountryOverride(detected);
                    }
                  }
                }
                onChange?.(val as string | undefined);
              }}
              country={effectiveCountry}
              disabled={disabled}
              placeholder={placeholder}
              onBlur={onBlur}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className={`w-full bg-transparent outline-none leading-normal border-none ring-0 focus:ring-0 focus:outline-none tracking-wide ${inputCls}`}
            />
          </div>
        </div>

        {/* ── Portal Dropdown ── */}
        <CountryDropdownPortal
          anchorRef={buttonRef}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          selectedCountry={effectiveCountry}
          onSelect={(country) => setSelectedCountryOverride(country)}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
