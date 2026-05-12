import { Package, Search, FileText, Wrench, ShieldCheck, PartyPopper } from "lucide-react";

const steps = [
  { icon: Package, title: "Oddaja", desc: "Napravo prinesete osebno v poslovalnico." },
  { icon: Search, title: "Diagnostika", desc: "Hitra. Brezplačna za vidne napake." },
  { icon: FileText, title: "Ponudba", desc: "Jasna, brez presenečenj." },
  { icon: Wrench, title: "Popravilo", desc: "Od 20 min do 5 dni." },
  { icon: ShieldCheck, title: "Test + Garancija", desc: "Temeljito preverjeno." },
  { icon: PartyPopper, title: "Prevzem", desc: "Osebno v poslovalnici." },
];

export function Process() {
  return (
    <section id="proces" className="py-20 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Proces</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Kako poteka popravilo?</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
          {steps.map((s, i) => (
            <div key={s.title} className="relative bg-card rounded-2xl p-5 shadow-soft text-center">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-7 w-7 rounded-full gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                {i + 1}
              </div>
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-accent mt-3">
                <s.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-3 font-semibold text-sm">{s.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
