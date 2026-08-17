import { useState, useRef, useEffect } from "react";
import { useLocation, useParams, Link } from "wouter";
import { 
  useCreateItem, 
  useUpdateItem,
  useGetItem,
  ItemInput,
  useListCategories
} from "@workspace/api-client-react";
import { AdminGuard } from "@/components/admin-guard";
import { ArrowLeft } from "lucide-react";

export default function AdminItemForm() {
  const params = useParams<{ slug: string }>();
  const isEdit = !!params.slug;
  const [, setLocation] = useLocation();

  const { data: existingItem, isLoading: isLoadingItem } = useGetItem(params.slug || "", {
    query: { enabled: isEdit }
  });
  
  const itemId = existingItem?.id;
  
  const { data: categories } = useListCategories();
  
  const createItem = useCreateItem({ mutation: { onSuccess: (res) => setLocation(`/items/${res.slug}`) }});
  const updateItem = useUpdateItem({ mutation: { onSuccess: (res) => setLocation(`/items/${res.slug}`) }});

  const [formData, setFormData] = useState<ItemInput>({
    name: "",
    category: "",
    subcategory: "",
    description: "",
    provenanceNotes: "",
    year: undefined,
    sourceEvent: "",
    authenticator: "",
    imageUrls: []
  });

  const initialized = useRef(false);
  useEffect(() => {
    if (isEdit && existingItem && !initialized.current) {
      setFormData({
        name: existingItem.name || "",
        category: existingItem.category || "",
        subcategory: existingItem.subcategory || "",
        description: existingItem.description || "",
        provenanceNotes: existingItem.provenanceNotes || "",
        year: existingItem.year || undefined,
        sourceEvent: existingItem.sourceEvent || "",
        authenticator: existingItem.authenticator || "",
        imageUrls: existingItem.imageUrls || []
      });
      initialized.current = true;
    }
  }, [isEdit, existingItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      imageUrls: formData.imageUrls?.filter(url => url.trim() !== "")
    };

    if (isEdit && itemId) {
      updateItem.mutate({ id: itemId, data: dataToSubmit });
    } else {
      createItem.mutate({ data: dataToSubmit });
    }
  };

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <AdminGuard>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href={isEdit ? `/items/${existingItem?.slug}` : "/admin/items/pending"} className="p-2 border border-border rounded hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-serif text-3xl font-bold">{isEdit ? "Edit Item" : "Create New Item"}</h1>
        </div>

        {isEdit && isLoadingItem ? (
          <div className="animate-pulse h-96 bg-muted/50 rounded border border-border"></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border p-6 rounded-md shadow-sm">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Item Name *</label>
              <input 
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category *</label>
                <input 
                  required
                  list="categories"
                  type="text"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <datalist id="categories">
                  {categories?.map(c => <option key={c.name} value={c.name} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subcategory</label>
                <input 
                  type="text"
                  value={formData.subcategory}
                  onChange={e => setFormData({...formData, subcategory: e.target.value})}
                  className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary font-serif"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Provenance Notes</label>
              <textarea 
                rows={3}
                value={formData.provenanceNotes}
                onChange={e => setFormData({...formData, provenanceNotes: e.target.value})}
                className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary font-serif italic"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Year</label>
                <input 
                  type="number"
                  value={formData.year || ''}
                  onChange={e => setFormData({...formData, year: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="w-full bg-background border border-input rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Source Event</label>
                <input 
                  type="text"
                  value={formData.sourceEvent}
                  onChange={e => setFormData({...formData, sourceEvent: e.target.value})}
                  className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Authenticator</label>
                <input 
                  type="text"
                  value={formData.authenticator}
                  onChange={e => setFormData({...formData, authenticator: e.target.value})}
                  className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Image URL</label>
              <input 
                type="url"
                value={formData.imageUrls?.[0] || ''}
                onChange={e => setFormData({...formData, imageUrls: [e.target.value]})}
                className="w-full bg-background border border-input rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
                placeholder="https://"
              />
            </div>

            <div className="pt-4 border-t border-border">
              <button 
                type="submit"
                disabled={isPending}
                className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm py-3 rounded hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isPending ? "Saving..." : (isEdit ? "Update Item" : "Create Item")}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminGuard>
  );
}
