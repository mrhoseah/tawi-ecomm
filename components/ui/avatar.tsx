"use client";

import { forwardRef } from "react";

const COLORS = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-amber-500",
  "bg-violet-500", "bg-rose-500", "bg-teal-500", "bg-indigo-500",
];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
};

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, fallback = "", size = "md", className = "", ...props }, ref) => {
    const initials = fallback ? getInitials(fallback) : "?";
    const colorClass = getColor(fallback || "default");
    const sizeClass = sizeClasses[size];

    return (
      <div
        ref={ref}
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClass} ${className}`}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt || fallback} className="aspect-square h-full w-full object-cover" />
        ) : (
          <span className={`flex h-full w-full items-center justify-center font-semibold text-white ${colorClass}`}>
            {initials}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
export { Avatar, getInitials, getColor };
