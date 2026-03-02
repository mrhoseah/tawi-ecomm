"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Team = { id: string; name: string; slug: string };

type TeamComboboxProps = {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
};

export function TeamCombobox({
  value,
  onChange,
  placeholder = "Select team…",
  disabled,
  required,
  "aria-label": ariaLabel,
}: TeamComboboxProps) {
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/teams?limit=100&includeInactive=true");
      const d = await r.json();
      setTeams(d.teams ?? []);
    } catch {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && teams.length === 0) fetchTeams();
  }, [open, teams.length, fetchTeams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) =>
      t.name.toLowerCase().includes(q)
    );
  }, [teams, search]);

  const handleSelect = (team: Team) => {
    onChange(team.name);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-left text-base shadow-xs outline-none transition-colors",
            "border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "disabled:pointer-events-none disabled:opacity-50",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-[200px] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search teams…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="h-8"
          />
        </div>
        <div className="max-h-[220px] overflow-y-auto p-1">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No teams found
            </div>
          ) : (
            filtered.map((team) => (
              <button
                key={team.id}
                type="button"
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  value === team.name && "bg-accent text-accent-foreground"
                )}
                onClick={() => handleSelect(team)}
              >
                {team.name}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
