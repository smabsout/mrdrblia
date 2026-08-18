import { useGetMe, useListPendingSales, getListPendingSalesQueryKey, useVerifySale } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function PendingSales() {
  const { data: me } = useGetMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sales, isLoading } = useListPendingSales({
    query: { enabled: me?.role === 'admin', queryKey: getListPendingSalesQueryKey() }
  });

  const verifySale = useVerifySale();

  if (!me || me.role !== "admin") {
    return <div className="p-8 text-center text-red-500">Unauthorized</div>;
  }

  const handleVerify = (id: number) => {
    verifySale.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Sale verified" });
        queryClient.invalidateQueries({ queryKey: getListPendingSalesQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.data?.error || err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pending Sales Verifications</h1>

      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>Item</th>
              <th className="text-right">Price</th>
              <th>Date</th>
              <th>Source</th>
              <th>Condition</th>
              <th>Auth Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</td>
              </tr>
            ) : sales?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">No pending sales.</td>
              </tr>
            ) : (
              sales?.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    {sale.itemSlug ? (
                      <Link href={`/items/${sale.itemSlug}`} className="text-primary hover:underline font-medium">
                        {sale.itemName || `Item #${sale.itemId}`}
                      </Link>
                    ) : (
                      <span className="font-medium">{sale.itemName || `Item #${sale.itemId}`}</span>
                    )}
                  </td>
                  <td className="text-right font-mono font-medium">${sale.salePrice.toLocaleString()}</td>
                  <td className="whitespace-nowrap">{new Date(sale.saleDate).toLocaleDateString()}</td>
                  <td>{sale.sourceName || sale.saleSource.replace('_', ' ')}</td>
                  <td className="capitalize">{sale.conditionGrade || "-"}</td>
                  <td className="capitalize">{sale.authenticationStatus || "-"}</td>
                  <td className="text-right">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => handleVerify(sale.id)}
                      disabled={verifySale.isPending}
                    >
                      Verify
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}