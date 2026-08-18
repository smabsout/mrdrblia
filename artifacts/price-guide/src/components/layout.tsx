import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { AgeGate } from "@/components/age-gate";
import { ChatDrawer } from "@/components/chat-drawer";
import { useGetMe, useGetStats } from "@workspace/api-client-react";
import { useUser, useClerk } from "@clerk/react";
import { User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function StatsBar() {
  const { data: stats } = useGetStats();
  if (!stats) return null;

  const totalSpent = stats.portfolioTotalSpent || 0;
  const totalEst = stats.portfolioTotalEstimated || 0;
  const netGain = stats.portfolioNetGainLoss || 0;
  const ownedCount = stats.portfolioOwnedCount || 0;

  return (
    <div className="bg-secondary text-secondary-foreground text-xs py-1.5 px-4 flex flex-col md:flex-row items-center justify-between border-b gap-2">
      <div className="flex gap-6 overflow-x-auto whitespace-nowrap">
        <span><strong className="font-mono">{ownedCount.toLocaleString()}</strong> Items Owned</span>
        <span>Total Spent: <strong className="font-mono">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
        <span>Total Est. Value: <strong className="font-mono">${totalEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
        <span className="flex items-center gap-1">
          Net Gain/Loss: 
          <strong className={`font-mono ${netGain > 0 ? 'text-green-600 dark:text-green-500' : netGain < 0 ? 'text-red-600 dark:text-red-500' : ''}`}>
            {netGain > 0 ? '+' : ''}${netGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </span>
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
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { data: me } = useGetMe();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  return (
    <header className="border-b bg-background sticky top-0 z-10">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg text-primary flex items-center gap-2">
          <span className="bg-primary text-white p-1 rounded">MC</span>
          My Collection
        </Link>
        
        <div className="flex-1 max-w-2xl mx-auto hidden md:block">
           {/* We put a search bar in home, but a small one in header could be useful. We'll leave it in Home for now. */}
        </div>

        <nav className="flex items-center gap-4 text-sm">
          {isLoaded && user ? (
            <>
              {me?.role === "admin" && (
                <Link href="/admin/items/pending" className="text-muted-foreground hover:text-primary transition-colors">
                  Admin
                </Link>
              )}
              <Link href="/watchlist" className="text-muted-foreground hover:text-primary transition-colors">
                Watchlist
              </Link>
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user.fullName || user.emailAddresses[0]?.emailAddress}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs h-8">
                Log Out
              </Button>
            </>
          ) : isLoaded ? (
            <>
              <Link href="/sign-in" className="text-muted-foreground hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up">
                <Button size="sm" className="text-xs h-8">Sign Up</Button>
              </Link>
            </>
          ) : null}
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
      <ChatDrawer />
      <footer className="border-t py-6 bg-muted mt-auto">
        <div className="container mx-auto px-4 text-xs text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            &copy; {new Date().getFullYear()} My Collection. All data is for informational purposes.
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