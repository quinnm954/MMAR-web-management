import { ReactNode } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useNativePushRegistration } from "@/hooks/useNativePushRegistration";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Car,
  CreditCard,
  Calendar,
  ClipboardList,
  Receipt,
  LogOut,
  Wrench,
  FileText,
  Menu,
  ChevronDown,
} from "lucide-react";
import mmarLogo from "@/assets/mmar-logo.jpeg";

const navItems = [
  { to: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portal/vehicles", label: "My Vehicles", icon: Car },
  { to: "/portal/membership", label: "Membership", icon: CreditCard },
  { to: "/portal/appointments", label: "Appointments", icon: Calendar },
  { to: "/portal/estimates", label: "Estimates", icon: FileText },
  { to: "/portal/repair-orders", label: "Repair Orders", icon: Wrench },
  { to: "/portal/service-history", label: "Service History", icon: ClipboardList },
  { to: "/portal/invoices", label: "Invoices", icon: Receipt },
  { to: "/portal/financing", label: "Financing", icon: CreditCard },
];

const PortalLayout = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  useNativePushRegistration();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar (desktop) / top bar (mobile) */}
      <aside className="lg:w-64 lg:min-h-screen lg:flex lg:flex-col border-r border-border bg-card/50 backdrop-blur">
        <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={mmarLogo} alt="MMAR" className="h-10 w-auto rounded shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-primary" /> MMAR Care
              </div>
              <div className="text-xs text-muted-foreground truncate">{user?.email ?? "Powered by MMAR"}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden shrink-0" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sign Out
          </Button>
        </div>
        <nav className="p-2 lg:p-4 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/portal/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden lg:block p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2 truncate">{user?.email}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-8 max-w-6xl">
        {children}
      </main>
    </div>
  );
};

export default PortalLayout;
