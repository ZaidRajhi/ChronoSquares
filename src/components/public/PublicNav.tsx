import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CSLogo } from "@/components/CSLogo";
import { Menu, X } from "lucide-react";

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { to: "/", label: "The 7 Squares", hash: "#squares" },
    { to: "/flowgrid", label: "FlowGrid" },
    { to: "/chronoblog", label: "ChronoBlog" },
    { to: "/store", label: "Store" },
    { to: "/about", label: "About" },
  ];

  // Smooth scroll to hash on the home page (works whether or not we're already on /)
  const goToSquares = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileOpen(false);
    if (window.location.pathname === "/") {
      document.getElementById("squares")?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#squares";
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled ? "bg-background/70 backdrop-blur-xl border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <CSLogo />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            {links.map((l) =>
              l.hash ? (
                <a
                  key={l.label}
                  href={l.hash}
                  onClick={l.hash === "#squares" ? goToSquares : undefined}
                  className="hover:text-foreground transition-colors"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.to}
                  className="hover:text-foreground transition-colors"
                  activeProps={{ className: "text-foreground" }}
                >
                  {l.label}
                </Link>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="btn-brand text-sm">
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-foreground"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border py-4 flex flex-col gap-3 text-sm">
            {links.map((l) =>
              l.hash ? (
                <a
                  key={l.label}
                  href={l.hash}
                  className="text-muted-foreground"
                  onClick={l.hash === "#squares" ? goToSquares : () => setMobileOpen(false)}
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  to={l.to}
                  className="text-muted-foreground"
                  onClick={() => setMobileOpen(false)}
                >
                  {l.label}
                </Link>
              )
            )}
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="btn-outline-brand text-sm flex-1">Sign In</Link>
              <Link to="/signup" className="btn-brand text-sm flex-1">Get Started</Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
