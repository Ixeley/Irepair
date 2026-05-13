import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Award, ChevronLeft, ChevronRight } from "lucide-react";
import heroImg from "@/assets/hero-devices.jpg";

function checkIsOpen(): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Ljubljana",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());

  const day = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0");

  if (!["Tue", "Wed", "Thu", "Fri"].includes(day)) return false;
  const total = hour * 60 + minute;
  return total >= 8 * 60 + 30 && total < 17 * 60;
}

const SLIDES = [
  { type: "image" as const },
  {
    type: "card" as const,
    gradient: "from-blue-600 to-blue-800",
    emoji: "📱",
    title: "iPhone servis",
    bullets: ["Zamenjava zaslona — od 89€", "Zamenjava baterije — od 59€", "Vodna škoda — od 79€", "Matična plošča — od 149€"],
  },
  {
    type: "card" as const,
    gradient: "from-slate-700 to-slate-900",
    emoji: "💻",
    title: "MacBook servis",
    bullets: ["Popravilo matične plošče", "Zamenjava SSD — od 79€", "Čiščenje & optimizacija", "Reševanje podatkov"],
  },
  {
    type: "card" as const,
    gradient: "from-emerald-600 to-teal-700",
    emoji: "🛡️",
    title: "Naša garancija",
    bullets: ["3-mesečna garancija na popravilo", "Diagnostika vidnih napak brezplačna", "20+ let izkušenj", "10.000+ popravljenih naprav"],
  },
];

function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, 4500);
    return () => clearTimeout(t);
  }, [current, paused, next]);

  return (
    <div
      className="relative rounded-3xl overflow-hidden shadow-card w-full aspect-[4/3] lg:aspect-auto lg:h-[420px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          {slide.type === "image" ? (
            <img
              src={heroImg}
              alt="Apple naprave — iPhone, MacBook, iPad"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${slide.gradient} flex flex-col items-center justify-center p-8 text-white`}>
              <div className="text-5xl mb-4">{slide.emoji}</div>
              <h3 className="text-2xl font-bold mb-5">{slide.title}</h3>
              <ul className="space-y-2 text-sm text-white/90">
                {slide.bullets.map(b => (
                  <li key={b} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
        aria-label="Nazaj"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
        aria-label="Naprej"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(checkIsOpen());
    const interval = setInterval(() => setIsOpen(checkIsOpen()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden gradient-hero">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-success animate-pulse" : "bg-destructive"}`} />
            {isOpen ? "Trenutno odprto" : "Trenutno zaprto"} · Diagnostika vidnih napak brezplačna
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Vaša Apple naprava<br />
            <span className="bg-gradient-to-r from-primary to-[oklch(0.5_0.2_250)] bg-clip-text text-transparent">
              v varnih rokah.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground text-balance">
            Specializirani za popravilo matičnih plošč in reševanje podatkov. 20+ let izkušenj, 10.000+ popravljenih naprav.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full px-7 shadow-glow">
              <a href="#narocilo">Naročite popravilo</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <a href="#kontakt">Diagnostika naprave</a>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              { icon: Award, label: "20+ let izkušenj" },
              { icon: ShieldCheck, label: "Garancija" },
              { icon: Zap, label: "24h urgentno" },
            ].map((b) => (
              <div key={b.label} className="flex flex-col items-center text-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card shadow-soft">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <HeroSlideshow />
        </div>
      </div>
    </section>
  );
}
