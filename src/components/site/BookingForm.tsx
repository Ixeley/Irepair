import { useState, useEffect, useRef } from "react";
import { updateVisitorState } from "@/lib/visitor-presence";
import { fetchServicePrices, DEFAULT_PRICES, type IssuePrices, type Tier } from "@/lib/service-prices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const DEVICES = ["iPhone", "iPad", "MacBook", "iMac", "Apple Watch", "MagSafe", "Drugo"];

// Issues are loaded dynamically from service prices (see prices state in BookingForm)

const URGENCIES = [
  { v: "standard", l: "Standardno (2–5 dni)" },
  { v: "fast", l: "Hitra obdelava (1–2 dni)" },
  { v: "urgent", l: "URGENTNO 24h", surcharge: "+50€ doplačilo" },
];

const DEVICE_MODELS: Record<string, string[]> = {
  iPhone: [
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone SE (3. gen)", "iPhone SE (2. gen)", "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X",
    "Starejši model",
  ],
  iPad: [
    'iPad Pro 13" (M4)', 'iPad Pro 11" (M4)', 'iPad Air 13" (M2)', 'iPad Air 11" (M2)',
    "iPad mini 7", "iPad mini 6", "iPad (10. gen)", "iPad (9. gen)",
    'iPad Pro 12.9" (5. gen)', 'iPad Pro 11" (3. gen)', "Starejši model",
  ],
  MacBook: [
    'MacBook Pro 16" (M4/M3)', 'MacBook Pro 14" (M4/M3)', 'MacBook Pro 16" (M2/M1)',
    'MacBook Pro 14" (M2/M1)', 'MacBook Pro 13" (M2/M1)',
    'MacBook Air 15" (M3/M2)', 'MacBook Air 13" (M3)', 'MacBook Air 13" (M2)', 'MacBook Air 13" (M1)',
    'MacBook Pro 13" (Intel 2019–2020)', 'MacBook Pro 15"/16" (Intel)',
    'MacBook Air (Intel 2018–2020)', "Starejši MacBook",
  ],
  iMac: [
    'iMac 24" (M4)', 'iMac 24" (M3)', 'iMac 24" (M1)',
    'iMac 27" (Intel)', 'iMac 21.5" (Intel)', "Starejši iMac",
  ],
  "Apple Watch": [
    "Apple Watch Ultra 2", "Apple Watch Series 10", "Apple Watch Series 9",
    "Apple Watch Series 8", "Apple Watch SE (2. gen)", "Apple Watch Series 7",
    "Apple Watch Series 6 ali starejši",
  ],
  MagSafe: ["MagSafe za MacBook", "MagSafe za iPhone"],
  Drugo: ["Drugo"],
};

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const MODEL_TIER: Record<string, Tier> = {
  "iPhone 16 Pro Max": "pro_max", "iPhone 15 Pro Max": "pro_max", "iPhone 14 Pro Max": "pro_max",
  "iPhone 13 Pro Max": "pro_max", "iPhone 12 Pro Max": "pro_max",
  "iPhone 16 Pro": "pro", "iPhone 16 Plus": "pro", "iPhone 16": "pro",
  "iPhone 15 Pro": "pro", "iPhone 15 Plus": "pro", "iPhone 15": "pro",
  "iPhone 14 Pro": "pro", "iPhone 14 Plus": "pro", "iPhone 14": "pro",
  "iPhone 13 Pro": "pro", "iPhone 13": "standard",
  "iPhone 12 Pro": "pro", "iPhone 12": "standard",
  "iPhone 11 Pro Max": "pro", "iPhone 11 Pro": "pro", "iPhone 11": "standard",
  "iPhone 13 mini": "mini_se", "iPhone 12 mini": "mini_se",
  "iPhone SE (3. gen)": "mini_se", "iPhone SE (2. gen)": "mini_se", "iPhone SE (1. gen)": "mini_se",
  "iPhone XS Max": "standard", "iPhone XS": "standard", "iPhone XR": "standard", "iPhone X": "standard",
  'MacBook Pro 16" (M4/M3)': "macbook_new", 'MacBook Pro 14" (M4/M3)': "macbook_new",
  'MacBook Pro 16" (M2/M1)': "macbook_new", 'MacBook Pro 14" (M2/M1)': "macbook_new",
  'MacBook Pro 13" (M2/M1)': "macbook_new", 'MacBook Air 15" (M3/M2)': "macbook_new",
  'MacBook Air 13" (M3)': "macbook_new", 'MacBook Air 13" (M2)': "macbook_new", 'MacBook Air 13" (M1)': "macbook_new",
  'MacBook Pro 13" (Intel 2019–2020)': "macbook_intel", 'MacBook Pro 15"/16" (Intel)': "macbook_intel",
  'MacBook Air (Intel 2018–2020)': "macbook_intel", "Starejši MacBook": "macbook_intel",
  'iPad Pro 13" (M4)': "ipad_pro", 'iPad Pro 11" (M4)': "ipad_pro", 'iPad Air 13" (M2)': "ipad_pro",
  'iPad Air 11" (M2)': "ipad_pro", 'iPad Pro 12.9" (5. gen)': "ipad_pro", 'iPad Pro 11" (3. gen)': "ipad_pro",
  "iPad mini 7": "ipad_std", "iPad mini 6": "ipad_std", "iPad (10. gen)": "ipad_std",
  "iPad (9. gen)": "ipad_std", "Starejši model": "ipad_std",
  "Apple Watch Ultra 2": "watch", "Apple Watch Series 10": "watch", "Apple Watch Series 9": "watch",
  "Apple Watch Series 8": "watch", "Apple Watch SE (2. gen)": "watch", "Apple Watch Series 7": "watch",
};

