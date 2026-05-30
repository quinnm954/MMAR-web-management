import { ReactNode } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { portalStrings } from "@/lib/portalStrings";
import { useNativePushRegistration } from "@/hooks/useNativePushRegistration";
import { useSwipeTabNav } from "@/hooks/useSwipeTabNav";
import { Button } from "@/components/ui/button";
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
  AlertTriangle,
  ClipboardCheck,
} from "lucide-react";
import MobileBottomNav from "@/components/shell/MobileBottomNav";
import InstallAppBanner from "@/components/shell/InstallAppBanner";
import mmarLogo from "@/assets/mmar-logo.jpeg";

const navItems = [
  { to: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portal/vehicles", label: "My Vehicles", icon: Car },
  { to: "/portal/maintenance", label: "Maintenance Log", icon: Wrench },
  { to: "/portal/membership", label: "Membership", icon: CreditCard },
  { to: "/portal/appointments", label: "Appointments", icon: Calendar },
  { to: "/portal/estimates", label: "Estimates", icon: FileText },
  { to: "/portal/repair-orders", label: "Repair Orders", icon: Wrench },
  { to: "/portal/service-history", label: "Service History", icon: ClipboardList },
  { to: "/portal/checklists", label: "Recommendations", icon: AlertTriangle },
  { to: "/portal/vehicle-health", label: "Vehicle Health", icon: ClipboardList },
  { to: "/portal/inspections", label: "Inspections", icon: ClipboardCheck },
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

  const location = useLocation();
  const currentItem =
    navItems.find((i) =>
      i.to === "/portal/dashboard"
        ? location.pathname === i.to
        : location.pathname.startsWith(i.to)
    ) ?? navItems[0];

  const bottomNavItems = [
    { to: "/portal/dashboard", label: "Home", icon: LayoutDashboard, end: true },
    { to: "/portal/vehicles", label: "Vehicles", icon: Car },
    { to: "/portal/appointments", label: "Book", icon: Calendar },
    { to: "/portal/vehicle-health", label: "Health", icon: ClipboardList },
  ];

  const moreNavItems = navItems.filter(
    (n) => !bottomNavItems.some((b) => b.to === n.to),
  );

  useSwipeTabNav(bottomNavItems);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile top bar - logo + sign out only; primary nav lives in the bottom bar */}
      <div className="lg:hidden sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur safe-pt">
        <div className="px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={mmarLogo} alt="MMAR" className="h-9 w-auto rounded shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-primary" /> {portalStrings.platform.name}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">{currentItem.label}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 tap-44" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex lg:w-64 lg:min-h-screen lg:flex-col border-r border-border bg-card/50 backdrop-blur">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <img src={mmarLogo} alt="MMAR" className="h-10 w-auto rounded shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-sm flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-primary" /> {portalStrings.platform.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">{user?.email ?? portalStrings.platform.headerTagline}</div>
          </div>
        </div>
        <nav className="p-4 flex flex-col gap-1 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/portal/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
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
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2 truncate">{user?.email}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-8 max-w-6xl pb-mobile-nav lg:pb-8">
        <InstallAppBanner />
        {children}
      </main>

      <MobileBottomNav
        items={bottomNavItems}
        moreItems={moreNavItems}
        moreFooter={
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground truncate px-1">{user?.email}</div>
            <Button variant="outline" className="w-full tap-44" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default PortalLayout;
