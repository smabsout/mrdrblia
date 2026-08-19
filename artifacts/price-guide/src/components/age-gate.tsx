import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function AgeGate() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("pg_age_confirmed")) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleAgree = () => {
    localStorage.setItem("pg_age_confirmed", "true");
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-card max-w-md w-full p-6 md:p-8 rounded-lg text-center border border-border">
        <h2 className="text-xl font-bold mb-4 text-foreground">Content Notice</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          This catalog contains items associated with historically sensitive events, criminal cases,
          and notable figures. All items are offered for research and collecting purposes only. By
          continuing, you confirm you are 18 or older and agree to our Terms of Service.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button
            onClick={handleAgree}
            className="w-full sm:w-auto px-8 bg-primary hover:bg-primary/90"
          >
            I Agree, Continue
          </Button>
          <a
            href="/tos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}
