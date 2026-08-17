import { Link } from "wouter";
import { ItemSummary } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { Bookmark, ShieldCheck, HelpCircle } from "lucide-react";

export function ItemCard({ item }: { item: ItemSummary }) {
  const hasImage = item.imageUrls && item.imageUrls.length > 0;
  
  return (
    <Link href={`/items/${item.slug}`} className="group flex flex-col bg-card border border-border rounded-md overflow-hidden hover:border-primary hover:shadow-lg transition-all duration-300">
      <div className="aspect-[4/3] bg-muted relative border-b border-border overflow-hidden">
        {hasImage ? (
          <img src={item.imageUrls![0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif italic text-sm bg-[#e8e4db] dark:bg-[#1a1f36]">
            No image available
          </div>
        )}
        <div className="absolute top-3 right-3 bg-background/95 backdrop-blur shadow-sm text-xs px-2 py-1 rounded border border-border flex items-center gap-1.5 font-mono">
          <Bookmark className="w-3.5 h-3.5 text-primary" /> {item.watchCount || 0}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2 flex justify-between items-center">
          <span>{item.category}</span>
          {item.year && <span className="text-muted-foreground opacity-70">{item.year}</span>}
        </div>
        <h3 className="font-serif font-bold text-xl leading-tight mb-3 line-clamp-2 group-hover:text-primary transition-colors">{item.name}</h3>
        
        <div className="mt-auto pt-5 border-t border-border/50 flex items-end justify-between">
          <div>
            <div className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest font-bold">Median Est.</div>
            <div className="font-mono text-xl font-bold tracking-tight">
              {item.medianEstimate ? formatPrice(item.medianEstimate) : "No data"}
            </div>
          </div>
          
          {item.confidence && (
            <div className="flex flex-col items-end">
               <ConfidenceBadge confidence={item.confidence} />
            </div>
          )}
        </div>
      </div>
    </Link>
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
    <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${color} flex items-center gap-1.5`}>
      {confidence === 'high' && <ShieldCheck className="w-3 h-3" />}
      {confidence === 'low' && <HelpCircle className="w-3 h-3" />}
      {confidence}
    </div>
  );
}
