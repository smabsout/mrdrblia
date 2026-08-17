import { Link } from "wouter";
import { useGetMe, useListPendingItems, getListPendingItemsQueryKey, useUpdateItemStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function PendingItems() {
  const { data: me } = useGetMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pending, isLoading } = useListPendingItems({
    query: { enabled: me?.role === 'admin', queryKey: getListPendingItemsQueryKey() }
  });

  const updateStatus = useUpdateItemStatus();

  if (!me || me.role !== "admin") {
    return <div className="p-8 text-center text-red-500">Unauthorized</div>;
  }

  const handleAction = (id: number, status: 'approved' | 'rejected') => {
    updateStatus.mutate({ id, data: { status } }, {
      onSuccess: () => {
        toast({ title: `Item ${status}` });
        queryClient.invalidateQueries({ queryKey: getListPendingItemsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error, variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Pending Items</h1>
        <Link href="/admin/items/new">
          <Button size="sm">Create New Item</Button>
        </Link>
      </div>

      <div className="bg-white border rounded shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th className="w-1/3">Item Name</th>
              <th>Category</th>
              <th>Created</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td>
              </tr>
            ) : pending?.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">No pending items.</td>
              </tr>
            ) : (
              pending?.map((item) => (
                <tr key={item.id}>
                  <td className="text-muted-foreground font-mono">{item.id}</td>
                  <td>
                    <Link href={`/items/${item.slug}`} className="text-primary font-medium hover:underline">
                      {item.name}
                    </Link>
                  </td>
                  <td className="text-muted-foreground">{item.category}</td>
                  <td className="text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleAction(item.id, 'approved')}>Approve</Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleAction(item.id, 'rejected')}>Reject</Button>
                    </div>
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