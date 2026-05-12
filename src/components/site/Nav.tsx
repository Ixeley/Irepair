import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#storitve", label: "Storitve",  external: false },
  { href: "#proces",   label: "Proces",   external: false },
  { href: "#cenik",    label: "Cenik",    external: false },
  { href: "#faq",      label: "FAQ",      external: false },
  { href: "#kontakt",  label: "Kontakt",  external: false },
  { href: "/shop",     label: "Izdelki",  external: true  },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-all ${scrolled ? "glass shadow-soft" : "bg-transparent"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <a href="#" className="text-xl font-bold tracking-tight">
          i<span className="text-primary">Repair</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`text-sm font-medium transition-colors ${l.external ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"}`}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <Button asChild size="sm" className="rounded-full px-5">
            <a href="#narocilo">Naročite popravilo</a>
          </Button>
        </div>
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Meni">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t bg-background px-4 py-4 space-y-3">
          {links.map((l) => (
            <a key={l.href} href={l.href}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : { onClick: () => setOpen(false) })}
              className="block text-sm font-medium">
              {l.label}
            </a>
          ))}
          <Button asChild className="w-full rounded-full"><a href="#narocilo">Naročite popravilo</a></Button>
        </div>
      )}
    </header>
  );
}
