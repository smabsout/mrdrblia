import { AdminGuard } from "@/components/admin-guard";
import { useListPendingSales, useVerifySale, getListPendingSalesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";
import { Link } from "wouter";
import { Check, ShieldCheck } from "lucide-react";

export default function PendingSales() {
  const { data: sales, isLoading } = useListPendingSales();
  const verifySale = useVerifySale();
  const queryClient = useQueryClient();

  const handleVerify = (id: number) => {
    verifySale.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPendingSalesQueryKey() });
        }
      }
    );
  };

  return (
    <AdminGuard>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="font-serif text-3xl font-bold mb-2">Pending Sales</h1>
          <p className="text-muted-foreground text-sm">Verify unconfirmed sales before they affect valuations.</p>
        </div>
        {sales && sales.length > 0 && (
          <div className="bg-primary/10 text-primary font-mono text-sm px-3 py-1 rounded font-bold">
            {sales.length} Pending
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse h-64 bg-muted/50 rounded-md border border-border"></div>
      ) : !sales || sales.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-md bg-card/30">
          <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-bold mb-1">Queue Empty</h2>
          <p className="text-muted-foreground text-sm">All pending sales have been verified.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-md overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30 text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Item</th>
                <th className="p-4 font-bold">Source</th>
                <th className="p-4 font-bold">Condition/Auth</th>
                <th className="p-4 font-bold text-right">Price</th>
                <th className="p-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 font-mono text-xs">{new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <Link href={`/items/${sale.itemSlug}`} className="font-serif font-bold text-primary hover:underline">
                      {sale.itemName}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div className="capitalize font-medium">{sale.saleSource.replace('_', ' ')}</div>
                    {sale.sourceName && <div className="text-xs text-muted-foreground">{sale.sourceName}</div>}
                  </td>
                  <td className="p-4 text-xs">
                    <div><span className="opacity-50">Cond:</span> {sale.conditionGrade || 'Unknown'}</div>
                    <div><span className="opacity-50">Auth:</span> {sale.authenticationStatus || 'Unknown'}</div>
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-lg">
                    {formatPrice(sale.salePrice)}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleVerify(sale.id)}
                      disabled={verifySale.isPending}
                      className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" /> Verify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminGuard>
  );
}
