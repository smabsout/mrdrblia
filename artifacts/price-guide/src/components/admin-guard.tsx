import { useGetMe } from "@workspace/api-client-react";
import { ReactNode } from "react";
import { Link } from "wouter";
import { ShieldAlert } from "lucide-react";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError } = useGetMe({ query: { retry: false }});
  
  if (isLoading) return <div className="animate-pulse h-64 bg-muted/50 rounded-md"></div>;
  
  if (isError || !user || user.role !== 'admin') {
    return (
      <div className="py-24 text-center border border-dashed border-border rounded-md bg-card/50 flex flex-col items-center">
        <ShieldAlert className="w-12 h-12 text-destructive/50 mb-4" />
        <h2 className="font-serif text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6 max-w-md">You do not have administrative privileges to view this area.</p>
        <Link href="/" className="bg-primary text-primary-foreground px-6 py-2 rounded font-bold uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors">
          Return to Catalog
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex gap-4 border-b border-border pb-4 overflow-x-auto">
        <Link href="/admin/items/pending" className="text-sm font-bold uppercase tracking-widest hover:text-primary whitespace-nowrap">Pending Items</Link>
        <Link href="/admin/sales/pending" className="text-sm font-bold uppercase tracking-widest hover:text-primary whitespace-nowrap">Pending Sales</Link>
        <Link href="/admin/items/new" className="text-sm font-bold uppercase tracking-widest hover:text-primary whitespace-nowrap">New Item</Link>
      </div>
      {children}
    </div>
  );
}
