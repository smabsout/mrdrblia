import { useRoute, useLocation } from "wouter";
import { useGetItem, useCreateCollectionItem, useUpdateCollectionItem, getGetItemQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ArrowLeft, Package, DollarSign, FileText, Shield } from "lucide-react";

const CATEGORIES = [
  "Letters & Correspondence",
  "Artwork & Drawings",
  "Photographs",
  "Documents & Legal",
  "Personal Effects",
  "Autographs & Signatures",
  "Hair & Biological",
  "Clothing & Fabric",
  "Publications & Media",
  "Other",
];

const NOTORIETY_TIERS = [
  { value: "", label: "Select tier..." },
  { value: "A", label: "Tier A — Widely known case" },
  { value: "B", label: "Tier B — Moderately known" },
  { value: "C", label: "Tier C — Niche / obscure" },
];

export default function CollectionForm() {
  const [, editParams] = useRoute("/collection/:slug/edit");
  const isEdit = !!editParams?.slug;
  const slug = editParams?.slug;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: item } = useGetItem(slug!, {
    query: { enabled: isEdit && !!slug, queryKey: getGetItemQueryKey(slug!) },
  });

  const createItem = useCreateCollectionItem();
  const updateItem = useUpdateCollectionItem();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    year: "",
    authenticator: "",
    notorietyTier: "",
    description: "",
    provenanceNotes: "",
    sourceEvent: "",
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
        subcategory: item.subcategory || "",
        year: item.year?.toString() || "",
        authenticator: item.authenticator || "",
        notorietyTier: item.notorietyTier || "",
        description: item.description || "",
        provenanceNotes: item.provenanceNotes || "",
        sourceEvent: item.sourceEvent || "",
        purchasePrice: item.purchasePrice?.toString() || "",
        purchaseDate: item.purchaseDate
          ? new Date(item.purchaseDate).toISOString().split("T")[0]
          : "",
        purchaseSource: item.purchaseSource || "",
        owned: item.owned ?? true,
      });
    }
  }, [item, isEdit]);

  const set = (field: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      year: formData.year ? parseInt(formData.year) : undefined,
      authenticator: formData.authenticator || undefined,
      notorietyTier: formData.notorietyTier || undefined,
      description: formData.description || undefined,
      provenanceNotes: formData.provenanceNotes || undefined,
      sourceEvent: formData.sourceEvent || undefined,
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
            toast({ title: "Item added to collection" });
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
        onClick={() => setLocation(isEdit && item ? `/items/${item.slug}` : "/")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {isEdit ? "Back to item" : "Back to collection"}
      </button>

      <h1 className="text-xl font-semibold tracking-tight mb-6">
        {isEdit ? "Edit Item" : "Add to Collection"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-section">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Item Details
            </h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Item Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g., John Wayne Gacy — Pogo the Clown painting"
              className="bg-input border-border"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                required
                value={formData.category}
                onChange={(e) => set("category", e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                value={formData.subcategory}
                onChange={(e) => set("subcategory", e.target.value)}
                placeholder="e.g., Oil painting, Typed letter"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => set("year", e.target.value)}
                placeholder="e.g., 1992"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceEvent">Associated Case / Event</Label>
              <Input
                id="sourceEvent"
                value={formData.sourceEvent}
                onChange={(e) => set("sourceEvent", e.target.value)}
                placeholder="e.g., Gacy murders (1972–1978)"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              className="min-h-[80px] bg-input border-border"
              value={formData.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the item, its condition, and any notable features..."
            />
          </div>
        </div>

        <div className="form-section">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Authentication & Provenance
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authenticator">Authenticator</Label>
              <Input
                id="authenticator"
                value={formData.authenticator}
                onChange={(e) => set("authenticator", e.target.value)}
                placeholder="e.g., PSA, Beckett, JSA"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notorietyTier">Notoriety Tier</Label>
              <select
                id="notorietyTier"
                value={formData.notorietyTier}
                onChange={(e) => set("notorietyTier", e.target.value)}
                className="flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {NOTORIETY_TIERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="provenanceNotes">Provenance Notes</Label>
            <Textarea
              id="provenanceNotes"
              className="min-h-[80px] bg-input border-border"
              value={formData.provenanceNotes}
              onChange={(e) => set("provenanceNotes", e.target.value)}
              placeholder="Chain of custody, previous owners, COA details..."
            />
          </div>
        </div>

        <div className="form-section">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Purchase Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (USD)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => set("purchasePrice", e.target.value)}
                placeholder="0.00"
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => set("purchaseDate", e.target.value)}
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseSource">Purchase Source</Label>
            <Input
              id="purchaseSource"
              value={formData.purchaseSource}
              onChange={(e) => set("purchaseSource", e.target.value)}
              placeholder="e.g., Heritage Auctions, eBay, private dealer"
              className="bg-input border-border"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="owned"
              checked={formData.owned}
              onChange={(e) => set("owned", e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <Label htmlFor="owned" className="font-normal text-sm">
              I currently own this item
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation(isEdit && item ? `/items/${item.slug}` : "/")}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createItem.isPending || updateItem.isPending}
            className="bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            {createItem.isPending || updateItem.isPending
              ? "Saving..."
              : isEdit
              ? "Save Changes"
              : "Add to Collection"}
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        New items are submitted for review before appearing in the catalog.
      </p>
    </div>
  );
}
