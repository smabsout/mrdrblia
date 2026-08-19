import { useRoute, useLocation } from "wouter";
import {
  useGetMe,
  useGetItem,
  useCreateItem,
  useUpdateItem,
  getGetItemQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";

export default function AdminItemForm() {
  const { data: me } = useGetMe();
  const [, params] = useRoute("/admin/items/:slug/edit");
  const isEdit = !!params?.slug;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: item } = useGetItem(params?.slug!, {
    query: { enabled: isEdit, queryKey: getGetItemQueryKey(params?.slug!) },
  });

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    year: "",
    authenticator: "",
    description: "",
    purchasePrice: "",
    purchaseDate: "",
    purchaseSource: "",
    owned: true,
  });

  useEffect(() => {
    if (item && isEdit) {
      setFormData({
        name: item.name || "",
        category: item.category || "",
        year: item.year?.toString() || "",
        authenticator: item.authenticator || "",
        description: item.description || "",
        purchasePrice: item.purchasePrice?.toString() || "",
        purchaseDate: item.purchaseDate
          ? new Date(item.purchaseDate).toISOString().split("T")[0]
          : "",
        purchaseSource: item.purchaseSource || "",
        owned: item.owned ?? true,
      });
    }
  }, [item, isEdit]);

  if (!me || me.role !== "admin") {
    return <div className="p-8 text-center text-red-400">Unauthorized</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      category: formData.category,
      year: formData.year ? parseInt(formData.year) : undefined,
      authenticator: formData.authenticator || undefined,
      description: formData.description || undefined,
      purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
      purchaseDate: formData.purchaseDate
        ? new Date(formData.purchaseDate).toISOString()
        : undefined,
      purchaseSource: formData.purchaseSource || undefined,
      owned: formData.owned,
    };

    if (isEdit && item) {
      updateItem.mutate(
        { id: item.id, data: payload },
        {
          onSuccess: (res) => {
            toast({ title: "Item updated" });
            setLocation(`/items/${res.slug}`);
          },
          onError: (err) =>
            toast({
              title: "Error",
              description: err.data?.error || err.message,
              variant: "destructive",
            }),
        }
      );
    } else {
      createItem.mutate(
        { data: payload },
        {
          onSuccess: (res) => {
            toast({ title: "Item created" });
            setLocation(`/items/${res.slug}`);
          },
          onError: (err) =>
            toast({
              title: "Error",
              description: err.data?.error || err.message,
              variant: "destructive",
            }),
        }
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <button
        onClick={() => setLocation(isEdit ? `/items/${item?.slug}` : "/admin/items/pending")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </button>

      <h1 className="text-xl font-semibold tracking-tight mb-6">
        {isEdit ? "Edit Item (Admin)" : "Create Item (Admin)"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-section">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-input border-border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="authenticator">Authenticator</Label>
            <Input
              id="authenticator"
              value={formData.authenticator}
              onChange={(e) => setFormData({ ...formData, authenticator: e.target.value })}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="min-h-[100px] bg-input border-border"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Purchase Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (USD)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseSource">Purchase Source</Label>
            <Input
              id="purchaseSource"
              value={formData.purchaseSource}
              onChange={(e) => setFormData({ ...formData, purchaseSource: e.target.value })}
              className="bg-input border-border"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="owned"
              checked={formData.owned}
              onChange={(e) => setFormData({ ...formData, owned: e.target.checked })}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <Label htmlFor="owned" className="font-normal text-sm">
              I still own this item
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation(isEdit ? `/items/${item?.slug}` : "/")}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createItem.isPending || updateItem.isPending}
            className="bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            {isEdit ? "Save Changes" : "Create Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}
