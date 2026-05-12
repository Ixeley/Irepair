import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const groups = [
  {
    title: "iPhone",
    items: [
      ["Zamenjava zaslona", "Od 89€"],
      ["Zamenjava baterije", "Od 59€"],
      ["Popravilo matične plošče", "Od 149€"],
      ["Stik s tekočino", "Od 79€"],
    ],
  },
  {
    title: "iPad",
    items: [
      ["Zamenjava zaslona", "Od 129€"],
      ["Zamenjava baterije", "Od 89€"],
      ["Popravilo priključka", "Od 79€"],
    ],
  },
  {
    title: "MacBook",
    items: [
      ["Čiščenje + servis", "Od 99€"],
      ["SSD nadgradnja", "Od 149€"],
      ["Zamenjava tipkovnice", "Od 199€"],
      ["Popravilo matične plošče", "Od 199€"],
    ],
  },
];

export function Pricing() {
  return (
    <section id="cenik" className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Cenik</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Pregledne, poštene cene</h2>
          <p className="mt-3 text-muted-foreground text-sm">* Cene so okvirne. Natančno ponudbo prejmete po diagnostiki naprave.</p>
        </div>
        <Accordion type="single" collapsible defaultValue="iPhone" className="space-y-3">
          {groups.map((g) => (
            <AccordionItem key={g.title} value={g.title} className="bg-card rounded-2xl border-0 shadow-soft px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline py-5">{g.title}</AccordionTrigger>
              <AccordionContent>
                <ul className="divide-y">
                  {g.items.map(([s, p]) => (
                    <li key={s} className="flex justify-between py-3 text-sm">
                      <span>{s}</span>
                      <span className="font-semibold text-primary">{p}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
