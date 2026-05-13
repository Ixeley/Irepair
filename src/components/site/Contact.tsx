import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from "lucide-react";

export function Contact() {
  return (
    <section id="kontakt" className="py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Kontakt</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Pridite mimo ali nas pokličite</h2>
        </div>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="rounded-3xl overflow-hidden shadow-card aspect-video lg:aspect-auto lg:min-h-[260px]">
            <iframe
              title="iRepair Lokacija — Koprska 94, Ljubljana"
              src="https://www.google.com/maps?q=Koprska+94,+Ljubljana&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
            />
          </div>
          <div className="bg-card rounded-3xl p-8 shadow-soft space-y-5">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Naslov</div>
                <div className="font-semibold">Koprska 94, 1000 Ljubljana</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Telefon</div>
                <a href="tel:059023951" className="font-semibold hover:text-primary">059 023 951</a>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">E-pošta</div>
                <a href="mailto:info@irepair.si" className="font-semibold hover:text-primary">info@irepair.si</a>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Delovni čas</div>
                <div className="font-semibold">Tor–Pet: 8:30–17:00<br />Pon zaprto · Sob/Ned po dogovoru</div>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t">
              <a href="https://www.facebook.com/irepair.slovenija/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-10 w-10 rounded-full bg-accent flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/irepair.si/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-10 w-10 rounded-full bg-accent flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
