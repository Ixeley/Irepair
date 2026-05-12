import { CheckCircle2 } from "lucide-react";

const reasons = [
  "Diagnostika vidnih napak brezplačna",
  "Garancija na vse storitve",
  "Nadomestni telefon brezplačno",
  "Najvišja uspešnost popravila",
  "Sprejem in prevzem osebno v poslovalnici",
  "20+ let izkušenj z Apple napravami",
];

const stats = [
  { num: "10.000+", label: "popravljenih naprav" },
  { num: "98%", label: "zadovoljstvo strank" },
  { num: "24h", label: "urgentna opcija" },
  { num: "20+", label: "let izkušenj" },
];

export function WhyUs() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Zakaj iRepair</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Razlogi za zaupanje</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {reasons.map((r) => (
            <div key={r} className="flex items-center gap-3 bg-card rounded-xl p-4 shadow-soft">
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
              <span className="font-medium">{r}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 gradient-dark rounded-3xl p-10 text-background">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold">{s.num}</div>
              <div className="mt-1 text-sm opacity-70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
