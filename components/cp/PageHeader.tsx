import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { ADMIN_PATH } from "@/lib/constants";

interface PageHeaderProps {
  title: string;
  icon: LucideIcon;
  description?: string;
}

export function PageHeader({ title, icon: Icon, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <Link
        href={ADMIN_PATH}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        ← Dashboard
      </Link>
    </div>
  );
}
