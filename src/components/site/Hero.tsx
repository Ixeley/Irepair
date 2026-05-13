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

function IPhoneSVG() {
  return (
    <svg viewBox="0 0 120 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
      <rect x="10" y="4" width="100" height="232" rx="22" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
      <rect x="16" y="18" width="88" height="204" rx="14" fill="white" fillOpacity="0.06" />
      <rect x="44" y="10" width="32" height="6" rx="3" fill="white" fillOpacity="0.3" />
      <circle cx="60" cy="13" r="2" fill="white" fillOpacity="0.5" />
      <rect x="20" y="22" width="80" height="196" rx="10" fill="white" fillOpacity="0.04" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
      <rect x="22" y="24" width="76" height="192" rx="9" fill="white" fillOpacity="0.07" />
    </svg>
  );
}

function MacBookSVG() {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
      <rect x="20" y="8" width="180" height="120" rx="10" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
      <rect x="28" y="16" width="164" height="104" rx="6" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
      <rect x="30" y="18" width="160" height="100" rx="5" fill="white" fillOpacity="0.07" />
      <ellipse cx="110" cy="11" rx="6" ry="2.5" fill="white" fillOpacity="0.2" />
      <path d="M4 132 C4 130 6 128 8 128 L212 128 C214 128 216 130 216 132 L220 148 C220 150 218 152 216 152 L4 152 C2 152 0 150 0 148 Z" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
      <rect x="88" y="132" width="44" height="8" rx="4" fill="white" fillOpacity="0.2" />
    </svg>
  );
}

function IPadSVG() {
  return (
    <svg viewBox="0 0 140 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
      <rect x="8" y="6" width="124" height="188" rx="18" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
      <rect x="16" y="16" width="108" height="168" rx="10" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
      <rect x="18" y="18" width="104" height="164" rx="9" fill="white" fillOpacity="0.07" />
      <circle cx="70" cy="186" r="6" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />
      <circle cx="70" cy="11" r="2.5" fill="white" fillOpacity="0.35" />
    </svg>
  );
}

function WatchSVG() {
  return (
    <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
      <rect x="42" y="0" width="36" height="38" rx="6" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.25" strokeWidth="1" />
      <rect x="42" y="142" width="36" height="38" rx="6" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.25" strokeWidth="1" />
      <rect x="14" y="36" width="92" height="108" rx="26" fill="white" fillOpacity="0.14" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />
      <rect x="22" y="46" width="76" height="88" rx="19" fill="white" fillOpacity="0.06" stroke="white" strokeOpacity="0.1" strokeWidth="0.5" />
      <rect x="24" y="48" width="72" height="84" rx="18" fill="white" fillOpacity="0.08" />
      <rect x="108" y="68" width="6" height="20" rx="3" fill="white" fillOpacity="0.3" />
    </svg>
  );
}

function DataSVG() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
      <circle cx="80" cy="80" r="64" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="8 4" />
      <circle cx="80" cy="80" r="44" fill="white" fillOpacity="0.08" stroke="white" strokeOpacity="0.3" strokeWidth="1.5" />
      <circle cx="80" cy="80" r="26" fill="white" fillOpacity="0.14" stroke="white" strokeOpacity="0.4" strokeWidth="1.5" />
      <path d="M68 80 L76 88 L92 72" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="80" cy="26" r="5" fill="white" fillOpacity="0.5" />
      <circle cx="134" cy="80" r="5" fill="white" fillOpacity="0.5" />
      <circle cx="80" cy="134" r="5" fill="white" fillOpacity="0.5" />
      <circle cx="26" cy="80" r="5" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

type Slide = {
  bg: string;
  tag: string;
  title: string;
  sub: string;
  items: { label: string; price?: string }[];
  Device: () => React.ReactElement;
  cta?: string;
};

