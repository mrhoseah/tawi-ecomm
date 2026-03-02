import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  viewAllHref?: string;
  viewAllLabel?: string;
}

export default function SectionHeader({
  title,
  description,
  icon: Icon,
  viewAllHref,
  viewAllLabel,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          {Icon && <Icon className="h-7 w-7 text-red-600 shrink-0" />}
          {title}
        </h2>
        {description && (
          <p className="text-gray-600 mt-1">{description}</p>
        )}
      </div>
      {viewAllHref && viewAllLabel && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-red-600 font-semibold hover:bg-red-50 transition-colors shrink-0"
        >
          {viewAllLabel}
          <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
