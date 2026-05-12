import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Award } from "lucide-react";
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
        <div className="relative animate-float">
          <div className="absolute inset-0 -z-10 blur-3xl opacity-40 bg-gradient-to-br from-primary to-transparent rounded-full" />
          <img
            src={heroImg}
            alt="Apple naprave - iPhone, MacBook, iPad"
            width={1600}
            height={1024}
            className="rounded-3xl shadow-card w-full h-auto"
          />
        </div>
      </div>
    </section>
  );
}
