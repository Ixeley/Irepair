import { Wrench, HardDrive, Droplets, Zap, Type, Keyboard, Gauge, Smartphone } from "lucide-react";

const services = [
  { icon: Wrench, title: "Popravilo matičnih plošč", desc: "Popravljamo nepopravljive.", price: "Od 89€" },
  { icon: HardDrive, title: "Reševanje podatkov", desc: "Vaši podatki so varni.", price: "Od 99€" },
  { icon: Droplets, title: "Stik s tekočino", desc: "Hitri odziv = rešitev.", price: "Od 79€" },
  { icon: Zap, title: "Urgentno popravilo", desc: "24-urna obdelava.", price: "+50€" },
  { icon: Type, title: "Lasersko graviranje", desc: "Slovenska tipkovnica.", price: "Od 49€" },
  { icon: Keyboard, title: "Menjava tipk", desc: "Tuji Mac → SLO razpored.", price: "Od 39€" },
  { icon: Gauge, title: "Počasen Mac", desc: "Pohitritev brez nakupa.", price: "Od 99€" },
  { icon: Smartphone, title: "Zamenjava zaslona", desc: "20 minut do novega.", price: "Od 89€" },
];

export function Services() {
  return (
    <section id="storitve" className="py-20 bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Storitve</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Specializirano za Apple</h2>
          <p className="mt-3 text-muted-foreground">Od enostavnih menjav do najzahtevnejših popravil matičnih plošč.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((s) => (
            <div key={s.title} className="group bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-primary-foreground group-hover:scale-110 transition-transform">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-semibold text-primary">{s.price}</span>
                <a href="#narocilo" className="text-muted-foreground hover:text-primary transition-colors">Več →</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
