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

type ImageSlide = { type: "image" };
type ServiceSlide = {
  type: "service";
  accent: string;
  bg: string;
  icon: string;
  label: string;
  title: string;
  items: { name: string; price: string }[];
};
type StatSlide = {
  type: "stats";
  stats: { value: string; label: string }[];
  note: string;
};

type Slide = ImageSlide | ServiceSlide | StatSlide;

const SLIDES: Slide[] = [
  { type: "image" },
  {
    type: "service",
    accent: "#3b82f6",
    bg: "linear-gradient(145deg, #1d4ed8 0%, #1e40af 60%, #1e3a8a 100%)",
    icon: "📱",
    label: "iPhone & iPad",
    title: "iPhone servis",
    items: [
      { name: "Zamenjava zaslona", price: "od 89€" },
      { name: "Zamenjava baterije", price: "od 59€" },
      { name: "Vodna škoda", price: "od 79€" },
      { name: "Matična plošča", price: "od 149€" },
    ],
  },
  {
    type: "service",
    accent: "#64748b",
    bg: "linear-gradient(145deg, #1e293b 0%, #0f172a 60%, #020617 100%)",
    icon: "💻",
    label: "MacBook & iMac",
    title: "MacBook servis",
    items: [
      { name: "Matična plošča", price: "od 149€" },
      { name: "Zamenjava SSD", price: "od 79€" },
      { name: "Reševanje podatkov", price: "od 99€" },
      { name: "Čiščenje & servis", price: "od 49€" },
    ],
  },
  {
    type: "stats",
    stats: [
      { value: "20+", label: "let izkušenj" },
      { value: "10.000+", label: "popravljenih naprav" },
      { value: "3 mes.", label: "garancija" },
      { value: "24h", label: "urgentno" },
    ],
    note: "Diagnostika vidnih napak brezplačna",
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
          {slide.type === "image" && (
            <img
              src={heroImg}
              alt="Apple naprave — iPhone, MacBook, iPad"
              className="w-full h-full object-cover"
            />
          )}
          {slide.type === "service" && (
            <div className="w-full h-full flex flex-col justify-center px-8 py-6 text-white" style={{ background: slide.bg }}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest opacity-60">{slide.label}</div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">{slide.icon}</span>
                <h3 className="text-2xl font-bold">{slide.title}</h3>
              </div>
              <div className="space-y-3">
                {slide.items.map(item => (
                  <div key={item.name} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm font-bold opacity-90 ml-4 whitespace-nowrap">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {slide.type === "stats" && (
            <div className="w-full h-full flex flex-col items-center justify-center px-8 py-6 text-white" style={{ background: "linear-gradient(145deg, #065f46 0%, #064e3b 60%, #022c22 100%)" }}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest opacity-60">iRepair Ljubljana</div>
              <h3 className="text-2xl font-bold mb-6">Zakaj izbrati nas?</h3>
              <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                {slide.stats.map(s => (
                  <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <div className="text-3xl font-extrabold leading-none">{s.value}</div>
                    <div className="text-xs mt-1 opacity-70">{s.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs text-white/60 text-center">{slide.note}</p>
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
