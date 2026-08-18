import { Link } from "wouter";
import { useGetWatchlist, getGetWatchlistQueryKey, useGetMe } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Eye, AlertCircle } from "lucide-react";

export default function Watchlist() {
  const { data: me } = useGetMe();
  const { user } = useUser();
  const { data: watchlist, isLoading } = useGetWatchlist({
    query: { enabled: !!user, queryKey: getGetWatchlistQueryKey() }
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <h1 className="text-2xl font-bold mb-4">Watchlist</h1>
        <p className="text-muted-foreground mb-6">Please sign in to view your watchlist.</p>
        <Link href="/sign-in" className="text-primary hover:underline">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Watchlist</h1>

      <div className="bg-white border rounded shadow-sm overflow-x-auto">
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
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading watchlist...
                </td>
              </tr>
            ) : watchlist?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  Your watchlist is empty.
                </td>
              </tr>
            ) : (
              watchlist?.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link href={`/items/${item.slug}`} className="text-primary font-medium hover:underline flex items-center gap-1.5">
                      {item.name}
                      {item.status === 'pending' && <AlertCircle className="w-3.5 h-3.5 text-orange-500 inline" />}
                    </Link>
                  </td>
                  <td className="text-muted-foreground">{item.category}</td>
                  <td className="text-muted-foreground">{item.year || "-"}</td>
                  <td className="text-muted-foreground">{item.authenticator || "-"}</td>
                  <td className="text-right font-mono font-medium">
                    {item.medianEstimate ? `$${item.medianEstimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                  </td>
                  <td>
                    {item.confidence ? (
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        item.confidence === 'high' ? 'bg-green-100 text-green-800' :
                        item.confidence === 'medium' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.confidence}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}