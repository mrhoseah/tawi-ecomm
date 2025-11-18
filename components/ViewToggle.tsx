"use client";

import { Grid, List } from "lucide-react";

type ViewMode = "grid" | "list";

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export default function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 border border-gray-300 rounded-lg overflow-hidden">
      <button
        onClick={() => onViewChange("grid")}
        className={`p-2 transition-colors ${
          view === "grid"
            ? "bg-red-600 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
        aria-label="Grid view"
      >
        <Grid className="h-5 w-5" />
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`p-2 transition-colors ${
          view === "list"
            ? "bg-red-600 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
        aria-label="List view"
      >
        <List className="h-5 w-5" />
      </button>
    </div>
  );
}

