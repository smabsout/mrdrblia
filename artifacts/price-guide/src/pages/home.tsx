import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListCategories, useListItems, getListItemsQueryKey, ListItemsSort } from "@workspace/api-client-react";
import { Search, Eye, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [sort, setSort] = useState<ListItemsSort>("recent");
  const [page, setPage] = useState(1);
  const [, setLocation] = useLocation();

  const { data: categories } = useListCategories();
  
  const { data: itemsData, isLoading } = useListItems(
    { 
      q: search || undefined, 
      category: activeCategory || undefined,
      sort,
      page,
      limit: 50 
    },
    {
      query: {
        queryKey: getListItemsQueryKey({ q: search || undefined, category: activeCategory || undefined, sort, page, limit: 50 }),
      }
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Hero */}
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Price Guide Database</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the catalog..." 
            className="flex-1 h-12 text-lg shadow-sm"
          />
          <Button type="submit" className="h-12 px-8 text-lg shadow-sm">
            <Search className="w-5 h-5 mr-2" />
            Search
          </Button>
        </form>
      </div>

      {/* Category Tabs & Sort */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b gap-4 pb-2">
        <div className="flex gap-6 overflow-x-auto hide-scrollbar w-full sm:w-auto">
          <button
            onClick={() => { setActiveCategory(""); setPage(1); }}
            className={`pb-1 text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === "" 
                ? "border-b-2 border-primary text-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Categories
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.name}
              onClick={() => { setActiveCategory(cat.name); setPage(1); }}
              className={`pb-1 text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.name 
                  ? "border-b-2 border-primary text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name} <span className="text-xs text-muted-foreground/70 ml-1 font-mono">({cat.itemCount})</span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 pb-1">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
          <select 
            className="text-sm border rounded px-2 py-1 bg-white focus:ring-1 focus:ring-primary outline-none"
            value={sort}
            onChange={(e) => { setSort(e.target.value as ListItemsSort); setPage(1); }}
          >
            <option value="recent">Recently Added</option>
            <option value="watched">Most Watched</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
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
                  Loading items...
                </td>
              </tr>
            ) : itemsData?.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No items found.
                </td>
              </tr>
            ) : (
              itemsData?.items.map((item) => (
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
                      <Eye className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs">{item.watchCount || 0}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {itemsData && itemsData.total > itemsData.limit && (
        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <div>
            Showing {(page - 1) * itemsData.limit + 1} to {Math.min(page * itemsData.limit, itemsData.total)} of {itemsData.total} items
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * itemsData.limit >= itemsData.total}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}