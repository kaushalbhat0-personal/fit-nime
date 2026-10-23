import Image from "next/image";
import { cn } from "@/lib/utils";

export type CompanionVariant = "default" | "celebrate" | "level-up";

/**
 * Static asset contract for the motivational companion (RCCF-008).
 * One shared illustration is reused across all slots; variant emphasis
 * comes from CSS, not extra artwork. To use supplied renders later, point
 * a slot at `/character/<slot>.png` — see public/character/README.md.
 * Presentation only: nothing here touches XP, stats, auth, or the DB.
 */
export const COMPANION_ASSETS: Record<CompanionVariant, string> = {
  default: "/character/companion.svg",
  celebrate: "/character/companion.svg",
  "level-up": "/character/companion.svg",
};

/**
 * Presentation-only threshold for the "large session" treatment. This is
 * not an XP rule: 100 XP opens level 2 on the v1 curve, so a single
 * workout at or above it is genuinely a big session. The authoritative
 * award is unaffected.
 */
export const LARGE_WORKOUT_XP = 100;

/** Variant for the completion moment. Pure: safe to unit-test. */
export function pickCelebrationVariant(args: {
  leveledUp?: boolean;
  totalXp?: number | null;
}): CompanionVariant {
  if (args.leveledUp) {
    return "level-up";
  }
  if ((args.totalXp ?? 0) >= LARGE_WORKOUT_XP) {
    return "celebrate";
  }
  return "default";
}

/** Short encouraging line per variant. Never guilt or streak pressure. */
export function companionLineFor(variant: CompanionVariant): string {
  switch (variant) {
    case "level-up":
      return "Your companion is celebrating with you.";
    case "celebrate":
      return "Big session — your companion noticed.";
    default:
      return "Your companion trained alongside you.";
  }
}

const VARIANT_ANIMATION: Record<CompanionVariant, string> = {
  default: "companion-enter",
  celebrate: "companion-enter companion-celebrate",
  "level-up": "companion-enter companion-level-up",
};

/**
 * Decorative companion figure. Always `aria-hidden`: meaning lives in the
 * adjacent heading/caption, so missing art can never break the flow or
 * screen-reader output. Renders in server and client components alike —
 * no data fetching, no state.
 */
export function CompanionFigure({
  variant = "default",
  size = 96,
  priority = false,
  className,
}: {
  variant?: CompanionVariant;
  size?: number;
  /** Above-the-fold instances only — clears the LCP warning. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "companion mx-auto inline-flex",
        VARIANT_ANIMATION[variant],
        className,
      )}
    >
      <Image
        src={COMPANION_ASSETS[variant]}
        alt=""
        width={size}
        height={size}
        priority={priority}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
