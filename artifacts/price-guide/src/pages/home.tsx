import { useState } from "react";
import { useListItems, useListCategories, useGetStats } from "@workspace/api-client-react";
import { ItemCard } from "@/components/item-card";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<"recent" | "watched">("recent");
  
  const { data: itemsData, isLoading } = useListItems({
    category: activeCategory,
    sort,
  });
  const { data: categories } = useListCategories();
  const { data: stats } = useGetStats();

  return (
    <div className="flex flex-col lg:flex-row gap-12">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-10">
        <div>
          <h2 className="font-serif text-lg font-bold mb-4 uppercase tracking-widest text-muted-foreground text-xs border-b border-border pb-2">Categories</h2>
          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => setActiveCategory(undefined)}
                className={`text-sm w-full text-left px-3 py-2 rounded transition-colors ${!activeCategory ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted font-medium text-muted-foreground hover:text-foreground"}`}
              >
                All Categories
              </button>
            </li>
            {categories?.map(c => (
              <li key={c.name}>
                <button 
                  onClick={() => setActiveCategory(c.name)}
                  className={`text-sm w-full text-left px-3 py-2 rounded flex justify-between items-center transition-colors ${activeCategory === c.name ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted font-medium text-muted-foreground hover:text-foreground"}`}
                >
                  <span>{c.name}</span>
                  <span className="text-xs opacity-70 font-mono">{c.itemCount}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {stats && (
          <div className="bg-card border border-border p-5 rounded-md shadow-sm">
            <h3 className="font-serif font-bold text-lg mb-4">Market Overview</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Tracked Items</span>
                <span className="font-mono font-bold text-lg">{stats.totalItems}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Verified Sales</span>
                <span className="font-mono font-bold text-lg">{stats.verifiedSales}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Grid */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-border pb-6">
          <div>
            <h1 className="font-serif text-4xl font-bold">
              {activeCategory ? activeCategory : "Complete Catalog"}
            </h1>
            <p className="text-muted-foreground mt-2 font-mono text-sm">
              {itemsData?.total || 0} ITEMS MATCH YOUR CRITERIA.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Sort by</span>
            <select 
              value={sort} 
              onChange={e => setSort(e.target.value as any)}
              className="text-sm bg-background border border-input rounded-md px-4 py-2 font-bold focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="recent">Recently Added</option>
              <option value="watched">Most Watched</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-muted/50 h-[400px] rounded-md animate-pulse border border-border" />
            ))}
          </div>
        ) : itemsData?.items.length === 0 ? (
           <div className="py-20 text-center border border-dashed border-border rounded-md bg-card/50">
             <p className="font-serif text-2xl text-muted-foreground mb-2">No items found.</p>
             <p className="text-sm text-muted-foreground">Try adjusting your filters or checking back later.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {itemsData?.items.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
