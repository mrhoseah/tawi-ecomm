import { forwardRef, type HTMLAttributes } from "react";

const badgeVariants = {
  default:
    "border-transparent bg-red-600 text-white hover:bg-red-700",
  secondary:
    "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
  outline: "text-gray-700 border-gray-300 hover:bg-gray-50",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "default", ...props }, ref) => (
    <span
      ref={ref}
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${badgeVariants[variant]} ${className}`}
      {...props}
    />
  )
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
