import { Smartphone, Tablet, Laptop, Monitor, Watch, Zap } from "lucide-react";

const devices = [
  { icon: Smartphone, name: "iPhone", desc: "Vsi modeli" },
  { icon: Tablet, name: "iPad", desc: "Pro, Air, mini" },
  { icon: Laptop, name: "MacBook", desc: "Air & Pro" },
  { icon: Monitor, name: "iMac", desc: "Vse generacije" },
  { icon: Watch, name: "Apple Watch", desc: "Series 1–10" },
  { icon: Zap, name: "MagSafe", desc: "Polnilci & dodatki" },
];

export function Devices() {
  return (
    <section id="naprave" className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Naprave</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Katero napravo popravljamo?</h2>
          <p className="mt-3 text-muted-foreground">Izberite napravo in pojdimo na pot do popravila.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {devices.map((d) => (
            <a
              key={d.name}
              href="#narocilo"
              className="group relative bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all hover:-translate-y-1"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <d.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{d.name}</h3>
              <p className="text-sm text-muted-foreground">{d.desc}</p>
              <span className="absolute right-6 bottom-6 text-primary opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
