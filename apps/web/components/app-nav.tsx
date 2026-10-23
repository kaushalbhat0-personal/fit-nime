"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/log", label: "Log Workout" },
] as const;

/**
 * Authenticated-section tabs. Tiny client island (active-link state only);
 * everything else in the shell stays server-rendered.
 */
export function AppNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
              active
                ? "bg-zinc-950 text-white"
                : "text-zinc-600 hover:bg-zinc-100",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
