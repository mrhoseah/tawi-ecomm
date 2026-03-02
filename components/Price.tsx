"use client";

import { useCurrency } from "@/contexts/CurrencyContext";

interface PriceProps {
  amount: number;
  className?: string;
  compareAt?: number | null;
  /** Show strikethrough compare-at price */
  showCompare?: boolean;
}

export default function Price({
  amount,
  className = "",
  compareAt,
  showCompare = false,
}: PriceProps) {
  const { formatPrice } = useCurrency();

  if (showCompare && compareAt != null && compareAt > amount) {
    return (
      <div className={className}>
        <span className="text-red-600 font-bold">{formatPrice(amount)}</span>
        <span className="text-gray-400 line-through text-sm ml-2">
          {formatPrice(compareAt)}
        </span>
      </div>
    );
  }

  return <span className={className}>{formatPrice(amount)}</span>;
}