const SLIDES: Slide[] = [
  {
    bg: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)",
    tag: "iPhone & iPad",
    title: "iPhone servis",
    sub: "Večina popravil v 20 minutah",
    items: [
      { label: "Zamenjava zaslona", price: "od 89€" },
      { label: "Zamenjava baterije", price: "od 59€" },
      { label: "Vodna škoda", price: "od 79€" },
      { label: "Matična plošča", price: "od 149€" },
    ],
    Device: IPhoneSVG,
    cta: "#narocilo",
  },
  {
    bg: "linear-gradient(135deg, #020617 0%, #1e293b 50%, #334155 100%)",
    tag: "MacBook & iMac",
    title: "MacBook servis",
    sub: "Specializirani za logično ploščo",
    items: [
      { label: "Popravilo logične plošče", price: "od 149€" },
      { label: "Zamenjava SSD", price: "od 79€" },
      { label: "Reševanje podatkov", price: "od 99€" },
      { label: "Čiščenje & optimizacija", price: "od 49€" },
    ],
    Device: MacBookSVG,
    cta: "#narocilo",
  },
  {
    bg: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)",
    tag: "iPad & iPad Pro",
    title: "iPad servis",
    sub: "Originalni deli z garancijo",
    items: [
      { label: "Zamenjava zaslona", price: "od 99€" },
      { label: "Zamenjava baterije", price: "od 69€" },
      { label: "Vodna škoda", price: "od 79€" },
      { label: "Zamenjava stekla", price: "od 79€" },
    ],
    Device: IPadSVG,
    cta: "#narocilo",
  },
  {
    bg: "linear-gradient(135deg, #0c0a09 0%, #292524 50%, #44403c 100%)",
    tag: "Apple Watch",
    title: "Watch servis",
    sub: "Vse serije Apple Watch",
    items: [
      { label: "Zamenjava zaslona", price: "od 79€" },
      { label: "Zamenjava baterije", price: "od 49€" },
      { label: "Zamenjava stekla", price: "od 59€" },
      { label: "Vodna škoda", price: "od 69€" },
    ],
    Device: WatchSVG,
    cta: "#narocilo",
  },
  {
    bg: "linear-gradient(135deg, #022c22 0%, #064e3b 50%, #065f46 100%)",
    tag: "Reševanje podatkov",
    title: "Podatki so varni",
    sub: "Uspešnost reševanja nad 90%",
    items: [
      { label: "iPhone / iPad" },
      { label: "MacBook SSD" },
      { label: "Poškodovana logična plošča" },
      { label: "Vodna škoda" },
    ],
    Device: DataSVG,
    cta: "#narocilo",
  },
];

function SlideContent({ slide }: { slide: Slide }) {
  const { Device } = slide;
  return (
    <div className="w-full h-full flex items-center px-7 py-6 text-white" style={{ background: slide.bg }}>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-2">{slide.tag}</div>
        <h3 className="text-xl font-extrabold leading-tight mb-0.5">{slide.title}</h3>
        <p className="text-xs text-white/60 mb-4">{slide.sub}</p>
        <div className="space-y-1.5">
          {slide.items.map(item => (
            <div key={item.label} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
              <span className="text-xs font-medium text-white/90">{item.label}</span>
              {item.price && (
                <span className="text-xs font-bold text-white ml-3 whitespace-nowrap">{item.price}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-shrink-0 ml-4 flex items-center justify-center" style={{ width: "30%", height: "72%" }}>
        <Device />
      </div>
    </div>
  );
}

function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, 3500);
    return () => clearTimeout(t);
  }, [current, paused, next]);

  return (
    <div
      className="relative rounded-3xl overflow-hidden shadow-card w-full aspect-[4/3] lg:aspect-auto lg:h-[420px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Image slide (first) */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${current === 0 ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
        <img
          src={heroImg}
          alt="Apple naprave — iPhone, MacBook, iPad"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-8 left-7 text-white">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">iRepair Ljubljana</div>
          <div className="text-lg font-extrabold">Apple servis specialist</div>
          <div className="text-xs text-white/70 mt-0.5">Koprska 94 · Tor–Pet 8:30–17:00</div>
        </div>
      </div>

      {/* Service slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i + 1 === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          <SlideContent slide={slide} />
        </div>
      ))}

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
        {[...Array(SLIDES.length + 1)].map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-white/25 overflow-hidden">
            <div
              className={`h-full bg-white rounded-full transition-all ${i === current ? "duration-[3500ms] ease-linear w-full" : i < current ? "w-full" : "w-0"}`}
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/30 hover:bg-black/55 text-white flex items-center justify-center transition-colors"
        aria-label="Nazaj"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/30 hover:bg-black/55 text-white flex items-center justify-center transition-colors"
        aria-label="Naprej"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
        {[...Array(SLIDES.length + 1)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/40"}`}
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
