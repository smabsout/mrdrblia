import { type ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChatDrawer } from "@/components/chat-drawer";
import { useGetMe, useGetStats } from "@workspace/api-client-react";
import { useUser, useClerk } from "@clerk/react";
import {
  LayoutDashboard,
  Bookmark,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function StatsBar() {
  const { data: stats } = useGetStats();
  if (!stats) return null;

  const totalSpent = stats.portfolioTotalSpent || 0;
  const totalEst = stats.portfolioTotalEstimated || 0;
  const netGain = stats.portfolioNetGainLoss || 0;
  const ownedCount = stats.portfolioOwnedCount || 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="stat-card">
        <div className="stat-label flex items-center gap-1.5">
          <Package className="w-3 h-3" />
          Items Owned
        </div>
        <div className="stat-value">{ownedCount}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label flex items-center gap-1.5">
          <DollarSign className="w-3 h-3" />
          Total Spent
        </div>
        <div className="stat-value">
          ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label flex items-center gap-1.5">
          <DollarSign className="w-3 h-3" />
          Est. Value
        </div>
        <div className="stat-value">
          ${totalEst.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label flex items-center gap-1.5">
          {netGain >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          Net Gain/Loss
        </div>
        <div className={cn(
          "stat-value",
          netGain > 0 && "text-emerald-400",
          netGain < 0 && "text-red-400",
        )}>
          {netGain > 0 ? "+" : ""}${netGain.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, icon: Icon, label, active }: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: me } = useGetMe();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/watchlist", icon: Bookmark, label: "Watchlist" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
    ...(me?.role === "admin"
      ? [{ href: "/admin/items/pending", icon: Settings, label: "Admin" }]
      : []),
  ];

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">TP</span>
              </div>
              <span className="font-semibold text-sm hidden sm:block">The Provenance</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={
                    item.href === "/"
                      ? location === "/"
                      : location.startsWith(item.href)
                  }
                />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/collection/add">
              <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-xs h-8">
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Item</span>
              </Button>
            </Link>
            <div className="hidden md:flex items-center gap-2 ml-2 text-sm text-muted-foreground">
              <span className="text-xs">{user?.fullName || user?.emailAddresses[0]?.emailAddress}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-8 w-8 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  (item.href === "/" ? location === "/" : location.startsWith(item.href))
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
              </Link>
            ))}
            <div className="border-t border-border pt-3 mt-3 px-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {user?.fullName || user?.emailAddresses[0]?.emailAddress}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="h-7 text-xs text-muted-foreground"
                >
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export { StatsBar };

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Header />
      <main className="flex-1 pb-12">{children}</main>
      <ChatDrawer />
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-xs text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
          <div>&copy; {new Date().getFullYear()} The Provenance. All data is for informational purposes.</div>
          <div className="flex gap-4">
            <Link href="/tos" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
