import { NavLink } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { Menu, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export type MobileNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

type Props = {
  items: MobileNavItem[];
  moreItems?: MobileNavItem[];
  moreFooter?: ReactNode;
  className?: string;
};

/**
 * Sticky bottom tab bar shown only on phones (<lg). Honors iOS safe-area inset.
 * Large 56px+ tap targets. Optional "More" sheet shows secondary nav items.
 * Pair the parent layout with `pb-mobile-nav` on its main scroll area.
 */
const MobileBottomNav = ({ items, moreItems, moreFooter, className }: Props) => {
  const [open, setOpen] = useState(false);
  const totalCols = items.length + (moreItems && moreItems.length > 0 ? 1 : 0);

  const tabClass = (isActive: boolean) =>
    cn(
      "flex flex-col items-center justify-center gap-1 px-1 py-2 min-h-14 text-[11px] font-medium leading-tight transition-colors active:bg-muted/60",
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <nav
      className={cn(
        "lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur safe-pb",
        className,
      )}
      aria-label="Primary"
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
      >
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink to={to} end={end} className={({ isActive }) => tabClass(isActive)}>
              <Icon className="h-6 w-6" />
              <span className="truncate max-w-full px-1">{label}</span>
            </NavLink>
          </li>
        ))}

        {moreItems && moreItems.length > 0 && (
          <li>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button type="button" className={tabClass(false) + " w-full"} aria-label="More">
                  <Menu className="h-6 w-6" />
                  <span>More</span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto safe-pb">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-4 grid grid-cols-1 gap-1">
                  {moreItems.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-medium min-h-14",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted",
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </NavLink>
                  ))}
                </div>
                {moreFooter && <div className="mt-4 pt-4 border-t border-border">{moreFooter}</div>}
              </SheetContent>
            </Sheet>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
