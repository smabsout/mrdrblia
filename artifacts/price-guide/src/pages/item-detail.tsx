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
} from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Eye, EyeOff, AlertCircle, Plus, Pencil, ArrowLeft, Calendar, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function ItemDetail() {
  const [, params] = useRoute("/items/:slug");
  const slug = params?.slug;
  const queryClient = useQueryClient();
  const { data: me } = useGetMe();

  const { data: item, isLoading } = useGetItem(slug!, {
    query: { enabled: !!slug, queryKey: getGetItemQueryKey(slug!) },
  });

  const { data: valuation } = useGetItemValuation(slug!, {
    query: { enabled: !!slug, queryKey: getGetItemValuationQueryKey(slug!) },
  });

  const { data: sales } = useGetItemSales(slug!, {
    query: { enabled: !!slug, queryKey: getGetItemSalesQueryKey(slug!) },
  });

  const { data: comps } = useGetItemComps(slug!, {
    query: { enabled: !!slug, queryKey: getGetItemCompsQueryKey(slug!) },
  });

  const addToWatchlist = useAddToWatchlist();
  const removeFromWatchlist = useRemoveFromWatchlist();

  if (isLoading)
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-48" />
          <div className="h-10 bg-muted rounded w-96" />
          <div className="grid md:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );

  if (!item)
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Item not found.</p>
      </div>
    );

  const toggleWatch = () => {
    if (item.isWatched) {
      removeFromWatchlist.mutate(
        { itemId: item.id },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(slug!) }) }
      );
    } else {
      addToWatchlist.mutate(
        { data: { itemId: item.id } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetItemQueryKey(slug!) }) }
      );
    }
  };

  const conditions = ["poor", "fair", "good", "excellent", "mint"];
  const authStatuses = ["unauthenticated", "authenticated"];

  const chartData =
    sales
      ?.slice()
      .sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime())
      .map((s) => ({
        date: new Date(s.saleDate).toLocaleDateString(),
        price: s.salePrice,
      })) || [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <Link
        href="/"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to collection
      </Link>

      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-primary font-medium">{item.category}</span>
            {item.subcategory && (
              <>
                <span>/</span>
                <span>{item.subcategory}</span>
              </>
            )}
            {item.year && (
              <>
                <span>/</span>
                <span>{item.year}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>
          {item.sourceEvent && (
            <p className="text-sm text-muted-foreground">{item.sourceEvent}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {me && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleWatch}
              className="gap-1.5 border-border h-8 text-xs"
              disabled={addToWatchlist.isPending || removeFromWatchlist.isPending}
            >
              {item.isWatched ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Unwatch
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Watch
                </>
              )}
            </Button>
          )}
          {me && (
            <Link href={`/collection/${item.slug}/edit`}>
              <Button variant="outline" size="sm" className="gap-1.5 border-border h-8 text-xs">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="stat-card">
          <div className="stat-label">Paid</div>
          <div className="stat-value text-xl">
            {item.purchasePrice != null
              ? `$${item.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Est. Value</div>
          <div className="stat-value text-xl">
            {valuation?.medianEstimate != null
              ? `$${valuation.medianEstimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Gain/Loss</div>
          <div
            className={cn(
              "stat-value text-xl",
              valuation?.unrealizedGainLoss != null && valuation.unrealizedGainLoss > 0 && "text-emerald-400",
              valuation?.unrealizedGainLoss != null && valuation.unrealizedGainLoss < 0 && "text-red-400"
            )}
          >
            {valuation?.unrealizedGainLoss != null
              ? `${valuation.unrealizedGainLoss > 0 ? "+" : ""}$${valuation.unrealizedGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : "—"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confidence</div>
          <div className="stat-value text-xl capitalize">{valuation?.confidence || "—"}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <section className="form-section">
            <h2 className="section-title mb-3">Purchase Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Purchase Date</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {item.purchaseDate ? new Date(item.purchaseDate).toLocaleDateString() : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Source</span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  {item.purchaseSource || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Authenticator</span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-muted-foreground" />
                  {item.authenticator || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-0.5">Status</span>
                <span>{item.owned ? "Currently Owned" : "Sold / Not Owned"}</span>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2 className="section-title mb-3">Valuation Matrix</h2>
            {valuation?.tierUsed === "C" ? (
              <div className="text-center py-6">
                <span className="inline-block bg-muted text-muted-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded mb-2">
                  Category-Level Estimate
                </span>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {valuation.categoryRangeNote || "Not enough data for item-level valuation."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-center">
                  <thead>
                    <tr>
                      <th className="text-left">Auth</th>
                      {conditions.map((c) => (
                        <th key={c} className="capitalize">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {authStatuses.map((auth) => (
                      <tr key={auth}>
                        <td className="text-left capitalize text-muted-foreground text-xs font-medium">
                          {auth}
                        </td>
                        {conditions.map((c) => {
                          const seg = valuation?.segments.find(
                            (s) => s.authenticationStatus === auth && s.conditionGrade === c
                          );
                          return (
                            <td key={c} className="font-mono text-sm">
                              {seg ? (
                                seg.singleSaleNote ? (
                                  <div className="text-xs text-amber-400">
                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                    ${seg.medianEstimate?.toLocaleString()}
                                  </div>
                                ) : seg.medianEstimate ? (
                                  `$${seg.medianEstimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                ) : (
                                  "—"
                                )
                              ) : (
                                "—"
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {valuation && valuation.tierUsed !== "C" && (
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                <span>
                  Tier <strong className="text-foreground">{valuation.tierUsed}</strong>
                </span>
                <span>
                  <strong className="text-foreground">
                    {valuation.segments.reduce((a, s) => a + s.sampleSize, 0)}
                  </strong>{" "}
                  verified sales
                </span>
                <span>
                  Updated{" "}
                  {new Date(valuation.computedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
          </section>

          <section className="form-section">
            <h2 className="section-title mb-3">Price History</h2>
            <div className="h-56">
              {chartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(20 7% 14%)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "hsl(25 8% 48%)" }}
                      axisLine={false}
                      tickLine={false}
                      dy={8}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(25 8% 48%)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                      dx={-8}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Price"]}
                      contentStyle={{
                        borderRadius: "6px",
                        border: "1px solid hsl(20 7% 14%)",
                        background: "hsl(20 10% 7%)",
                        fontSize: "12px",
                        fontFamily: "var(--font-mono)",
                        color: "hsl(36 20% 90%)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="hsl(0 72% 42%)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "hsl(0 72% 42%)", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "hsl(0 72% 52%)" }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Not enough data for chart.
                </div>
              )}
            </div>
          </section>

          <section className="form-section">
            <div className="flex justify-between items-center mb-3">
              <h2 className="section-title">Sale Records</h2>
              {me?.role === "admin" && (
                <Link href={`/admin/items/${item.slug}/sales/new`}>
                  <Button size="sm" variant="outline" className="gap-1 h-7 text-xs border-border">
                    <Plus className="w-3 h-3" /> Add Sale
                  </Button>
                </Link>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Price</th>
                    <th>Source</th>
                    <th>Condition</th>
                    <th>Auth</th>
                    <th className="text-center">Verified</th>
                  </tr>
                </thead>
                <tbody>
                  {!sales?.length ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted-foreground">
                        No sales recorded.
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="whitespace-nowrap text-sm">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </td>
                        <td className="text-right font-mono text-sm text-primary">
                          ${sale.salePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-sm">{sale.sourceName || sale.saleSource.replace("_", " ")}</td>
                        <td className="capitalize text-sm">{sale.conditionGrade || "—"}</td>
                        <td className="capitalize text-sm">{sale.authenticationStatus || "—"}</td>
                        <td className="text-center">
                          {sale.verified ? (
                            <span className="text-emerald-400 text-xs font-medium">Yes</span>
                          ) : (
                            <span className="text-amber-400 text-xs">No</span>
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

        <div className="space-y-6">
          {item.imageUrls && item.imageUrls.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              <img
                src={item.imageUrls[0]}
                alt={item.name}
                className="w-full h-auto object-contain max-h-64"
              />
            </div>
          )}

          {item.description && (
            <div className="form-section">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Description
              </h3>
              <p className="text-sm leading-relaxed">{item.description}</p>
            </div>
          )}

          {item.provenanceNotes && (
            <div className="form-section">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Provenance
              </h3>
              <p className="text-sm leading-relaxed">{item.provenanceNotes}</p>
            </div>
          )}

          {comps && comps.length > 0 && (
            <div className="form-section">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Comparable Items
              </h3>
              <ul className="space-y-2">
                {comps.map((comp) => (
                  <li key={comp.id}>
                    <Link
                      href={`/items/${comp.compItemSlug}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {comp.compItemName}
                    </Link>
                    <span className="text-xs text-muted-foreground ml-2 font-mono">
                      {Math.round(comp.similarityScore * 100)}% match
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="form-section">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Item Info
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tier</dt>
                <dd>{item.notorietyTier || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Watches</dt>
                <dd className="font-mono">{item.watchCount || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd className="capitalize">{item.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Added</dt>
                <dd>{new Date(item.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
