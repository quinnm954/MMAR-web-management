import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Wrench, Clock, ClipboardCheck, ClipboardList, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import MobileBottomNav from "@/components/shell/MobileBottomNav";

const items = [
  { to: "/tech", label: "Jobs", icon: LayoutDashboard, end: true },
  { to: "/tech/checklists", label: "Checklists", icon: ClipboardList },
  { to: "/tech/clock", label: "Clock", icon: Clock },
  { to: "/tech/inspections", label: "Inspections", icon: ClipboardCheck },
];

const TechLayout = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
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
          {items.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
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
      <MobileBottomNav items={items} />
    </main>
  );
};

export default TechLayout;
