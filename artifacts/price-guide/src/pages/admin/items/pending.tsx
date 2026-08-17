import { AdminGuard } from "@/components/admin-guard";
import { useListPendingItems, useUpdateItemStatus, getListPendingItemsQueryKey, ItemStatusInputStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatPrice } from "@/lib/utils";
import { Link } from "wouter";
import { Check, X, Clock } from "lucide-react";

export default function PendingItems() {
  const { data: items, isLoading } = useListPendingItems();
  const updateStatus = useUpdateItemStatus();
  const queryClient = useQueryClient();

  const handleStatusUpdate = (id: number, status: ItemStatusInputStatus) => {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPendingItemsQueryKey() });
        }
      }
    );
  };

  return (
    <AdminGuard>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-bold mb-2">Pending Items</h1>
        <p className="text-muted-foreground text-sm">Review items submitted for inclusion in the catalog.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-muted/50 rounded-md border border-border animate-pulse" />)}
        </div>
      ) : !items?.items || items.items.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-border rounded-md bg-card/30">
          <Check className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-bold mb-1">Queue Empty</h2>
          <p className="text-muted-foreground text-sm">All pending items have been reviewed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.items.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-md flex flex-col md:flex-row overflow-hidden shadow-sm">
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <img src={item.imageUrls[0]} alt={item.name} className="w-full md:w-48 h-48 md:h-auto object-cover border-b md:border-b-0 md:border-r border-border" />
              ) : (
                <div className="w-full md:w-48 h-48 md:h-auto bg-[#e8e4db] dark:bg-[#1a1f36] border-b md:border-b-0 md:border-r border-border flex items-center justify-center font-serif italic text-sm text-muted-foreground">
                  No Image
                </div>
              )}
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">{item.category}</div>
                <h3 className="font-serif font-bold text-lg leading-tight mb-2">{item.name}</h3>
                <div className="text-xs text-muted-foreground mb-4">
                  Submitted: {new Date(item.createdAt).toLocaleDateString()}
                </div>
                
                <div className="mt-auto flex gap-2">
                  <button 
                    onClick={() => handleStatusUpdate(item.id, 'approved')}
                    disabled={updateStatus.isPending}
                    className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/50 py-1.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex justify-center items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(item.id, 'rejected')}
                    disabled={updateStatus.isPending}
                    className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/50 py-1.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex justify-center items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminGuard>
  );
}
