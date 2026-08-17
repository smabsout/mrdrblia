import { useRoute, useLocation } from "wouter";
import { useGetMe, useGetItem, useCreateItem, useUpdateItem, getGetItemQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function AdminItemForm() {
  const { data: me } = useGetMe();
  const [, params] = useRoute("/admin/items/:slug/edit");
  const isEdit = !!params?.slug;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: item } = useGetItem(params?.slug!, {
    query: { enabled: isEdit, queryKey: getGetItemQueryKey(params?.slug!) }
  });

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    year: "",
    authenticator: "",
    description: "",
  });

  useEffect(() => {
    if (item && isEdit) {
      setFormData({
        name: item.name || "",
        category: item.category || "",
        year: item.year?.toString() || "",
        authenticator: item.authenticator || "",
        description: item.description || "",
      });
    }
  }, [item, isEdit]);

  if (!me || me.role !== "admin") {
    return <div className="p-8 text-center text-red-500">Unauthorized</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      category: formData.category,
      year: formData.year ? parseInt(formData.year) : undefined,
      authenticator: formData.authenticator || undefined,
      description: formData.description || undefined,
    };

    if (isEdit && item) {
      updateItem.mutate({ id: item.id, data: payload }, {
        onSuccess: (res) => {
          toast({ title: "Item updated" });
          setLocation(`/items/${res.slug}`);
        },
        onError: (err) => toast({ title: "Error", description: err.error, variant: "destructive" })
      });
    } else {
      createItem.mutate({ data: payload }, {
        onSuccess: (res) => {
          toast({ title: "Item created" });
          setLocation(`/items/${res.slug}`);
        },
        onError: (err) => toast({ title: "Error", description: err.error, variant: "destructive" })
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? "Edit Item" : "Create Item"}</h1>
      
      <form onSubmit={handleSubmit} className="bg-white border p-6 rounded shadow-sm space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Item Name *</Label>
          <Input 
            id="name" 
            required 
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Input 
              id="category" 
              required 
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input 
              id="year" 
              type="number"
              value={formData.year}
              onChange={e => setFormData({ ...formData, year: e.target.value })}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="authenticator">Authenticator (e.g., PSA, WATA)</Label>
          <Input 
            id="authenticator" 
            value={formData.authenticator}
            onChange={e => setFormData({ ...formData, authenticator: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            className="min-h-[100px]"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="pt-4 border-t flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setLocation(isEdit ? `/items/${item?.slug}` : "/")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
            {isEdit ? "Save Changes" : "Create Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}