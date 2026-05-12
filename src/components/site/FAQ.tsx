import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  ["Koliko časa traja popravilo?", "Standardno popravilo traja 2–5 dni, manjša popravila (npr. zamenjava zaslona iPhone) le 20 minut. Urgentna opcija v 24 urah."],
  ["Ali nudite garancijo?", "Da, na vsa popravila nudimo garancijo. Trajanje je odvisno od storitve in se giblje od 3 do 12 mesecev."],
  ["Kaj če je naprava v stiku s tekočino?", "Takoj jo izklopite in nas pokličite. Hitri odziv močno poveča možnost popolnega popravila."],
  ["Ali lahko dobim nadomestni telefon?", "Da, brezplačno za čas trajanja popravila (do razpoložljivosti)."],
  ["Kako deluje diagnostika?", "Diagnostika vidnih napak je brezplačna. Če je potrebno odpreti napravo, se diagnostika zaračuna — cena pa se odšteje od končnega popravila."],
  ["Kako oddam napravo?", "Napravo prinesete osebno v našo poslovalnico na Koprski 94 v Ljubljani. Sprejem in prevzem sta možna le osebno."],
  ["Katere načine plačila sprejemate?", "Gotovina, kartice (Visa, Mastercard), nakazilo, Pay-Pass."],
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 bg-secondary/40">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">FAQ</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Pogosta vprašanja</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map(([q, a], i) => (
            <AccordionItem key={i} value={`${i}`} className="bg-card rounded-2xl border-0 shadow-soft px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
