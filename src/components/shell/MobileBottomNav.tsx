import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

type Props = {
  items: MobileNavItem[];
  className?: string;
};

/**
 * Sticky bottom tab bar shown only on phones (<lg). Honors iOS safe-area inset.
 * Pair the parent layout with `pb-mobile-nav` on its main scroll area.
 */
const MobileBottomNav = ({ items, className }: Props) => {
  return (
    <nav
      className={cn(
        "lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-pb",
        className,
      )}
      aria-label="Primary"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "tap-44 flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium leading-tight transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span className="truncate max-w-full px-1">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
