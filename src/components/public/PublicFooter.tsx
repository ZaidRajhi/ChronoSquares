import { Link } from "@tanstack/react-router";
import { CSLogo } from "@/components/CSLogo";

export function PublicFooter() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <CSLogo />
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/chronoblog" className="hover:text-foreground">ChronoBlog</Link>
            <Link to="/store" className="hover:text-foreground">Store</Link>
            <Link to="/flowgrid" className="hover:text-foreground">FlowGrid</Link>
            <Link to="/about" className="hover:text-foreground">About</Link>
          </nav>
        </div>
        <div className="glow-divider my-8" />
        <p className="text-xs text-muted-foreground">© ChronoSquares 2026. Built for efficiency.</p>
      </div>
    </footer>
  );
}