function getPrice(prices: IssuePrices, model: string, issue: string): string {
  const tier = MODEL_TIER[model] as Tier | undefined;
  if (!tier) return "Po diagnostiki";
  return prices[issue]?.[tier] ?? "Po diagnostiki";
}

// ---------------------------------------------------------------------------
// Device / model detection
// ---------------------------------------------------------------------------

function detectDeviceType(): string | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iPad";
  if (/Macintosh/.test(ua)) return "MacBook";
  return null;
}

function detectIphoneModel(): string {
  const w = Math.min(screen.width, screen.height);
  const h = Math.max(screen.width, screen.height);
  if (w === 430) return "iPhone 16 Plus";
  if (w === 402) return "iPhone 16 Pro";
  if (w === 393 && h === 874) return "iPhone 16 Pro";
  if (w === 393) return "iPhone 16";
  if (w === 390 && h === 844) return "iPhone 14";
  if (w === 375 && h === 812) return "iPhone 13 mini";
  if (w === 375 && h === 667) return "iPhone SE (2. gen)";
  if (w === 320) return "iPhone SE (1. gen)";
  return "iPhone 16 Pro Max";
}

function detectIpadModel(): string {
  const w = Math.min(screen.width, screen.height);
  if (w >= 1024) return 'iPad Pro 13" (M4)';
  if (w >= 834) return 'iPad Pro 11" (M4)';
  if (w >= 820) return 'iPad Air 11" (M2)';
  if (w >= 768) return "iPad (10. gen)";
  return "iPad mini 7";
}

function detectModel(deviceType: string): string | null {
  if (deviceType === "iPhone") return detectIphoneModel();
  if (deviceType === "iPad") return detectIpadModel();
  // MacBook: screen.width alone is not reliable enough — skip auto-model
  return null;
}

// ---------------------------------------------------------------------------
// Helpers to build ordered model list
// ---------------------------------------------------------------------------

