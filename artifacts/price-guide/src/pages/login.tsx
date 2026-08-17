import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ data: { email, password } }, {
      onSuccess: () => {
        setLocation("/");
      },
      onError: (err) => {
        toast({
          title: "Login failed",
          description: err.error || "Please check your credentials.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-white border rounded shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Log In</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={login.isPending}
          >
            {login.isPending ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground border-t pt-4">
          Don't have an account? <Link href="/register" className="text-primary hover:underline">Register here</Link>.
        </div>
      </div>
    </div>
  );
}