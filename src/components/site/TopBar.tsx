import { Phone, MapPin, Clock } from "lucide-react";

export function TopBar() {
  return (
    <div className="w-full bg-foreground text-background text-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Pon zaprto · Tor–Pet 8:30–17:00</span>
          <span className="hidden sm:flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Koprska 94, Ljubljana</span>
        </div>
        <a href="tel:059023951" className="flex items-center gap-1.5 font-medium hover:text-primary transition-colors">
          <Phone className="h-3.5 w-3.5" />059 023 951
        </a>
      </div>
    </div>
  );
}
