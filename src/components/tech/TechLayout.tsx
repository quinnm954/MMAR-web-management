import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Wrench, ClipboardCheck, LogOut, LayoutDashboard, Users, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import MobileBottomNav from "@/components/shell/MobileBottomNav";
import { useSwipeTabNav } from "@/hooks/useSwipeTabNav";

const primary = [
  { to: "/tech", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/tech/jobs", label: "Jobs", icon: Wrench },
  { to: "/tech/inspections", label: "Inspect", icon: ClipboardCheck },
];

const more = [
  { to: "/tech/customers", label: "Customers", icon: Users },
  { to: "/tech/history", label: "Service History", icon: History },
];

const allDesktop = [...primary, ...more];

const TechLayout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  useSwipeTabNav(primary);
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card safe-pt">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-base font-bold leading-tight">Garage Ace · Tech</h1>
              <p className="text-[10px] text-muted-foreground">Mike's Mobile Auto Repair</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="tap-44" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="h-4 w-4 mr-1" /> Sign out
          </Button>
        </div>
        {/* Desktop top tabs */}
        <nav className="hidden lg:flex container mx-auto px-2 pb-2 gap-1 overflow-x-auto">
          {allDesktop.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={(l as any).end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="container mx-auto px-4 py-6 pb-mobile-nav lg:pb-6">{children}</div>
      <MobileBottomNav items={primary} moreItems={more} />
    </main>
  );
};

export default TechLayout;
