import { useGetWatchlist } from "@workspace/api-client-react";
import { ItemCard } from "@/components/item-card";
import { Link } from "wouter";
import { Bookmark, Search } from "lucide-react";

export default function Watchlist() {
  const { data: watchlistItems, isLoading } = useGetWatchlist();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b border-border pb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Bookmark className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-serif text-3xl font-bold">Your Watchlist</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">TRACKING {watchlistItems?.length || 0} ITEMS</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-muted/50 h-[400px] rounded-md animate-pulse border border-border" />
          ))}
        </div>
      ) : watchlistItems?.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-border rounded-md bg-card/50 flex flex-col items-center">
          <Bookmark className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-serif text-2xl text-foreground font-bold mb-2">Your watchlist is empty.</p>
          <p className="text-muted-foreground mb-8 max-w-md">Keep track of the items you care about by adding them to your watchlist.</p>
          <Link href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
            <Search className="w-4 h-4" /> Browse Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {watchlistItems?.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
