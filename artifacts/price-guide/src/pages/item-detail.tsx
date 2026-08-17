import { useParams, Link } from "wouter";
import { 
  useGetItem, 
  useGetItemValuation, 
  useGetItemSales, 
  useGetItemComps,
  useAddToWatchlist,
  useRemoveFromWatchlist,
  getGetItemQueryKey,
  useGetMe,
  SaleRecord
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";
import { Bookmark, BookmarkCheck, ArrowLeft, Info, ChevronDown, ChevronUp, HelpCircle, ShieldCheck, AlertCircle, FileText, Gavel, LineChart as LineChartIcon } from "lucide-react";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function ItemDetail() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const { data: user } = useGetMe({ query: { retry: false }});
  
  const { data: item, isLoading } = useGetItem(slug, {
    query: { enabled: !!slug, queryKey: getGetItemQueryKey(slug) }
  });
  
  const { data: valuation } = useGetItemValuation(slug, {
    query: { enabled: !!slug }
  });
  
  const { data: sales } = useGetItemSales(slug, {
    query: { enabled: !!slug }
  });
  
  const { data: comps } = useGetItemComps(slug, {
    query: { enabled: !!slug }
  });

  const addWatch = useAddToWatchlist();
  const removeWatch = useRemoveFromWatchlist();

  const [showWorkExpanded, setShowWorkExpanded] = useState(false);

  if (isLoading) {
    return <div className="animate-pulse h-96 bg-muted/50 rounded-md border border-border"></div>;
  }

  if (!item) {
    return <div className="text-center py-20 font-serif text-2xl">Item not found.</div>;
  }

  const toggleWatchlist = () => {
    if (!user) return; // Prompt to login normally
    
    const mutation = item.isWatched ? removeWatch : addWatch;
    mutation.mutate(
      item.isWatched ? { data: { itemId: item.id } } : { data: { itemId: item.id } },
      {
        onSuccess: () => {
          queryClient.setQueryData(getGetItemQueryKey(slug), (old: any) => 
            old ? { ...old, isWatched: !old.isWatched, watchCount: (old.watchCount || 0) + (old.isWatched ? -1 : 1) } : old
          );
        }
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column - Gallery & Details */}
        <div className="lg:col-span-7 space-y-10">
          <div className="bg-card border border-border rounded-md overflow-hidden shadow-sm">
            {item.imageUrls && item.imageUrls.length > 0 ? (
              <div className="aspect-[4/3] bg-muted relative">
                <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-[#e8e4db] dark:bg-[#1a1f36] flex items-center justify-center text-muted-foreground font-serif italic border-b border-border">
                No images available
              </div>
            )}
            
            {/* Thumbnails if > 1 */}
            {item.imageUrls && item.imageUrls.length > 1 && (
              <div className="flex gap-2 p-4 overflow-x-auto bg-background">
                {item.imageUrls.map((url, i) => (
                  <img key={i} src={url} alt={`Thumbnail ${i}`} className="w-20 h-20 object-cover rounded border border-border cursor-pointer hover:border-primary transition-colors shrink-0" />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold mb-4 pb-2 border-b border-border">Provenance & Details</h2>
              <div className="prose prose-slate dark:prose-invert max-w-none font-serif text-lg leading-relaxed text-muted-foreground">
                <p>{item.description || "No description provided."}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border p-4 rounded-md">
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Source Event</div>
                <div className="font-medium">{item.sourceEvent || "Unknown"}</div>
              </div>
              <div className="bg-card border border-border p-4 rounded-md">
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Authenticator</div>
                <div className="font-medium">{item.authenticator || "Not authenticated"}</div>
              </div>
              <div className="bg-card border border-border p-4 rounded-md col-span-2">
                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Provenance Notes</div>
                <div className="font-serif italic text-sm">{item.provenanceNotes || "No specific provenance history recorded."}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Valuation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Header info */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  {item.category}
                  {item.subcategory && <span className="text-muted-foreground">&bull; {item.subcategory}</span>}
                </div>
                {user && (
                  <button 
                    onClick={toggleWatchlist}
                    className={`p-2 rounded-full border transition-all ${item.isWatched ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:text-primary hover:border-primary'}`}
                    title={item.isWatched ? "Remove from watchlist" : "Add to watchlist"}
                  >
                    {item.isWatched ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                )}
              </div>
              <h1 className="font-serif text-4xl font-bold leading-tight mb-2">{item.name}</h1>
              {item.year && <div className="text-lg text-muted-foreground font-serif italic mb-6">Circa {item.year}</div>}
            </div>

            {/* Valuation Box */}
            <div className="bg-card border border-primary/30 p-6 rounded-md shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Gavel className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  <LineChartIcon className="w-4 h-4" /> Current Valuation
                </div>
                
                {valuation?.tierUsed === 'C' ? (
                  <div className="space-y-4">
                    <div className="bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded text-sm text-amber-900 dark:text-amber-400 font-medium flex gap-3 items-start">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block mb-1">No comparable sales data</strong>
                        {valuation.categoryRangeNote}
                      </div>
                    </div>
                    {valuation.categoryLow && valuation.categoryHigh && (
                      <div>
                        <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Category Range</div>
                        <div className="font-mono text-2xl font-bold">
                          {formatPrice(valuation.categoryLow)} - {formatPrice(valuation.categoryHigh)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="font-mono text-5xl font-bold tracking-tighter mb-2">
                      {item.medianEstimate ? formatPrice(item.medianEstimate) : "No data"}
                    </div>
                    <div className="flex items-center gap-3">
                      {item.confidence && <ConfidenceBadge confidence={item.confidence} />}
                      <span className="text-sm text-muted-foreground font-medium">Based on {sales?.length || 0} verified sales</span>
                    </div>
                  </div>
                )}
                
                {sales && sales.length > 0 && <SalesHistoryChart sales={sales} />}
              </div>
            </div>

            {/* "Show Your Work" Panel */}
            {valuation && valuation.tierUsed !== 'C' && (
              <div className="border border-border rounded-md bg-card overflow-hidden">
                <button 
                  onClick={() => setShowWorkExpanded(!showWorkExpanded)}
                  className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors font-bold uppercase tracking-widest text-xs"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" /> Show Your Work
                  </span>
                  {showWorkExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showWorkExpanded && (
                  <div className="p-4 border-t border-border space-y-6">
                    <p className="text-sm text-muted-foreground">
                      This valuation is computationally derived from {valuation.segments.reduce((acc, s) => acc + s.sampleSize, 0)} comparable sales across {valuation.segments.length} condition/authentication segments.
                    </p>
                    
                    {valuation.segments.map((segment, idx) => (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <span className="capitalize">{segment.conditionGrade || 'Any Condition'}</span>
                            <span className="text-muted-foreground">&bull;</span>
                            <span className="capitalize">{segment.authenticationStatus || 'Any Auth'}</span>
                          </div>
                          <span className="font-mono text-muted-foreground">{segment.sampleSize} sales</span>
                        </div>
                        
                        {segment.singleSaleNote ? (
                          <div className="text-sm italic text-muted-foreground px-3">{segment.singleSaleNote}</div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 px-3 text-center">
                            <div className="bg-background border border-border p-2 rounded">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Low</div>
                              <div className="font-mono font-bold text-sm">{formatPrice(segment.lowEstimate)}</div>
                            </div>
                            <div className="bg-background border border-primary/30 p-2 rounded">
                              <div className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Median</div>
                              <div className="font-mono font-bold text-sm">{formatPrice(segment.medianEstimate)}</div>
                            </div>
                            <div className="bg-background border border-border p-2 rounded">
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">High</div>
                              <div className="font-mono font-bold text-sm">{formatPrice(segment.highEstimate)}</div>
                            </div>
                          </div>
                        )}
                        
                        {segment.sales && segment.sales.length > 0 && (
                          <div className="px-3 pt-2">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="border-b border-border/50 text-muted-foreground uppercase tracking-widest text-[9px]">
                                  <th className="pb-2 font-bold">Date</th>
                                  <th className="pb-2 font-bold">Source</th>
                                  <th className="pb-2 font-bold text-right">Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {segment.sales.map((sale) => (
                                  <tr key={sale.id} className="border-b border-border/30 last:border-0">
                                    <td className="py-2 text-muted-foreground">{new Date(sale.saleDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</td>
                                    <td className="py-2 capitalize">{sale.saleSource.replace('_', ' ')}</td>
                                    <td className="py-2 text-right font-mono font-bold">{formatPrice(sale.salePrice)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comparables Sidebar */}
            {valuation?.tierUsed === 'B' && comps && comps.length > 0 && (
              <div className="bg-card border border-border rounded-md p-5">
                <h3 className="font-serif font-bold text-lg mb-4 pb-2 border-b border-border">Derived from Comparables</h3>
                <p className="text-sm text-muted-foreground mb-4">Direct sales data was insufficient. Valuation relies on the following highly similar items.</p>
                <div className="space-y-3">
                  {comps.map(comp => (
                    <Link key={comp.id} href={`/items/${comp.compItemSlug}`} className="block border border-border rounded p-3 hover:border-primary transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold font-serif text-sm">{comp.compItemName}</span>
                        <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded font-bold">{Math.round(comp.similarityScore * 100)}% Match</span>
                      </div>
                      {comp.matchReason && <div className="text-xs text-muted-foreground">{comp.matchReason}</div>}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {user?.role === 'admin' && (
              <div className="pt-4 border-t border-border flex gap-2">
                <Link href={`/admin/items/${item.slug}/edit`} className="flex-1 bg-secondary text-secondary-foreground text-center py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-secondary/80">
                  Edit Item
                </Link>
                <Link href={`/admin/items/${item.slug}/sales/new`} className="flex-1 bg-secondary text-secondary-foreground text-center py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-secondary/80">
                  Add Sale
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const colors = {
    high: "bg-green-100/50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50",
    medium: "bg-blue-100/50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50",
    low: "bg-amber-100/50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50",
  };
  const color = colors[confidence as keyof typeof colors] || colors.low;
  
  return (
    <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded border ${color} flex items-center gap-1.5`}>
      {confidence === 'high' && <ShieldCheck className="w-3.5 h-3.5" />}
      {confidence === 'low' && <HelpCircle className="w-3.5 h-3.5" />}
      {confidence} Conf.
    </div>
  );
}

function SalesHistoryChart({ sales }: { sales: SaleRecord[] }) {
  if (!sales || sales.length === 0) return null;
  const sorted = [...sales].sort((a, b) => new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime());
  const data = sorted.map(s => ({
    date: new Date(s.saleDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    price: s.salePrice,
    source: s.saleSource
  }));

  return (
    <div className="h-[200px] w-full mt-6 -ml-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
            minTickGap={20}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `$${value}`}
            width={60}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
            itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
            formatter={(value: number) => [formatPrice(value), 'Price']}
            labelStyle={{ fontFamily: 'var(--font-sans)', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2} 
            dot={{ r: 3, fill: "hsl(var(--background))", stroke: "hsl(var(--primary))", strokeWidth: 2 }} 
            activeDot={{ r: 5, fill: "hsl(var(--primary))" }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
