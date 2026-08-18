import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useGetMe, useGetItem, getGetItemQueryKey, useCreateSale, SaleInputSaleSource, SaleInputConditionGrade, SaleInputAuthenticationStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AddSaleForm() {
  const { data: me } = useGetMe();
  const [, params] = useRoute("/admin/items/:slug/sales/new");
  const slug = params?.slug;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: item } = useGetItem(slug!, {
    query: { enabled: !!slug, queryKey: getGetItemQueryKey(slug!) }
  });

  const createSale = useCreateSale();

  const [formData, setFormData] = useState({
    salePrice: "",
    saleDate: new Date().toISOString().split('T')[0],
    saleSource: "marketplace" as SaleInputSaleSource,
    sourceName: "",
    conditionGrade: "good" as SaleInputConditionGrade,
    authenticationStatus: "unauthenticated" as SaleInputAuthenticationStatus,
    verified: true,
  });

  if (!me || me.role !== "admin") {
    return <div className="p-8 text-center text-red-500">Unauthorized</div>;
  }

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSale.mutate({
      itemId: item.id,
      data: {
        salePrice: parseFloat(formData.salePrice),
        saleDate: new Date(formData.saleDate).toISOString(),
        saleSource: formData.saleSource,
        sourceName: formData.sourceName || undefined,
        conditionGrade: formData.conditionGrade,
        authenticationStatus: formData.authenticationStatus,
        verified: formData.verified,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Sale recorded" });
        setLocation(`/items/${item.slug}`);
      },
      onError: (err) => toast({ title: "Error", description: err.data?.error || err.message, variant: "destructive" })
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <div className="mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold">Add Sale Record</h1>
        <p className="text-muted-foreground mt-1">Recording sale for <Link href={`/items/${item.slug}`} className="text-primary hover:underline font-medium">{item.name}</Link></p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white border p-6 rounded shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salePrice">Sale Price (USD) *</Label>
            <Input 
              id="salePrice" 
              type="number"
              step="0.01"
              required 
              value={formData.salePrice}
              onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="saleDate">Sale Date *</Label>
            <Input 
              id="saleDate" 
              type="date"
              required 
              value={formData.saleDate}
              onChange={e => setFormData({ ...formData, saleDate: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="saleSource">Source Type</Label>
            <select 
              id="saleSource"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.saleSource}
              onChange={e => setFormData({ ...formData, saleSource: e.target.value as SaleInputSaleSource })}
            >
              <option value="marketplace">Marketplace</option>
              <option value="auction_house">Auction House</option>
              <option value="private">Private Sale</option>
              <option value="admin_estimate">Admin Estimate</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sourceName">Source Name (e.g. eBay)</Label>
            <Input 
              id="sourceName" 
              value={formData.sourceName}
              onChange={e => setFormData({ ...formData, sourceName: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="conditionGrade">Condition</Label>
            <select 
              id="conditionGrade"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
              value={formData.conditionGrade}
              onChange={e => setFormData({ ...formData, conditionGrade: e.target.value as SaleInputConditionGrade })}
            >
              {["poor", "fair", "good", "excellent", "mint"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="authenticationStatus">Authentication</Label>
            <select 
              id="authenticationStatus"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring capitalize"
              value={formData.authenticationStatus}
              onChange={e => setFormData({ ...formData, authenticationStatus: e.target.value as SaleInputAuthenticationStatus })}
            >
              <option value="unauthenticated">Unauthenticated</option>
              <option value="authenticated">Authenticated</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </div>

        <div className="pt-4 flex items-center gap-2">
          <input 
            type="checkbox" 
            id="verified" 
            checked={formData.verified}
            onChange={e => setFormData({ ...formData, verified: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300"
          />
          <Label htmlFor="verified" className="font-normal text-sm text-muted-foreground">
            Mark as verified (bypass pending review)
          </Label>
        </div>

        <div className="pt-4 border-t flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setLocation(`/items/${item.slug}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={createSale.isPending}>
            Record Sale
          </Button>
        </div>
      </form>
    </div>
  );
}