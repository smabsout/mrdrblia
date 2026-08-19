import { Link } from "wouter";
import { useGetWatchlist, getGetWatchlistQueryKey, useGetMe } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Eye, AlertCircle, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Watchlist() {
  const { data: me } = useGetMe();
  const { user } = useUser();
  const { data: watchlist, isLoading } = useGetWatchlist({
    query: { enabled: !!user, queryKey: getGetWatchlistQueryKey() }
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Bookmark className="w-6 h-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold mb-2">Watchlist</h1>
        <p className="text-sm text-muted-foreground mb-6">Sign in to track items you're watching.</p>
        <Link href="/sign-in" className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-xl font-semibold tracking-tight mb-6">Your Watchlist</h1>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-14 animate-pulse" />
          ))}
        </div>
      ) : watchlist?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Bookmark className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No watched items</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Browse the catalog and watch items to track their value over time.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-1/3">Item Name</th>
                <th>Category</th>
                <th>Year</th>
                <th>Authenticator</th>
                <th className="text-right">Median Est.</th>
                <th>Confidence</th>
                <th className="text-center w-16">Watch</th>
              </tr>
            </thead>
            <tbody>
              {watchlist?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link
                      href={`/items/${item.slug}`}
                      className="text-foreground font-medium hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      {item.name}
                      {item.status === "pending" && (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </Link>
                  </td>
                  <td className="text-muted-foreground">{item.category}</td>
                  <td className="text-muted-foreground">{item.year || "-"}</td>
                  <td className="text-muted-foreground">{item.authenticator || "-"}</td>
                  <td className="text-right font-mono text-sm">
                    {item.medianEstimate
                      ? `$${item.medianEstimate.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                      : "-"}
                  </td>
                  <td>
                    {item.confidence ? (
                      <span
                        className={cn(
                          "inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border",
                          item.confidence === "high" && "badge-confidence-high",
                          item.confidence === "medium" && "badge-confidence-medium",
                          item.confidence === "low" && "badge-confidence-low"
                        )}
                      >
                        {item.confidence}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3 text-primary" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
