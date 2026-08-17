import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Search, Gavel, Bookmark, LogOut, ShieldAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetMe({ query: { retry: false }});
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation('/');
      }
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="font-serif text-2xl font-bold text-foreground tracking-tight flex items-center gap-2 shrink-0">
            <Gavel className="w-6 h-6 text-primary" />
            <span className="hidden sm:inline">The Provenance</span>
          </Link>
          
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search the catalog..." 
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono placeholder:font-sans"
              />
            </div>
          </div>

          <nav className="flex items-center gap-4 sm:gap-6 shrink-0">
            {user ? (
              <>
                <Link href="/watchlist" className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors flex items-center gap-2">
                  <Bookmark className="w-4 h-4" /> <span className="hidden sm:inline">Watchlist</span>
                </Link>
                {user.role === 'admin' && (
                  <Link href="/admin/items/pending" className="text-sm font-bold uppercase tracking-wider text-destructive hover:text-destructive/80 transition-colors flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors">Log in</Link>
                <Link href="/register" className="text-sm font-bold uppercase tracking-wider bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t border-border bg-card mt-auto py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-4">
          <Gavel className="w-6 h-6 opacity-20" />
          <p className="font-serif italic text-lg">The Provenance Price Guide</p>
          <p className="uppercase tracking-widest text-xs opacity-60">Defensible valuations for serious collectors.</p>
          <Link href="/tos" className="hover:text-foreground underline underline-offset-4 mt-4">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
