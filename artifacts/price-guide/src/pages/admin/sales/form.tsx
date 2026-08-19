import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import {
  useGetMe,
  useGetItem,
  getGetItemQueryKey,
  useCreateSale,
  SaleInputSaleSource,
  SaleInputConditionGrade,
  SaleInputAuthenticationStatus,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, DollarSign } from "lucide-react";

export default function AddSaleForm() {
  const { data: me } = useGetMe();
  const [, params] = useRoute("/admin/items/:slug/sales/new");
  const slug = params?.slug;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: item } = useGetItem(slug!, {
    query: { enabled: !!slug, queryKey: getGetItemQueryKey(slug!) },
  });

  const createSale = useCreateSale();

  const [formData, setFormData] = useState({
    salePrice: "",
    saleDate: new Date().toISOString().split("T")[0],
    saleSource: "marketplace" as SaleInputSaleSource,
    sourceName: "",
    conditionGrade: "good" as SaleInputConditionGrade,
    authenticationStatus: "unauthenticated" as SaleInputAuthenticationStatus,
    verified: true,
  });

  if (!me || me.role !== "admin") {
    return <div className="p-8 text-center text-red-400">Unauthorized</div>;
  }

  if (!item) return null;

  const selectClass =
    "flex h-9 w-full rounded-md border border-border bg-input px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSale.mutate(
      {
        itemId: item.id,
        data: {
          salePrice: parseFloat(formData.salePrice),
          saleDate: new Date(formData.saleDate).toISOString(),
          saleSource: formData.saleSource,
          sourceName: formData.sourceName || undefined,
          conditionGrade: formData.conditionGrade,
          authenticationStatus: formData.authenticationStatus,
          verified: formData.verified,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Sale recorded" });
          setLocation(`/items/${item.slug}`);
        },
        onError: (err) =>
          toast({
            title: "Error",
            description: err.data?.error || err.message,
            variant: "destructive",
          }),
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-xl">
      <button
        onClick={() => setLocation(`/items/${item.slug}`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to item
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Add Sale Record</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Recording sale for{" "}
          <Link
            href={`/items/${item.slug}`}
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {item.name}
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-section">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salePrice">Sale Price (USD) *</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                required
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleDate">Sale Date *</Label>
              <Input
                id="saleDate"
                type="date"
                required
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="saleSource">Source Type</Label>
              <select
                id="saleSource"
                className={selectClass}
                value={formData.saleSource}
                onChange={(e) =>
                  setFormData({ ...formData, saleSource: e.target.value as SaleInputSaleSource })
                }
              >
                <option value="marketplace">Marketplace</option>
                <option value="auction_house">Auction House</option>
                <option value="private">Private Sale</option>
                <option value="admin_estimate">Admin Estimate</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceName">Source Name</Label>
              <Input
                id="sourceName"
                value={formData.sourceName}
                onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
                placeholder="e.g. eBay, Heritage Auctions"
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="conditionGrade">Condition</Label>
              <select
                id="conditionGrade"
                className={`${selectClass} capitalize`}
                value={formData.conditionGrade}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    conditionGrade: e.target.value as SaleInputConditionGrade,
                  })
                }
              >
                {["poor", "fair", "good", "excellent", "mint"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="authenticationStatus">Authentication</Label>
              <select
                id="authenticationStatus"
                className={`${selectClass} capitalize`}
                value={formData.authenticationStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    authenticationStatus: e.target.value as SaleInputAuthenticationStatus,
                  })
                }
              >
                <option value="unauthenticated">Unauthenticated</option>
                <option value="authenticated">Authenticated</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="verified"
              checked={formData.verified}
              onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            <Label htmlFor="verified" className="font-normal text-sm">
              Mark as verified (bypass pending review)
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation(`/items/${item.slug}`)}
            className="border-border"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createSale.isPending}
            className="bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            Record Sale
          </Button>
        </div>
      </form>
    </div>
  );
}
