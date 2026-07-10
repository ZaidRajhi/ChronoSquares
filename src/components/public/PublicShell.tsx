import { ReactNode, useEffect } from "react";
import { PublicNav } from "./PublicNav";
import { PublicFooter } from "./PublicFooter";

export function PublicShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.classList.remove("theme-light");
    document.body.classList.add("theme-dark");
    return () => {
      document.body.classList.remove("theme-dark");
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