function orderedModels(device: string, detectedModel: string | null): string[] {
  const list = DEVICE_MODELS[device] ?? [];
  if (!detectedModel || !list.includes(detectedModel)) return list;
  return [detectedModel, ...list.filter((m) => m !== detectedModel)];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookingForm() {
  const [prices, setPrices] = useState<IssuePrices>(DEFAULT_PRICES);
  const [step, setStep] = useState(1);
  const [device, setDevice] = useState("");
  const [model, setModel] = useState("");
  const [issues, setIssues] = useState<string[]>([]);
  const [urgency, setUrgency] = useState("standard");
  const [contact, setContact] = useState({
    name: "", email: "", phone: "", description: "", replacement: false,
  });
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detected values (set once on mount)
  const [detectedDevice, setDetectedDevice] = useState<string | null>(null);
  const [detectedModel, setDetectedModel] = useState<string | null>(null);

  useEffect(() => { fetchServicePrices().then(setPrices); }, []);

  useEffect(() => {
    const dd = detectDeviceType();
    if (dd) {
      setDetectedDevice(dd);
      setDevice(dd);
      const dm = detectModel(dd);
      setDetectedModel(dm);
      if (dm) setModel(dm);
    }
  }, []);

  const trackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Only start tracking from step 2 onwards — avoids showing auto-detected device before user confirms
    if (step < 2) return;
    if (trackTimer.current) clearTimeout(trackTimer.current);
    trackTimer.current = setTimeout(() => {
      updateVisitorState({
        activity: "booking",
        bookingStep: step,
        bookingDevice: device || undefined,
        bookingModel: model || undefined,
        bookingIssues: issues.length ? issues : undefined,
        bookingUrgency: urgency,
        bookingName: contact.name || undefined,
        bookingEmail: contact.email || undefined,
        bookingPhone: contact.phone || undefined,
      });
    }, 400);
    return () => { if (trackTimer.current) clearTimeout(trackTimer.current); };
  }, [step, device, model, issues, urgency, contact]);

  const toggleIssue = (i: string) =>
    setIssues((arr) => (arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]));

  const next = () => {
    if (step === 1 && !device) return toast.error("Izberite napravo");
    if (step === 2 && !model) return toast.error("Izberite model naprave");
    if (step === 3 && issues.length === 0) return toast.error("Izberite vsaj eno težavo");
    if (step === 5) {
      if (!contact.name || !contact.email || !contact.phone)
        return toast.error("Izpolnite obvezna polja");
    }
    setStep((s) => Math.min(6, s + 1));
  };
  const prev = () => setStep((s) => Math.max(1, s - 1));

  // When device changes, reset model (and seed detected model if applicable)
  const handleDeviceSelect = (d: string) => {
    setDevice(d);
    if (d === detectedDevice && detectedModel) {
      setModel(detectedModel);
    } else {
      setModel("");
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/.netlify/functions/send-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device,
          model,
          issues,
          urgency,
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          description: contact.description,
          replacement: contact.replacement,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Napaka pri pošiljanju. Pokličite 059 023 951.");
        return;
      }
      setDone(true);
      toast.success("Povpraševanje poslano! Preverite e-pošto.");
    } catch {
      toast.error("Napaka pri pošiljanju. Pokličite nas na 059 023 951.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------

  if (done) {
    return (
      <div className="bg-card rounded-3xl p-10 shadow-card text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-success/15 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h3 className="mt-5 text-2xl font-bold">Hvala za povpraševanje!</h3>
        <p className="mt-2 text-muted-foreground">
          Odgovorili vam bomo v 2 urah na{" "}
          <span className="font-medium text-foreground">{contact.email}</span>.
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Price summary helpers (used in step 6)
  // ---------------------------------------------------------------------------

  const issuePrices = issues.map((iss) => ({ issue: iss, price: getPrice(prices, model, iss) }));
  const urgencyObj = URGENCIES.find((u) => u.v === urgency);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="bg-card rounded-3xl p-6 sm:p-10 shadow-card">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                s < step
                  ? "bg-success text-success-foreground"
                  : s === step
                  ? "gradient-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 6 && <div className={`h-0.5 flex-1 ${s < step ? "bg-success" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Step 1 — Device type                                               */}
      {/* ------------------------------------------------------------------ */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Izberite napravo</h3>
          {detectedDevice && (
            <p className="text-sm text-muted-foreground">
              Vaša naprava je bila samodejno zaznana.
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DEVICES.map((d) => (
              <button
                key={d}
                onClick={() => handleDeviceSelect(d)}
                className={`relative rounded-xl border-2 p-4 text-sm font-medium transition-all ${
                  device === d
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {d}
                {detectedDevice === d && (
                  <span className="absolute top-1.5 right-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground leading-none">
                    Zaznan
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Step 2 — Model selection                                           */}
      {/* ------------------------------------------------------------------ */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Izberite model</h3>
          <p className="text-sm text-muted-foreground">Izberite natančen model vaše naprave.</p>
          <div className="max-h-72 overflow-y-auto pr-1 space-y-2">
            {orderedModels(device, detectedModel).map((m) => (
              <button
                key={m}
                onClick={() => setModel(m)}
                className={`w-full flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all text-left ${
                  model === m
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <span className="flex-1">{m}</span>
                {detectedModel === m && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary leading-none whitespace-nowrap">
                    vaša naprava
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Step 3 — Issues with price hints                                   */}
      {/* ------------------------------------------------------------------ */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Kaj vas muči?</h3>
          <p className="text-sm text-muted-foreground">Izberete lahko več možnosti.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {Object.keys(prices).map((i) => {
              const price = getPrice(prices, model, i);
              return (
                <label
                  key={i}
                  className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                    issues.includes(i) ? "border-primary bg-accent" : "hover:border-primary/40"
                  }`}
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={issues.includes(i)}
                    onCheckedChange={() => toggleIssue(i)}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{i}</span>
                    <span className="text-xs text-muted-foreground">{price}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Step 4 — Urgency                                                   */}
      {/* ------------------------------------------------------------------ */}
      {step === 4 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Urgentnost</h3>
          <RadioGroup value={urgency} onValueChange={setUrgency} className="space-y-2">
            {URGENCIES.map((u) => (
              <label
                key={u.v}
                className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                  urgency === u.v ? "border-primary bg-accent" : "hover:border-primary/40"
                }`}
              >
                <RadioGroupItem value={u.v} id={u.v} />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{u.l}</span>
                  {u.surcharge && (
                    <span className="text-xs text-muted-foreground">{u.surcharge}</span>
                  )}
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Step 5 — Contact info                                              */}
      {/* ------------------------------------------------------------------ */}
      {step === 5 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Kontaktni podatki</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Ime in priimek *</Label>
              <Input
                className="mt-1.5"
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefon *</Label>
              <Input
                className="mt-1.5"
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>E-pošta *</Label>
              <Input
                type="email"
                className="mt-1.5"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Opis težave</Label>
              <Textarea
                className="mt-1.5"
                rows={3}
                value={contact.description}
                onChange={(e) => setContact({ ...contact, description: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={contact.replacement}
                onCheckedChange={(v) => setContact({ ...contact, replacement: !!v })}
              />
              Želim nadomestni telefon
            </label>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Step 6 — Summary with price breakdown                              */}
      {/* ------------------------------------------------------------------ */}
      {step === 6 && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="text-2xl font-bold">Pregled in potrditev</h3>
          <div className="rounded-xl bg-secondary/60 p-5 space-y-3 text-sm">
            <Row k="Naprava" v={device} />
            {model && <Row k="Model" v={model} />}
            {/* Issue + price breakdown */}
            <div className="flex gap-3">
              <span className="text-muted-foreground w-24 flex-shrink-0">Težave:</span>
              <span className="flex flex-col gap-1">
                {issuePrices.map(({ issue, price }) => (
                  <span key={issue} className="font-medium">
                    {issue}
                    {price && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {price}
                      </span>
                    )}
                  </span>
                ))}
              </span>
            </div>
            <div className="flex gap-3">
              <span className="text-muted-foreground w-24 flex-shrink-0">Urgentnost:</span>
              <span className="font-medium flex items-center gap-2">
                {urgencyObj?.l}
                {urgencyObj?.surcharge && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {urgencyObj.surcharge}
                  </span>
                )}
              </span>
            </div>
            <Row k="Ime" v={contact.name} />
            <Row k="E-pošta" v={contact.email} />
            <Row k="Telefon" v={contact.phone} />
            {contact.description && <Row k="Opis" v={contact.description} />}
            {contact.replacement && <Row k="Dodatno" v="Nadomestni telefon" />}
          </div>
          <p className="text-xs text-muted-foreground">
            * Cene so okvirne. Dokončna cena bo potrjena po pregledu naprave.
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Navigation                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex justify-between gap-3 pt-8">
        <Button variant="ghost" onClick={prev} disabled={step === 1} className="rounded-full">
          <ArrowLeft className="h-4 w-4 mr-1" /> Nazaj
        </Button>
        {step < 6 ? (
          <Button onClick={next} className="rounded-full px-6">
            Naprej <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={submit}
            disabled={submitting}
            className="rounded-full px-6 shadow-glow"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Pošiljam...
              </>
            ) : (
              "Pošlji povpraševanje"
            )}
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
