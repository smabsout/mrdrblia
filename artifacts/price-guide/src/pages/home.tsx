import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListCategories, useListItems, getListItemsQueryKey, ListItemsSort } from "@workspace/api-client-react";
import { Search, LayoutGrid, List, Plus, Eye, AlertCircle, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/item-card";
import { StatsBar } from "@/components/layout";
import { cn, formatPrice } from "@/lib/utils";
import { useUser } from "@clerk/react";

type ViewMode = "grid" | "table";

export default function Home() {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [sort, setSort] = useState<ListItemsSort>("recent");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [, setLocation] = useLocation();

  const { data: categories } = useListCategories();

  const { data: itemsData, isLoading } = useListItems(
    {
      q: search || undefined,
      category: activeCategory || undefined,
      sort,
      page,
      limit: 50,
    },
    {
      query: {
        queryKey: getListItemsQueryKey({
          q: search || undefined,
          category: activeCategory || undefined,
          sort,
          page,
          limit: 50,
        }),
      },
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <StatsBar />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-semibold tracking-tight">My Collection</h1>
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="pl-8 h-8 text-sm bg-card border-border"
            />
          </form>
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 transition-colors",
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 transition-colors border-l border-border",
                viewMode === "table"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border gap-3 pb-3 mb-6">
        <div className="flex gap-4 overflow-x-auto w-full sm:w-auto pb-1 -mb-1">
          <button
            onClick={() => { setActiveCategory(""); setPage(1); }}
            className={cn(
              "pb-1 text-sm font-medium whitespace-nowrap transition-colors",
              activeCategory === ""
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.name}
              onClick={() => { setActiveCategory(cat.name); setPage(1); }}
              className={cn(
                "pb-1 text-sm font-medium whitespace-nowrap transition-colors",
                activeCategory === cat.name
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.name}
              <span className="text-xs text-muted-foreground/60 ml-1 font-mono">
                {cat.itemCount}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            className="text-xs border border-border rounded-md px-2 py-1.5 bg-card text-foreground focus:ring-1 focus:ring-ring outline-none"
            value={sort}
            onChange={(e) => { setSort(e.target.value as ListItemsSort); setPage(1); }}
          >
            <option value="recent">Recently Added</option>
            <option value="watched">Most Watched</option>
            <option value="value_high">Highest Value</option>
            <option value="value_low">Lowest Value</option>
            <option value="name">Name A–Z</option>
          </select>
          {user && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs border-border"
              onClick={() => {
                const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
                window.open(`${basePath}/api/collection/export`, "_blank");
              }}
            >
              <Download className="w-3 h-3" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-72 animate-pulse" />
          ))}
        </div>
      ) : itemsData?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No items yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Start building your collection by adding your first item.
          </p>
          <Link href="/collection/add">
            <Button className="bg-primary hover:bg-primary/90 gap-1.5">
              <Plus className="w-4 h-4" />
              Add Your First Item
            </Button>
          </Link>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {itemsData?.items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Year</th>
                <th>Auth</th>
                <th className="text-right">Paid</th>
                <th className="text-right">Est. Value</th>
                <th className="text-right">Gain/Loss</th>
                <th>Confidence</th>
                <th className="text-center">Watches</th>
              </tr>
            </thead>
            <tbody>
              {itemsData?.items.map((item) => (
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
                    {item.purchasePrice != null
                      ? `$${item.purchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "-"}
                  </td>
                  <td className="text-right font-mono text-sm">
                    {item.medianEstimate != null
                      ? `$${item.medianEstimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "-"}
                  </td>
                  <td className="text-right font-mono text-sm">
                    {item.unrealizedGainLoss != null ? (
                      <span
                        className={
                          item.unrealizedGainLoss > 0
                            ? "text-emerald-400"
                            : item.unrealizedGainLoss < 0
                            ? "text-red-400"
                            : ""
                        }
                      >
                        {item.unrealizedGainLoss > 0 ? "+" : ""}$
                        {item.unrealizedGainLoss.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    ) : (
                      "-"
                    )}
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
                      <Eye className="w-3 h-3" />
                      <span className="font-mono text-xs">{item.watchCount || 0}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {itemsData && itemsData.total > itemsData.limit && (
        <div className="mt-6 flex justify-between items-center text-sm text-muted-foreground">
          <div>
            {(page - 1) * itemsData.limit + 1}–{Math.min(page * itemsData.limit, itemsData.total)} of{" "}
            {itemsData.total}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * itemsData.limit >= itemsData.total}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
