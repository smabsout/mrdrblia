import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  const register = useRegister();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ data: { email, password, displayName: displayName || undefined } }, {
      onSuccess: () => {
        toast({
          title: "Registration successful",
          description: "You are now logged in.",
        });
        setLocation("/");
      },
      onError: (err) => {
        toast({
          title: "Registration failed",
          description: err.error || "Please check your details.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="bg-white border rounded shadow-sm p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
        
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
            <Label htmlFor="displayName">Display Name (Optional)</Label>
            <Input 
              id="displayName" 
              type="text" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password (min 8 characters)</Label>
            <Input 
              id="password" 
              type="password" 
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={register.isPending}
          >
            {register.isPending ? "Registering..." : "Register"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground border-t pt-4">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>.
        </div>
      </div>
    </div>
  );
}