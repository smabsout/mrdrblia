import { Link } from "wouter";
import { ItemSummary } from "@workspace/api-client-react";
import { formatPrice } from "@/lib/utils";
import { Eye, ShieldCheck, HelpCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ItemCard({ item }: { item: ItemSummary }) {
  const hasImage = item.imageUrls && item.imageUrls.length > 0;
  const gainLoss = item.unrealizedGainLoss;

  return (
    <Link
      href={`/items/${item.slug}`}
      className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden hover:border-primary/40 transition-all duration-200"
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {hasImage ? (
          <img
            src={item.imageUrls![0]}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-[10px] px-1.5 py-0.5 rounded border border-border flex items-center gap-1 font-mono text-muted-foreground">
          <Eye className="w-3 h-3" /> {item.watchCount || 0}
        </div>
        {item.status === "pending" && (
          <div className="absolute top-2 left-2 bg-amber-500/90 text-[10px] px-1.5 py-0.5 rounded text-white font-medium flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Pending
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
              {item.category}
            </span>
            {item.notorietyTier && (
              <span className={cn(
                "text-[9px] font-bold px-1 py-px rounded",
                item.notorietyTier === "A" && "bg-primary/15 text-primary",
                item.notorietyTier === "B" && "bg-amber-500/15 text-amber-400",
                item.notorietyTier === "C" && "bg-muted text-muted-foreground",
              )}>
                T{item.notorietyTier}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {item.authenticator && (
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
            )}
            {item.year && (
              <span className="text-[10px] text-muted-foreground font-mono">{item.year}</span>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-sm leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {item.name}
        </h3>

        <div className="mt-auto pt-3 border-t border-border/50 space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
                Est. Value
              </div>
              <div className="font-mono text-lg font-bold tracking-tight">
                {item.medianEstimate ? formatPrice(item.medianEstimate) : "—"}
              </div>
            </div>
            {item.confidence && <ConfidenceBadge confidence={item.confidence} />}
          </div>

          {item.purchasePrice != null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Paid {formatPrice(item.purchasePrice)}
              </span>
              {gainLoss != null && (
                <span
                  className={cn(
                    "font-mono font-medium",
                    gainLoss > 0 && "text-emerald-400",
                    gainLoss < 0 && "text-red-400",
                    gainLoss === 0 && "text-muted-foreground"
                  )}
                >
                  {gainLoss > 0 ? "+" : ""}
                  {formatPrice(gainLoss)}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  return (
    <div
      className={cn(
        "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border flex items-center gap-1",
        confidence === "high" && "badge-confidence-high",
        confidence === "medium" && "badge-confidence-medium",
        confidence === "low" && "badge-confidence-low"
      )}
    >
      {confidence === "high" && <ShieldCheck className="w-3 h-3" />}
      {confidence === "low" && <HelpCircle className="w-3 h-3" />}
      {confidence}
    </div>
  );
}
