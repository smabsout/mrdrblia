import { useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { 
  useCreateSale, 
  useGetItem,
  SaleInput
} from "@workspace/api-client-react";
import { AdminGuard } from "@/components/admin-guard";
import { ArrowLeft, Info } from "lucide-react";

export default function AddSaleForm() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();

  const { data: item } = useGetItem(params.slug || "", {
    query: { enabled: !!params.slug }
  });
  
  const itemId = item?.id || 0;
  
  const createSale = useCreateSale({
    mutation: {
      onSuccess: () => {
        if (item?.slug) setLocation(`/items/${item.slug}`);
        else setLocation('/admin/sales/pending');
      }
    }
  });

  const [formData, setFormData] = useState<SaleInput>({
    salePrice: 0,
    saleDate: new Date().toISOString().split('T')[0],
    saleSource: 'auction_house',
    sourceName: '',
    conditionGrade: undefined,
    authenticationStatus: undefined,
    verified: true,
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) return;
    createSale.mutate({ itemId, data: formData });
  };

  return (
    <AdminGuard>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href={item?.slug ? `/items/${item.slug}` : "/admin/items/pending"} className="p-2 border border-border rounded hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-3xl font-bold">Add Sale Record</h1>
            {item && <p className="text-muted-foreground text-sm mt-1">For: <span className="font-bold">{item.name}</span></p>}
          </div>
        </div>

        <div className="bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-md text-sm text-blue-900 dark:text-blue-400 font-medium flex gap-3 items-start mb-6">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <p>Verified sales count toward valuation immediately. Unverified sales are placed in the queue for secondary review.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border p-6 rounded-md shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sale Price (USD) *</label>
              <input 
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.salePrice || ''}
                onChange={e => setFormData({...formData, salePrice: parseFloat(e.target.value)})}
                className="w-full bg-background border border-input rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sale Date *</label>
              <input 
                required
                type="date"
                value={formData.saleDate}
                onChange={e => setFormData({...formData, saleDate: e.target.value})}
                className="w-full bg-background border border-input rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Source Type *</label>
              <select 
                required
                value={formData.saleSource}
                onChange={e => setFormData({...formData, saleSource: e.target.value as any})}
                className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="auction_house">Auction House</option>
                <option value="private">Private Sale</option>
                <option value="marketplace">Marketplace</option>
                <option value="admin_estimate">Admin Estimate</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Source Name</label>
              <input 
                type="text"
                value={formData.sourceName}
                onChange={e => setFormData({...formData, sourceName: e.target.value})}
                className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. Sotheby's"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Condition Grade</label>
              <select 
                value={formData.conditionGrade || ''}
                onChange={e => setFormData({...formData, conditionGrade: e.target.value as any || undefined})}
                className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Unknown / Not Graded</option>
                <option value="poor">Poor</option>
                <option value="fair">Fair</option>
                <option value="good">Good</option>
                <option value="excellent">Excellent</option>
                <option value="mint">Mint</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Authentication</label>
              <select 
                value={formData.authenticationStatus || ''}
                onChange={e => setFormData({...formData, authenticationStatus: e.target.value as any || undefined})}
                className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Unknown</option>
                <option value="authenticated">Authenticated</option>
                <option value="unauthenticated">Unauthenticated</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notes</label>
            <textarea 
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary font-serif italic"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/30 rounded border border-border">
            <input 
              type="checkbox" 
              id="verified"
              checked={formData.verified}
              onChange={e => setFormData({...formData, verified: e.target.checked})}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor="verified" className="text-sm font-bold cursor-pointer">
              Mark as verified (immediately affects valuation)
            </label>
          </div>

          <div className="pt-4 border-t border-border">
            <button 
              type="submit"
              disabled={createSale.isPending}
              className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm py-3 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createSale.isPending ? "Adding Sale..." : "Add Sale Record"}
            </button>
          </div>
        </form>
      </div>
    </AdminGuard>
  );
}
