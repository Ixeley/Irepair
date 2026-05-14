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

/* ── slide definitions ─────────────────────────────────────── */
type PhotoSlide = {
  kind: "photo";
  img: string;
  alt: string;
  tag: string;
  heading: string;
  sub: string;
  cta: string;
  ctaHref: string;
};

type ServiceSlide = {
  kind: "service";
  tag: string;
  heading: string;
  sub: string;
  cta: string;
  ctaHref: string;
  accent: string;     // right-panel bg colour
  Illustration: () => React.ReactElement;
};

type Slide = PhotoSlide | ServiceSlide;

/* ── SVG illustrations ─────────────────────────────────────── */
function IlluPhone() {
  return (
    <svg viewBox="0 0 180 320" fill="none" className="w-full h-full max-h-72">
      {/* body */}
      <rect x="30" y="10" width="120" height="300" rx="28" fill="#1a1a1a" />
      <rect x="34" y="14" width="112" height="292" rx="24" fill="#2a2a2a" />
      {/* screen */}
      <rect x="38" y="36" width="104" height="220" rx="10" fill="#111827" />
      {/* notch */}
      <rect x="62" y="20" width="56" height="10" rx="5" fill="#111" />
      <circle cx="118" cy="25" r="3" fill="#333" />
      {/* screen glow */}
      <rect x="42" y="40" width="96" height="212" rx="8" fill="url(#sg)" opacity="0.9" />
      {/* home bar */}
      <rect x="70" y="274" width="40" height="4" rx="2" fill="#555" />
      {/* screen content lines */}
      <rect x="54" y="70" width="72" height="6" rx="3" fill="#60a5fa" opacity="0.8" />
      <rect x="54" y="84" width="52" height="4" rx="2" fill="#6b7280" opacity="0.6" />
      <rect x="54" y="100" width="96" height="3" rx="1.5" fill="#374151" opacity="0.5" />
      <rect x="54" y="109" width="80" height="3" rx="1.5" fill="#374151" opacity="0.5" />
      <rect x="54" y="118" width="88" height="3" rx="1.5" fill="#374151" opacity="0.5" />
      {/* crack lines */}
      <path d="M 60 50 L 75 80 L 65 100 L 85 140" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M 75 80 L 100 70 L 120 90" stroke="#ef4444" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
      {/* tools overlay */}
      <circle cx="134" cy="200" r="22" fill="#1d4ed8" opacity="0.9" />
      <path d="M 126 200 L 130 196 L 134 204 L 138 196 L 142 200" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IlluMacBook() {
  return (
    <svg viewBox="0 0 280 200" fill="none" className="w-full h-full max-h-56">
      {/* lid */}
      <rect x="20" y="10" width="240" height="140" rx="12" fill="#2d2d2d" />
      <rect x="26" y="16" width="228" height="128" rx="8" fill="#1a1a2e" />
      {/* screen content */}
      <rect x="30" y="20" width="220" height="120" rx="6" fill="url(#ms)" />
      <rect x="42" y="36" width="80" height="6" rx="3" fill="#60a5fa" opacity="0.8" />
      <rect x="42" y="48" width="56" height="4" rx="2" fill="#94a3b8" opacity="0.6" />
      <rect x="42" y="60" width="196" height="3" rx="1.5" fill="#475569" opacity="0.5" />
      <rect x="42" y="69" width="160" height="3" rx="1.5" fill="#475569" opacity="0.5" />
      <rect x="42" y="78" width="180" height="3" rx="1.5" fill="#475569" opacity="0.5" />
      {/* screwdriver/tool icon on screen */}
      <circle cx="190" cy="80" r="28" fill="#1e40af" opacity="0.85" />
      <path d="M182 72 L186 76 L192 70 L196 74 L190 80 L198 88" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* notch */}
      <ellipse cx="140" cy="13" rx="8" ry="3" fill="#222" />
      {/* base */}
      <path d="M0 154 C0 152 2 150 4 150 L276 150 C278 150 280 152 280 154 L280 168 C280 170 278 172 276 172 L4 172 C2 172 0 170 0 168Z" fill="#2d2d2d" />
      <rect x="108" y="154" width="64" height="8" rx="4" fill="#1a1a1a" />
      {/* keyboard rows */}
      <rect x="18" y="152" width="244" height="2" rx="1" fill="#222" opacity="0.5" />
      <defs>
        <linearGradient id="ms" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IlluIPad() {
  return (
    <svg viewBox="0 0 200 260" fill="none" className="w-full h-full max-h-64">
      <rect x="16" y="8" width="168" height="244" rx="20" fill="#1c1c1e" />
      <rect x="22" y="14" width="156" height="232" rx="15" fill="#2c2c2e" />
      <rect x="26" y="22" width="148" height="216" rx="11" fill="url(#is)" />
      {/* camera */}
      <circle cx="100" cy="17" r="4" fill="#111" />
      <circle cx="100" cy="17" r="2" fill="#333" />
      {/* home button */}
      <circle cx="100" cy="246" r="7" stroke="#444" strokeWidth="1.5" />
      {/* screen content */}
      <rect x="36" y="40" width="128" height="6" rx="3" fill="#60a5fa" opacity="0.8" />
      <rect x="36" y="54" width="88" height="4" rx="2" fill="#94a3b8" opacity="0.6" />
      <rect x="36" y="70" width="128" height="3" rx="1.5" fill="#475569" opacity="0.5" />
      <rect x="36" y="79" width="100" height="3" rx="1.5" fill="#475569" opacity="0.5" />
      {/* tool icon */}
      <circle cx="128" cy="160" r="30" fill="#7c3aed" opacity="0.85" />
      <path d="M120 152 L124 148 L132 156 L136 152 L128 160 L136 168" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <defs>
        <linearGradient id="is" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IlluWatch() {
  return (
    <svg viewBox="0 0 160 220" fill="none" className="w-full h-full max-h-64">
      {/* strap top */}
      <rect x="52" y="0" width="56" height="56" rx="8" fill="#1c1c1e" />
      <rect x="56" y="2" width="48" height="52" rx="6" fill="#2c2c2e" />
      {/* strap bottom */}
      <rect x="52" y="164" width="56" height="56" rx="8" fill="#1c1c1e" />
      <rect x="56" y="166" width="48" height="52" rx="6" fill="#2c2c2e" />
      {/* case */}
      <rect x="18" y="52" width="124" height="116" rx="32" fill="#1c1c1e" />
      <rect x="24" y="58" width="112" height="104" rx="26" fill="#2c2c2e" />
      {/* screen */}
      <rect x="30" y="64" width="100" height="92" rx="22" fill="url(#ws)" />
      {/* crown */}
      <rect x="144" y="96" width="10" height="28" rx="5" fill="#3a3a3c" />
      {/* watch face */}
      <circle cx="80" cy="110" r="34" fill="none" stroke="#374151" strokeWidth="0.5" />
      <line x1="80" y1="82" x2="80" y2="90" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="130" x2="80" y2="138" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
      <line x1="52" y1="110" x2="60" y2="110" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
      <line x1="100" y1="110" x2="108" y2="110" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
      {/* hands */}
      <line x1="80" y1="110" x2="80" y2="91" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="110" x2="94" y2="110" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="80" cy="110" r="3" fill="#ef4444" />
      <defs>
        <linearGradient id="ws" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0c0a09" />
          <stop offset="100%" stopColor="#292524" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function IlluData() {
  return (
    <svg viewBox="0 0 200 180" fill="none" className="w-full h-full max-h-56">
      {/* HDD body */}
      <rect x="20" y="30" width="160" height="120" rx="10" fill="#1c1c1e" />
      <rect x="26" y="36" width="148" height="108" rx="7" fill="#2c2c2e" />
      {/* platters */}
      <circle cx="90" cy="90" r="44" fill="#1a1a1a" stroke="#3a3a3c" strokeWidth="1" />
      <circle cx="90" cy="90" r="34" fill="#222" stroke="#444" strokeWidth="0.5" />
      <circle cx="90" cy="90" r="22" fill="#1c1c1e" stroke="#555" strokeWidth="0.5" />
      <circle cx="90" cy="90" r="8" fill="#374151" />
      <circle cx="90" cy="90" r="4" fill="#60a5fa" />
      {/* arm */}
      <line x1="90" y1="90" x2="150" y2="55" stroke="#4b5563" strokeWidth="3" strokeLinecap="round" />
      <circle cx="150" cy="55" r="6" fill="#374151" stroke="#60a5fa" strokeWidth="1.5" />
      {/* gloved hand hint */}
      <ellipse cx="162" cy="46" rx="14" ry="10" fill="#1d4ed8" opacity="0.8" />
      <ellipse cx="162" cy="46" rx="10" ry="7" fill="#2563eb" opacity="0.9" />
      {/* connectors */}
      <rect x="148" y="108" width="28" height="8" rx="2" fill="#374151" />
      <rect x="148" y="120" width="20" height="8" rx="2" fill="#374151" />
      {/* LED */}
      <circle cx="166" cy="66" r="4" fill="#22c55e" opacity="0.9" />
      {/* data lines */}
      <path d="M40 60 Q60 50 80 60" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
      <path d="M40 70 Q60 60 80 70" stroke="#60a5fa" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />
    </svg>
  );
}

const SLIDES: Slide[] = [
  {
    kind: "photo",
    img: heroImg,
    alt: "Apple naprave — iPhone, MacBook, iPad",
    tag: "iRepair Ljubljana",
    heading: "Apple servis specialist",
    sub: "Koprska 94 · Tor–Pet 8:30–17:00",
    cta: "Naročite popravilo →",
    ctaHref: "#narocilo",
  },
  {
    kind: "service",
    tag: "iPhone & iPad",
    heading: "Zamenjava zaslona ali baterije?",
    sub: "Večina popravil v 20 minutah — takoj na mestu.",
    cta: "Rezervirajte termin →",
    ctaHref: "#narocilo",
    accent: "#e8f0fe",
    Illustration: IlluPhone,
  },
  {
    kind: "service",
    tag: "MacBook & iMac",
    heading: "Popravilo logične plošče MacBook.",
    sub: "Specializirani za mikrosoldiranje in reševanje podatkov.",
    cta: "Rezervirajte termin →",
    ctaHref: "#narocilo",
    accent: "#f1f5f9",
    Illustration: IlluMacBook,
  },
  {
    kind: "service",
    tag: "iPad & iPad Pro",
    heading: "iPad servis z originalnimi deli.",
    sub: "Zamenjava zaslona, baterije in stekla z garancijo.",
    cta: "Rezervirajte termin →",
    ctaHref: "#narocilo",
    accent: "#ede9fe",
    Illustration: IlluIPad,
  },
  {
    kind: "service",
    tag: "Apple Watch",
    heading: "Servis Apple Watch vseh serij.",
    sub: "Zamenjava zaslona, baterije in stekla — hitro in zanesljivo.",
    cta: "Rezervirajte termin →",
    ctaHref: "#narocilo",
    accent: "#fafaf9",
    Illustration: IlluWatch,
  },
  {
    kind: "service",
    tag: "Reševanje podatkov",
    heading: "Reševanje podatkov iz spominskih kartic in trdih diskov.",
    sub: "Specializirani za reševanje podatkov iz vseh Apple naprav.",
    cta: "Rešite svoje podatke →",
    ctaHref: "#narocilo",
    accent: "#ecfdf5",
    Illustration: IlluData,
  },
];

/* ── slide renderers ───────────────────────────────────────── */
function PhotoSlideView({ s }: { s: PhotoSlide }) {
  return (
    <div className="w-full h-full relative bg-[#f0f0f0]">
      <img src={s.img} alt={s.alt} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center px-8">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-2">{s.tag}</span>
        <h3 className="text-2xl font-extrabold text-white leading-tight mb-1">{s.heading}</h3>
        <p className="text-sm text-white/70 mb-5">{s.sub}</p>
        <a href={s.ctaHref} className="inline-flex items-center text-sm font-bold text-white hover:text-white/80 transition-colors w-fit">
          {s.cta}
        </a>
      </div>
    </div>
  );
}

function ServiceSlideView({ s }: { s: ServiceSlide }) {
  const { Illustration } = s;
  return (
    <div className="w-full h-full flex" style={{ background: s.accent }}>
      {/* left — text */}
      <div className="flex flex-col justify-center px-7 py-6 w-[58%] min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#be123c] mb-3">{s.tag}</span>
        <h3 className="text-xl font-extrabold leading-snug text-[#0f172a] mb-2">{s.heading}</h3>
        <p className="text-sm text-[#475569] mb-5 leading-relaxed">{s.sub}</p>
        <a href={s.ctaHref} className="inline-flex items-center text-sm font-bold text-[#be123c] hover:text-[#9f1239] transition-colors w-fit">
          {s.cta}
        </a>
      </div>
      {/* right — illustration with rounded left edge */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            borderRadius: "50% 0 0 50%",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-6" style={{ borderRadius: "50% 0 0 50%", overflow: "hidden" }}>
          <Illustration />
        </div>
      </div>
    </div>
  );
}

/* ── slideshow ─────────────────────────────────────────────── */
function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(next, 3800);
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
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
        >
          {slide.kind === "photo"
            ? <PhotoSlideView s={slide} />
            : <ServiceSlideView s={slide} />}
        </div>
      ))}

      {/* progress bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
        {SLIDES.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full bg-black/15 overflow-hidden">
            <div
              className={`h-full rounded-full ${i === current ? "bg-[#be123c] transition-all duration-[3800ms] ease-linear w-full" : i < current ? "bg-[#be123c] w-full" : "w-0"}`}
            />
          </div>
        ))}
      </div>

      {/* arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/15 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
        aria-label="Nazaj"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-black/15 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
        aria-label="Naprej"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* dots */}
      <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all ${i === current ? "w-5 h-1.5 bg-[#be123c]" : "w-1.5 h-1.5 bg-black/25"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── hero section ──────────────────────────────────────────── */
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
