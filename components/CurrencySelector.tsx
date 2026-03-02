"use client";

import { useCurrency } from "@/contexts/CurrencyContext";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>{currency === "KES" ? "KES" : "USD"}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 min-w-[100px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          <button
            type="button"
            role="option"
            aria-selected={currency === "KES"}
            onClick={() => {
              setCurrency("KES");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${currency === "KES" ? "bg-gray-50 font-medium" : ""}`}
          >
            KES (Kenya)
          </button>
          <button
            type="button"
            role="option"
            aria-selected={currency === "USD"}
            onClick={() => {
              setCurrency("USD");
              setOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${currency === "USD" ? "bg-gray-50 font-medium" : ""}`}
          >
            USD
          </button>
        </div>
      )}
    </div>
  );
}
