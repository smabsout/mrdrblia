import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Gavel } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  
  const login = useLogin({
    mutation: {
      onSuccess: () => setLocation("/")
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ data: { email, password } });
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-card border border-border p-10 rounded-md shadow-lg">
      <div className="flex justify-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Gavel className="w-8 h-8 text-primary" />
        </div>
      </div>
      <h1 className="font-serif text-4xl font-bold text-center mb-3">Sign In</h1>
      <p className="text-center text-muted-foreground mb-10 text-sm">Access your watchlist and tracking tools.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {login.isError && (
          <div className="bg-destructive/10 text-destructive text-sm p-4 rounded border border-destructive/20 font-medium text-center">
            Invalid credentials. Please try again.
          </div>
        )}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-background border border-input rounded px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-background border border-input rounded px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <button 
          type="submit" 
          disabled={login.isPending}
          className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-sm py-4 rounded hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4 shadow-sm"
        >
          {login.isPending ? "Signing in..." : "Sign In"}
        </button>
      </form>
      
      <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
        Don't have an account? <Link href="/register" className="text-primary font-bold hover:underline">Register</Link>
      </div>
    </div>
  );
}
