import { Link } from "wouter";
import { useListItems, useGetStats, getListItemsQueryKey } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Package, DollarSign, BarChart3, PieChartIcon } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

const CHART_COLORS = [
  "hsl(0, 72%, 42%)",
  "hsl(25, 60%, 45%)",
  "hsl(45, 55%, 50%)",
  "hsl(160, 45%, 40%)",
  "hsl(200, 50%, 45%)",
  "hsl(270, 40%, 50%)",
  "hsl(330, 45%, 45%)",
  "hsl(15, 50%, 40%)",
  "hsl(80, 40%, 42%)",
  "hsl(220, 45%, 48%)",
];

export default function Analytics() {
  const { user } = useUser();
  const { data: stats } = useGetStats();
  const { data: itemsData } = useListItems(
    { limit: 100, sort: "recent" },
    { query: { queryKey: getListItemsQueryKey({ limit: 100, sort: "recent" }) } }
  );

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Sign in to view analytics.</p>
      </div>
    );
  }

  const items = itemsData?.items ?? [];

  const categoryData = Object.entries(
    items.reduce<Record<string, { count: number; value: number; spent: number }>>((acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = { count: 0, value: 0, spent: 0 };
      acc[cat].count++;
      if (item.medianEstimate) acc[cat].value += item.medianEstimate;
      if (item.purchasePrice) acc[cat].spent += item.purchasePrice;
      return acc;
    }, {})
  ).map(([name, data]) => ({ name: name.length > 18 ? name.slice(0, 16) + "..." : name, ...data }))
   .sort((a, b) => b.value - a.value);

  const topItems = [...items]
    .filter((i) => i.medianEstimate != null)
    .sort((a, b) => (b.medianEstimate ?? 0) - (a.medianEstimate ?? 0))
    .slice(0, 10);

  const topGainers = [...items]
    .filter((i) => i.unrealizedGainLoss != null)
    .sort((a, b) => (b.unrealizedGainLoss ?? 0) - (a.unrealizedGainLoss ?? 0))
    .slice(0, 5);

  const topLosers = [...items]
    .filter((i) => i.unrealizedGainLoss != null && i.unrealizedGainLoss < 0)
    .sort((a, b) => (a.unrealizedGainLoss ?? 0) - (b.unrealizedGainLoss ?? 0))
    .slice(0, 5);

  const confidenceData = items.reduce<Record<string, number>>((acc, item) => {
    const conf = item.confidence || "unrated";
    acc[conf] = (acc[conf] || 0) + 1;
    return acc;
  }, {});

  const confidencePieData = Object.entries(confidenceData).map(([name, value]) => ({ name, value }));

  const totalSpent = stats?.portfolioTotalSpent ?? 0;
  const totalEst = stats?.portfolioTotalEstimated ?? 0;
  const netGain = stats?.portfolioNetGainLoss ?? 0;
  const ownedCount = stats?.portfolioOwnedCount ?? 0;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Portfolio Analytics</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {items.length} items tracked
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="stat-card">
          <div className="stat-label flex items-center gap-1.5">
            <Package className="w-3 h-3" /> Items Owned
          </div>
          <div className="stat-value">{ownedCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" /> Total Invested
          </div>
          <div className="stat-value">{formatPrice(totalSpent)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" /> Portfolio Value
          </div>
          <div className="stat-value">{formatPrice(totalEst)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label flex items-center gap-1.5">
            {netGain >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            Return
          </div>
          <div className={cn(
            "stat-value",
            netGain > 0 && "text-emerald-400",
            netGain < 0 && "text-red-400",
          )}>
            {netGain > 0 ? "+" : ""}{formatPrice(netGain)}
            {totalSpent > 0 && (
              <span className="text-xs font-normal text-muted-foreground ml-1">
                ({((netGain / totalSpent) * 100).toFixed(1)}%)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Value by Category
            </h2>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(20 7% 14%)" />
                <XAxis type="number" tick={{ fill: "hsl(20 12% 50%)", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: "hsl(20 12% 50%)", fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{ background: "hsl(20 10% 7%)", border: "1px solid hsl(20 7% 14%)", borderRadius: 6, color: "hsl(36 20% 90%)" }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Est. Value"]}
                />
                <Bar dataKey="value" fill="hsl(0, 72%, 42%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No data yet
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Category Distribution
            </h2>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "hsl(20 12% 50%)" }}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ background: "hsl(20 10% 7%)", border: "1px solid hsl(20 7% 14%)", borderRadius: 6, color: "hsl(36 20% 90%)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Top Valued Items
          </h2>
          {topItems.length > 0 ? (
            <div className="space-y-2">
              {topItems.map((item, i) => (
                <Link
                  key={item.id}
                  href={`/items/${item.slug}`}
                  className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold shrink-0 ml-3">
                    {formatPrice(item.medianEstimate!)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No valued items yet</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Top Gainers
            </h2>
            {topGainers.length > 0 ? (
              <div className="space-y-2">
                {topGainers.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.slug}`}
                    className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    <span className="text-sm truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    <span className="font-mono text-sm font-medium text-emerald-400 shrink-0 ml-3">
                      +{formatPrice(item.unrealizedGainLoss!)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
              Biggest Losses
            </h2>
            {topLosers.length > 0 ? (
              <div className="space-y-2">
                {topLosers.map((item) => (
                  <Link
                    key={item.id}
                    href={`/items/${item.slug}`}
                    className="flex items-center justify-between py-1.5 px-3 rounded-md hover:bg-muted/50 transition-colors group"
                  >
                    <span className="text-sm truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    <span className="font-mono text-sm font-medium text-red-400 shrink-0 ml-3">
                      {formatPrice(item.unrealizedGainLoss!)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No losses recorded</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Confidence Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {["high", "medium", "low", "unrated"].map((level) => {
            const count = confidenceData[level] || 0;
            const pct = items.length > 0 ? ((count / items.length) * 100).toFixed(0) : "0";
            return (
              <div key={level} className="text-center p-3 rounded-md bg-muted/30">
                <div className={cn(
                  "text-2xl font-bold font-mono",
                  level === "high" && "text-emerald-400",
                  level === "medium" && "text-amber-400",
                  level === "low" && "text-red-400",
                  level === "unrated" && "text-muted-foreground",
                )}>
                  {count}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  {level} ({pct}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
