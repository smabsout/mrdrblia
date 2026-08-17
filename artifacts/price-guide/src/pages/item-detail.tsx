import { useRoute, Link } from "wouter";
import { 
  useGetItem, 
  useGetItemValuation, 
  useGetItemSales, 
  useGetItemComps, 
  getGetItemQueryKey,
  getGetItemValuationQueryKey,
  getGetItemSalesQueryKey,
  getGetItemCompsQueryKey,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  useGetMe,
  useGetWatchlist
} from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Eye, EyeOff, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function ItemDetail() {
  const [, params] = useRoute("/items/:slug");
  const slug = params?.slug;
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();

  const { data: item, isLoading } = useGetItem(slug!, {
    query: { enabled: !!slug, queryKey: getGetItemQueryKey(slug!) }
  });

  const { data: valuation } = useGetItemValuation(slug!, {
    query: { enabled: !!slug, queryKey: getGetItemValuationQueryKey(slug!) }
  });

  const { data: sales } = useGetItemSales(slug!, {
    query: { enabled: !!slug, queryKey: getGetItemSalesQueryKey(slug!) }
  });

  const { data: comps } = useGetItemComps(slug!, {
    query: { enabled: !!slug, queryKey: getGetItemCompsQueryKey(slug!) }
  });

  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!item) return <div className="p-8 text-center text-red-500">Item not found.</div>;

  const toggleWatch = () => {
    if (item.isWatched) {
      removeFromWatchlist.mutate({ itemId: item.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(slug!) });
        }
      });
    } else {
      addToWatchlist.mutate({ data: { itemId: item.id } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(slug!) });
        }
      });
    }
  };

  // Build price matrix
  const conditions = ["poor", "fair", "good", "excellent", "mint"];
  const authStatuses = ["unauthenticated", "authenticated"];

  // Prepare chart data (sorted by date)
  const chartData = sales?.slice().sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime()).map(s => ({
    date: new Date(s.saleDate).toLocaleDateString(),
    price: s.salePrice,
    condition: s.conditionGrade,
    auth: s.authenticationStatus
  })) || [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6 pb-6 border-b">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-2">
          <div>
            <div className="flex gap-2 text-sm text-muted-foreground mb-1">
              <Link href="/" className="hover:text-primary">Catalog</Link> / 
              <Link href={`/?category=${item.category}`} className="hover:text-primary">{item.category}</Link> / 
              <span>{item.year || "N/A"}</span>
            </div>
            <h1 className="text-3xl font-bold">{item.name}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {me && (
              <Button 
                variant={item.isWatched ? "outline" : "default"} 
                size="sm" 
                onClick={toggleWatch}
                className="w-32"
                disabled={addToWatchlist.isPending || removeFromWatchlist.isPending}
              >
                {item.isWatched ? (
                  <><EyeOff className="w-4 h-4 mr-2" /> Unwatch</>
                ) : (
                  <><Eye className="w-4 h-4 mr-2" /> Watch</>
                )}
              </Button>
            )}
            {me?.role === "admin" && (
              <Link href={`/admin/items/${item.slug}/edit`}>
                <Button variant="outline" size="sm">Edit</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
          <div>
            <span className="block text-muted-foreground text-xs uppercase font-bold tracking-wider">Authenticator</span>
            <span className="font-medium">{item.authenticator || "-"}</span>
          </div>
          <div>
            <span className="block text-muted-foreground text-xs uppercase font-bold tracking-wider">Tier</span>
            <span className="font-medium flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                item.notorietyTier === 'A' ? 'bg-green-500' :
                item.notorietyTier === 'B' ? 'bg-yellow-500' :
                item.notorietyTier === 'C' ? 'bg-gray-400' : 'bg-transparent'
              }`} />
              Tier {item.notorietyTier || "-"}
            </span>
          </div>
          <div>
            <span className="block text-muted-foreground text-xs uppercase font-bold tracking-wider">Watches</span>
            <span className="font-medium">{item.watchCount || 0}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          
          {/* Prices Table */}
          <section>
            <h2 className="text-xl font-bold mb-4">Prices</h2>
            <div className="bg-white border rounded shadow-sm overflow-x-auto">
              <table className="w-full text-center">
                <thead>
                  <tr>
                    <th className="text-left w-1/4">Auth Status</th>
                    {conditions.map(c => (
                      <th key={c} className="capitalize">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {authStatuses.map(auth => (
                    <tr key={auth}>
                      <td className="text-left font-medium capitalize text-muted-foreground bg-muted/20 border-r">{auth}</td>
                      {conditions.map(c => {
                        const seg = valuation?.segments.find(s => s.authenticationStatus === auth && s.conditionGrade === c);
                        return (
                          <td key={c} className={`font-mono text-sm ${seg ? 'font-bold' : 'text-muted-foreground'}`}>
                            {seg?.medianEstimate ? `$${seg.medianEstimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {valuation && (
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <div>Based on <strong className="text-foreground">{valuation.segments.reduce((acc, s) => acc + s.sampleSize, 0)}</strong> verified sales</div>
                <div>Algorithm Tier: <strong className="text-foreground">{valuation.tierUsed}</strong></div>
              </div>
            )}
          </section>

          {/* Price Chart */}
          <section>
            <h2 className="text-xl font-bold mb-4">Price History</h2>
            <div className="bg-white border rounded shadow-sm p-4 h-72">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#6b7280' }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                      dx={-10}
                    />
                    <RechartsTooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Price"]}
                      contentStyle={{ borderRadius: '4px', border: '1px solid #e5e7eb', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Not enough data to display chart.
                </div>
              )}
            </div>
          </section>

          {/* Show Your Work / Sales History */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Show Your Work</h2>
              {me?.role === 'admin' && (
                <Link href={`/admin/items/${item.slug}/sales/new`}>
                  <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1"/> Add Sale</Button>
                </Link>
              )}
            </div>
            <div className="bg-white border rounded shadow-sm overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Price</th>
                    <th>Source</th>
                    <th>Condition</th>
                    <th>Auth</th>
                    <th className="text-center">Verified?</th>
                  </tr>
                </thead>
                <tbody>
                  {sales?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted-foreground">No sales recorded.</td>
                    </tr>
                  ) : (
                    sales?.map(sale => (
                      <tr key={sale.id}>
                        <td className="whitespace-nowrap">{new Date(sale.saleDate).toLocaleDateString()}</td>
                        <td className="text-right font-mono font-medium text-primary">
                          ${sale.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td>
                          {sale.sourceName || sale.saleSource.replace('_', ' ')}
                        </td>
                        <td className="capitalize">{sale.conditionGrade || "-"}</td>
                        <td className="capitalize">{sale.authenticationStatus || "-"}</td>
                        <td className="text-center">
                          {sale.verified ? (
                            <span className="text-green-600 font-bold">Yes</span>
                          ) : (
                            <span className="text-orange-500">No</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {item.imageUrls && item.imageUrls.length > 0 && (
            <div className="border rounded bg-white p-2 shadow-sm">
              <img src={item.imageUrls[0]} alt={item.name} className="w-full h-auto object-contain rounded-sm max-h-64" />
            </div>
          )}

          {item.description && (
            <section>
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2 border-b pb-1">Description</h3>
              <p className="text-sm leading-relaxed">{item.description}</p>
            </section>
          )}

          {comps && comps.length > 0 && (
            <section>
              <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2 border-b pb-1">Comparable Items</h3>
              <ul className="text-sm space-y-2">
                {comps.map(comp => (
                  <li key={comp.id} className="flex flex-col gap-0.5">
                    <Link href={`/items/${comp.compItemSlug}`} className="text-primary hover:underline font-medium">
                      {comp.compItemName}
                    </Link>
                    <span className="text-xs text-muted-foreground font-mono">Similarity: {Math.round(comp.similarityScore * 100)}%</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}