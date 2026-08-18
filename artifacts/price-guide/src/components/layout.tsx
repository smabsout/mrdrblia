import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { AgeGate } from "@/components/age-gate";
import { useGetMe, useLogout, useGetStats } from "@workspace/api-client-react";
import { Search, User, Menu, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function StatsBar() {
  const { data: stats } = useGetStats();
  if (!stats) return null;

  return (
    <div className="bg-secondary text-secondary-foreground text-xs py-1.5 px-4 flex items-center justify-between border-b">
      <div className="flex gap-6 overflow-x-auto whitespace-nowrap">
        <span><strong className="font-mono">{stats.totalItems.toLocaleString()}</strong> Items Tracked</span>
        <span><strong className="font-mono">{stats.verifiedSales.toLocaleString()}</strong> Verified Sales</span>
      </div>
      <div className="hidden md:flex gap-6 whitespace-nowrap">
        {stats.pendingVerification > 0 && (
          <span className="text-orange-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <strong className="font-mono">{stats.pendingVerification}</strong> Pending Verifications
          </span>
        )}
      </div>
    </div>
  );
}

function Header() {
  const { data: me } = useGetMe();
  const logout = useLogout();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/login"),
    });
  };

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded">PG</span>
          PriceGuide
        </Link>
        
        <div className="flex-1 max-w-2xl mx-auto hidden md:block">
           {/* We put a search bar in home, but a small one in header could be useful. We'll leave it in Home for now. */}
        </div>

        <nav className="flex items-center gap-4 text-sm">
          {me ? (
            <>
              {me.role === "admin" && (
                <Link href="/admin/items/pending" className="text-muted-foreground hover:text-primary transition-colors">
                  Admin
                </Link>
              )}
              <Link href="/watchlist" className="text-muted-foreground hover:text-primary transition-colors">
                Watchlist
              </Link>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{me.displayName || me.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs h-8">
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                Log In
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-xs h-8">Register</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <AgeGate />
      <StatsBar />
      <Header />
      <main className="flex-1 pb-12">
        {children}
      </main>
      <footer className="border-t py-6 bg-muted mt-auto">
        <div className="container mx-auto px-4 text-xs text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} PriceGuide. All data is for informational purposes.
          </div>
          <div className="flex gap-4">
            <Link href="/tos" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}