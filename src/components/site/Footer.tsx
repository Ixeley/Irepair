export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-14 grid gap-10 md:grid-cols-4">
        <div>
          <div className="text-2xl font-bold">i<span className="text-primary">Repair</span></div>
          <p className="mt-3 text-sm opacity-70 max-w-xs">Vodilni Apple servis v Ljubljani. Specializirani za matične plošče in reševanje podatkov.</p>
        </div>
        <div>
          <div className="font-semibold mb-3">Storitve</div>
          <ul className="space-y-2 text-sm opacity-70">
            <li><a href="#storitve" className="hover:opacity-100">Popravilo iPhone</a></li>
            <li><a href="#storitve" className="hover:opacity-100">Popravilo MacBook</a></li>
            <li><a href="#storitve" className="hover:opacity-100">Reševanje podatkov</a></li>
            <li><a href="#storitve" className="hover:opacity-100">Stik s tekočino</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Kontakt</div>
          <ul className="space-y-2 text-sm opacity-70">
            <li>Koprska 94, Ljubljana</li>
            <li><a href="tel:059023951" className="hover:opacity-100">059 023 951</a></li>
            <li><a href="mailto:info@irepair.si" className="hover:opacity-100">info@irepair.si</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-3">Pravno</div>
          <ul className="space-y-2 text-sm opacity-70">
            <li><a href="#" className="hover:opacity-100">Politika zasebnosti</a></li>
            <li><a href="#" className="hover:opacity-100">Pogoji poslovanja</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10">
        <div className="mx-auto max-w-7xl px-4 py-5 text-xs opacity-60">© {new Date().getFullYear()} iRepair. Vse pravice pridržane.</div>
      </div>
    </footer>
  );
}
