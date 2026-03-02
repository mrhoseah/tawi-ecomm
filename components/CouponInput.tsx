"use client";

import { useState } from "react";
import { Tag, X, Loader2 } from "lucide-react";
import { useToast } from "./Toast";

export interface CouponApplyResult {
  code: string;
  discount: number;
  freeShipping: boolean;
}

interface CouponInputProps {
  onApply: (code: string, discount: number, freeShipping?: boolean) => void;
  appliedCoupon?: string | null;
  onRemove: () => void;
  subtotal?: number;
  userId?: string | null;
}

export default function CouponInput({
  onApply,
  appliedCoupon,
  onRemove,
  subtotal = 0,
  userId = null,
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleApply = async () => {
    if (!code.trim()) {
      showToast("Please enter a coupon code", "error");
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        code: code.trim(),
        subtotal: String(subtotal),
      });
      if (userId) params.set("userId", userId);
      const response = await fetch(`/api/coupons/validate?${params}`);
      const data = await response.json();

      if (!response.ok) {
        showToast(data.error || "Invalid coupon code", "error");
        return;
      }

      onApply(code, data.discount ?? 0, data.freeShipping ?? false);
      setCode("");
      showToast(`Coupon "${code}" applied successfully!`, "success");
    } catch (error) {
      showToast("Failed to apply coupon", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">
            Coupon: {appliedCoupon}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-green-600 hover:text-green-800"
          aria-label="Remove coupon"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Coupon code"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-sm"
          onKeyPress={(e) => e.key === "Enter" && handleApply()}
        />
      </div>
      <button
        onClick={handleApply}
        disabled={isLoading || !code.trim()}
        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? "Applying..." : "Apply"}
      </button>
    </div>
  );
}

