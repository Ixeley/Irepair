import { BookingForm } from "./BookingForm";

export function BookingSection() {
  return (
    <section id="narocilo" className="py-20 bg-secondary/40">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Naročilo</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">Naročite popravilo v 2 minutah</h2>
          <p className="mt-3 text-muted-foreground">Odgovorimo v 2 urah · Sprejem osebno v poslovalnici</p>
        </div>
        <BookingForm />
      </div>
    </section>
  );
}
