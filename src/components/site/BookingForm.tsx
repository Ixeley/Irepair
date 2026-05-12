import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const DEVICES = ["iPhone", "iPad", "MacBook", "iMac", "Apple Watch", "MagSafe", "Drugo"];
const ISSUES = ["Poškodovan zaslon", "Ne polni / Baterija", "Ne vključi se", "Stik s tekočino", "Počasen", "Izguba podatkov", "Tipkovnica ne deluje", "Drugo"];
const URGENCIES = [
  { v: "standard", l: "Standardno (2–5 dni)" },
  { v: "fast", l: "Hitra obdelava (1–2 dni)" },
  { v: "urgent", l: "URGENTNO 24h (+doplačilo)" },
];

export function BookingForm() {
  const [step, setStep] = useState(1);
  const [device, setDevice] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [urgency, setUrgency] = useState("standard");
  const [contact, setContact] = useState({ name: "", email: "", phone: "", address: "", description: "", courier: false, replacement: false });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleIssue = (i: string) =>
    setIssues((arr) => (arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]));

  const next = () => {
    if (step === 1 && !device) return toast.error("Izberite napravo");
    if (step === 2 && issues.length === 0) return toast.error("Izberite vsaj eno težavo");
    if (step === 4) {
      if (!contact.name || !contact.email || !contact.phone) return toast.error("Izpolnite obvezna polja");
    }
    setStep((s) => Math.min(5, s + 1));
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const submit = async () => {
    setSubmitting(true);
    const { error } = await supabase.from("contact_submissions").insert({
      device,
      issues,
      urgency,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address || null,
      description: contact.description || null,
      courier: contact.courier,
      replacement: contact.replacement,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Napaka pri pošiljanju. Poskusite znova ali pokličite 059 023 951.");
      return;
    }
    setDone(true);
    toast.success("Povpraševanje poslano!");
  };

  if (done) {
    return (
      <div className="bg-card rounded-3xl p-10 shadow-card text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/15 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h3 className="mt-5 text-2xl font-bold">Hvala za povpraševanje!</h3>
        <p className="mt-2 text-muted-foreground">Odgovorili vam bomo v 2 urah na <span className="font-medium text-foreground">{contact.email}</span>.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl p-6 sm:p-10 shadow-card">
      {/* progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${s < step ? "bg-success text-success-foreground" : s === step ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 5 && <div className={`h-0.5 flex-1 ${s < step ? "bg-success" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Izberite napravo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DEVICES.map((d) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`rounded-xl border-2 p-4 text-sm font-medium transition-all ${device === d ? "border-primary bg-accent" : "border-border hover:border-primary/40"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Kaj vas muči?</h3>
          <p className="text-sm text-muted-foreground">Izberete lahko več možnosti.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {ISSUES.map((i) => (
              <label key={i} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${issues.includes(i) ? "border-primary bg-accent" : "hover:border-primary/40"}`}>
                <Checkbox checked={issues.includes(i)} onCheckedChange={() => toggleIssue(i)} />
                <span className="text-sm font-medium">{i}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Urgentnost</h3>
          <RadioGroup value={urgency} onValueChange={setUrgency} className="space-y-2">
            {URGENCIES.map((u) => (
              <label key={u.v} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${urgency === u.v ? "border-primary bg-accent" : "hover:border-primary/40"}`}>
                <RadioGroupItem value={u.v} id={u.v} />
                <span className="text-sm font-medium">{u.l}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Kontaktni podatki</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Ime in priimek *</Label><Input className="mt-1.5" value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} /></div>
            <div><Label>Telefon *</Label><Input className="mt-1.5" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>E-pošta *</Label><Input type="email" className="mt-1.5" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Naslov (za kurirja)</Label><Input className="mt-1.5" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>Opis težave</Label><Textarea className="mt-1.5" rows={3} value={contact.description} onChange={(e) => setContact({ ...contact, description: e.target.value })} /></div>
          </div>
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={contact.courier} onCheckedChange={(v) => setContact({ ...contact, courier: !!v })} /> Želim kurirsko dostavo</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={contact.replacement} onCheckedChange={(v) => setContact({ ...contact, replacement: !!v })} /> Želim nadomestni telefon</label>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Pregled in potrditev</h3>
          <div className="rounded-xl bg-secondary/60 p-5 space-y-2 text-sm">
            <Row k="Naprava" v={device} />
            <Row k="Težave" v={issues.join(", ")} />
            <Row k="Urgentnost" v={URGENCIES.find((u) => u.v === urgency)?.l ?? ""} />
            <Row k="Ime" v={contact.name} />
            <Row k="E-pošta" v={contact.email} />
            <Row k="Telefon" v={contact.phone} />
            {contact.address && <Row k="Naslov" v={contact.address} />}
            {contact.description && <Row k="Opis" v={contact.description} />}
            {(contact.courier || contact.replacement) && (
              <Row k="Dodatno" v={[contact.courier && "Kurirska dostava", contact.replacement && "Nadomestni telefon"].filter(Boolean).join(", ")} />
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between gap-3 pt-8">
        <Button variant="ghost" onClick={prev} disabled={step === 1} className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-1" /> Nazaj
        </Button>
        {step < 5 ? (
          <Button onClick={next} className="rounded-full px-6">Naprej <ArrowRight className="h-4 w-4 ml-1" /></Button>
        ) : (
          <Button onClick={submit} disabled={submitting} className="rounded-full px-6 shadow-glow">
            {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Pošiljam...</> : "Pošlji povpraševanje"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-muted-foreground w-24 flex-shrink-0">{k}:</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

// Avoid unused import warnings for Select primitives if not used here
void Select; void SelectContent; void SelectItem; void SelectTrigger; void SelectValue;
