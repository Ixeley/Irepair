import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Pricing data (mirrors BookingForm)
// ---------------------------------------------------------------------------

const DEVICES = ["iPhone", "iPad", "MacBook", "iMac", "Apple Watch", "MagSafe", "Drugo"];

const ISSUES = [
  "Poškodovan zaslon",
  "Ne polni / Baterija",
  "Ne vključi se",
  "Stik s tekočino",
  "Počasen",
  "Izguba podatkov",
  "Tipkovnica ne deluje",
  "Drugo",
];

const URGENCIES = [
  { v: "standard", l: "Standardno (2–5 dni)" },
  { v: "fast",     l: "Hitra obdelava (1–2 dni)" },
  { v: "urgent",   l: "URGENTNO 24h (+50€)" },
];

const DEVICE_MODELS: Record<string, string[]> = {
  iPhone: [
    "iPhone 16 Pro Max","iPhone 16 Pro","iPhone 16 Plus","iPhone 16",
    "iPhone 15 Pro Max","iPhone 15 Pro","iPhone 15 Plus","iPhone 15",
    "iPhone 14 Pro Max","iPhone 14 Pro","iPhone 14 Plus","iPhone 14",
    "iPhone 13 Pro Max","iPhone 13 Pro","iPhone 13","iPhone 13 mini",
    "iPhone 12 Pro Max","iPhone 12 Pro","iPhone 12","iPhone 12 mini",
    "iPhone 11 Pro Max","iPhone 11 Pro","iPhone 11",
    "iPhone SE (3. gen)","iPhone SE (2. gen)","iPhone XS Max","iPhone XS","iPhone XR","iPhone X",
    "Starejši model",
  ],
  iPad: [
    'iPad Pro 13" (M4)','iPad Pro 11" (M4)','iPad Air 13" (M2)','iPad Air 11" (M2)',
    "iPad mini 7","iPad mini 6","iPad (10. gen)","iPad (9. gen)",
    'iPad Pro 12.9" (5. gen)','iPad Pro 11" (3. gen)',"Starejši model",
  ],
  MacBook: [
    'MacBook Pro 16" (M4/M3)','MacBook Pro 14" (M4/M3)','MacBook Pro 16" (M2/M1)',
    'MacBook Pro 14" (M2/M1)','MacBook Pro 13" (M2/M1)',
    'MacBook Air 15" (M3/M2)','MacBook Air 13" (M3)','MacBook Air 13" (M2)','MacBook Air 13" (M1)',
    'MacBook Pro 13" (Intel 2019–2020)','MacBook Pro 15"/16" (Intel)',
    'MacBook Air (Intel 2018–2020)',"Starejši MacBook",
  ],
  iMac: ['iMac 24" (M4)','iMac 24" (M3)','iMac 24" (M1)','iMac 27" (Intel)','iMac 21.5" (Intel)',"Starejši iMac"],
  "Apple Watch": [
    "Apple Watch Ultra 2","Apple Watch Series 10","Apple Watch Series 9",
    "Apple Watch Series 8","Apple Watch SE (2. gen)","Apple Watch Series 7","Starejši model",
  ],
  MagSafe: ["MagSafe za MacBook","MagSafe za iPhone"],
  Drugo: ["Drugo"],
};

type Tier = "pro_max"|"pro"|"standard"|"mini_se"|"macbook_new"|"macbook_intel"|"ipad_pro"|"ipad_std"|"watch"|"other";

const MODEL_TIER: Record<string, Tier> = {
  "iPhone 16 Pro Max":"pro_max","iPhone 15 Pro Max":"pro_max","iPhone 14 Pro Max":"pro_max","iPhone 13 Pro Max":"pro_max","iPhone 12 Pro Max":"pro_max",
  "iPhone 16 Pro":"pro","iPhone 16 Plus":"pro","iPhone 16":"pro",
  "iPhone 15 Pro":"pro","iPhone 15 Plus":"pro","iPhone 15":"pro",
  "iPhone 14 Pro":"pro","iPhone 14 Plus":"pro","iPhone 14":"pro",
  "iPhone 13 Pro":"pro","iPhone 13":"standard",
  "iPhone 12 Pro":"pro","iPhone 12":"standard",
  "iPhone 11 Pro Max":"pro","iPhone 11 Pro":"pro","iPhone 11":"standard",
  "iPhone 13 mini":"mini_se","iPhone 12 mini":"mini_se",
  "iPhone SE (3. gen)":"mini_se","iPhone SE (2. gen)":"mini_se","iPhone SE (1. gen)":"mini_se",
  "iPhone XS Max":"standard","iPhone XS":"standard","iPhone XR":"standard","iPhone X":"standard",
  'MacBook Pro 16" (M4/M3)':"macbook_new",'MacBook Pro 14" (M4/M3)':"macbook_new",
  'MacBook Pro 16" (M2/M1)':"macbook_new",'MacBook Pro 14" (M2/M1)':"macbook_new",
  'MacBook Pro 13" (M2/M1)':"macbook_new",'MacBook Air 15" (M3/M2)':"macbook_new",
  'MacBook Air 13" (M3)':"macbook_new",'MacBook Air 13" (M2)':"macbook_new",'MacBook Air 13" (M1)':"macbook_new",
  'MacBook Pro 13" (Intel 2019–2020)':"macbook_intel",'MacBook Pro 15"/16" (Intel)':"macbook_intel",
  'MacBook Air (Intel 2018–2020)':"macbook_intel","Starejši MacBook":"macbook_intel",
  'iPad Pro 13" (M4)':"ipad_pro",'iPad Pro 11" (M4)':"ipad_pro",'iPad Air 13" (M2)':"ipad_pro",
  'iPad Air 11" (M2)':"ipad_pro",'iPad Pro 12.9" (5. gen)':"ipad_pro",'iPad Pro 11" (3. gen)':"ipad_pro",
  "iPad mini 7":"ipad_std","iPad mini 6":"ipad_std","iPad (10. gen)":"ipad_std","iPad (9. gen)":"ipad_std","Starejši model":"ipad_std",
  "Apple Watch Ultra 2":"watch","Apple Watch Series 10":"watch","Apple Watch Series 9":"watch",
  "Apple Watch Series 8":"watch","Apple Watch SE (2. gen)":"watch","Apple Watch Series 7":"watch",
};

const ISSUE_PRICES: Record<string, Partial<Record<Tier, string>>> = {
  "Poškodovan zaslon":   { pro_max:"169–189€", pro:"139–159€", standard:"109–129€", mini_se:"89–99€", ipad_pro:"179–229€", ipad_std:"119–149€", macbook_new:"299–399€", macbook_intel:"199–279€", watch:"99–149€" },
  "Ne polni / Baterija": { pro_max:"89€", pro:"79€", standard:"69€", mini_se:"59€", ipad_pro:"99€", ipad_std:"79€", macbook_new:"129€", macbook_intel:"99€", watch:"79€" },
  "Ne vključi se":       { pro_max:"od 149€", pro:"od 149€", standard:"od 129€", mini_se:"od 99€", ipad_pro:"od 149€", ipad_std:"od 119€", macbook_new:"od 199€", macbook_intel:"od 149€", watch:"od 99€" },
  "Stik s tekočino":     { pro_max:"99–149€", pro:"89–129€", standard:"79–109€", mini_se:"79€", ipad_pro:"119–149€", ipad_std:"99–119€", macbook_new:"129–199€", macbook_intel:"99–149€", watch:"99€" },
  "Počasen":             { pro_max:"od 79€", pro:"od 79€", standard:"od 69€", mini_se:"od 59€", ipad_pro:"od 79€", ipad_std:"od 69€", macbook_new:"od 99€", macbook_intel:"od 79€", watch:"od 69€" },
  "Izguba podatkov":     { pro_max:"od 119€", pro:"od 109€", standard:"od 99€", mini_se:"od 99€", ipad_pro:"od 119€", ipad_std:"od 99€", macbook_new:"od 149€", macbook_intel:"od 119€", watch:"od 99€" },
  "Tipkovnica ne deluje":{ macbook_new:"149–249€", macbook_intel:"99–179€", pro_max:"od 99€", pro:"od 99€", standard:"od 79€", mini_se:"od 79€" },
  "Drugo":               { pro_max:"Po diagnostiki", pro:"Po diagnostiki", standard:"Po diagnostiki", mini_se:"Po diagnostiki", ipad_pro:"Po diagnostiki", ipad_std:"Po diagnostiki", macbook_new:"Po diagnostiki", macbook_intel:"Po diagnostiki", watch:"Po diagnostiki" },
};

function getPrice(model: string, issue: string): string {
  const tier = MODEL_TIER[model];
  if (!tier) return "Po diagnostiki";
  return ISSUE_PRICES[issue]?.[tier] ?? "Po diagnostiki";
}

function extractMin(price: string): number {
  const m = price.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function calcCost(model: string, issues: string[], urgency: string) {
  const DIAG = 20;
  const lines: { label: string; price: string }[] = [
    { label: "Diagnostika", price: "20€" },
  ];
  let min = DIAG;
  for (const issue of issues) {
    const p = getPrice(model, issue);
    lines.push({ label: issue, price: p });
    min += extractMin(p);
  }
  if (urgency === "urgent") {
    lines.push({ label: "Urgentno doplačilo", price: "+50€" });
    min += 50;
  }
  return { lines, total: `od ${min}€` };
}

// ---------------------------------------------------------------------------
// Chat state machine
// ---------------------------------------------------------------------------

type Step =
  | "device" | "model" | "issues" | "urgency"
  | "name" | "phone" | "email" | "confirm" | "sending" | "done";

interface Msg {
  role: "bot" | "user";
  text: string;
  options?: string[];          // single-choice buttons
  multiOptions?: string[];     // multi-select checkboxes → shows Nadaljuj button
  sendButton?: boolean;        // show "Pošlji povpraševanje" button
}

interface DiagState {
  device: string;
  model: string;
  issues: string[];
  urgency: string;
  name: string;
  phone: string;
  email: string;
}

const EMPTY: DiagState = { device:"", model:"", issues:[], urgency:"standard", name:"", phone:"", email:"" };

function botMsg(text: string, extras?: Partial<Msg>): Msg {
  return { role: "bot", text, ...extras };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("device");
  const [diag, setDiag] = useState<DiagState>(EMPTY);
  const [pendingIssues, setPendingIssues] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Build the full message history from state
  const messages = buildMessages(step, diag, pendingIssues);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  // Handle single-choice button click
  const handleOption = (value: string) => {
    if (step === "device") {
      setDiag(d => ({ ...d, device: value, model: "", issues: [] }));
      setPendingIssues([]);
      setStep("model");
    } else if (step === "model") {
      setDiag(d => ({ ...d, model: value }));
      setStep("issues");
    } else if (step === "urgency") {
      setDiag(d => ({ ...d, urgency: value }));
      setStep("name");
    }
  };

  // Toggle issue in pending list
  const toggleIssue = (issue: string) => {
    setPendingIssues(prev =>
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  // Confirm issues and move on
  const confirmIssues = () => {
    if (pendingIssues.length === 0) return;
    setDiag(d => ({ ...d, issues: pendingIssues }));
    setStep("urgency");
  };

  // Handle free-text input (name / phone / email)
  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    if (step === "name") {
      setDiag(d => ({ ...d, name: text }));
      setStep("phone");
    } else if (step === "phone") {
      setDiag(d => ({ ...d, phone: text }));
      setStep("email");
    } else if (step === "email") {
      setDiag(d => ({ ...d, email: text }));
      setStep("confirm");
    }
  };

  // Submit to send-booking function
  const handleSubmit = async () => {
    setSending(true);
    setStep("sending");
    const { total } = calcCost(diag.model, diag.issues, diag.urgency);
    try {
      const res = await fetch("/.netlify/functions/send-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device: diag.device,
          model: diag.model,
          issues: diag.issues,
          urgency: diag.urgency,
          name: diag.name,
          phone: diag.phone,
          email: diag.email,
          description: `Ocena stroškov: ${total}. Povpraševanje oddano prek klepeta.`,
          replacement: false,
          totalCost: total,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Napaka pri pošiljanju. Pokličite 059 023 951.");
        setStep("confirm");
      } else {
        setStep("done");
        toast.success("Povpraševanje poslano!");
      }
    } catch {
      toast.error("Napaka pri pošiljanju. Pokličite nas na 059 023 951.");
      setStep("confirm");
    } finally {
      setSending(false);
    }
  };

  const isTextStep = step === "name" || step === "phone" || step === "email";
  const lastMsg = messages[messages.length - 1];

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:scale-110 transition-transform animate-float"
          aria-label="Odpri klepet"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-background" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm bg-card rounded-3xl shadow-card overflow-hidden animate-fade-up flex flex-col"
          style={{ maxHeight: "calc(100vh - 3rem)" }}
        >
          {/* Header */}
          <div className="gradient-primary text-primary-foreground p-4 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="font-semibold">iRepair diagnostika</div>
              <div className="text-xs opacity-80 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" /> Ocena stroškov brezplačna
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Zapri" className="hover:opacity-80">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 bg-secondary/30 space-y-3 text-sm"
            style={{ minHeight: "300px", maxHeight: "400px" }}
          >
            {messages.map((m, i) => (
              <div key={i}>
                <div
                  className={`p-3 max-w-[88%] shadow-soft whitespace-pre-wrap ${
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                      : "bg-card rounded-2xl rounded-tl-sm"
                  }`}
                >
                  {m.text}
                </div>

                {/* Single-choice buttons */}
                {m.options && i === messages.length - 1 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {m.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleOption(opt)}
                        className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Multi-select issues */}
                {m.multiOptions && i === messages.length - 1 && (
                  <div className="mt-2 space-y-1.5">
                    {m.multiOptions.map(opt => (
                      <label
                        key={opt}
                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer text-xs transition-colors ${
                          pendingIssues.includes(opt)
                            ? "border-primary bg-accent"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <span className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                          pendingIssues.includes(opt) ? "bg-primary border-primary" : "border-muted-foreground"
                        }`}>
                          {pendingIssues.includes(opt) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={pendingIssues.includes(opt)}
                          onChange={() => toggleIssue(opt)}
                        />
                        {opt}
                      </label>
                    ))}
                    <Button
                      size="sm"
                      className="w-full rounded-full mt-2"
                      disabled={pendingIssues.length === 0}
                      onClick={confirmIssues}
                    >
                      Nadaljuj ({pendingIssues.length} izbrano)
                    </Button>
                  </div>
                )}

                {/* Send button on confirm step */}
                {m.sendButton && i === messages.length - 1 && (
                  <div className="mt-3">
                    <Button
                      className="w-full rounded-full shadow-glow"
                      onClick={handleSubmit}
                      disabled={sending}
                    >
                      {sending
                        ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Pošiljam...</>
                        : "✉️ Pošlji povpraševanje"}
                    </Button>
                    <button
                      className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => { setStep("device"); setDiag(EMPTY); setPendingIssues([]); }}
                    >
                      Začni znova
                    </button>
                  </div>
                )}
              </div>
            ))}

            {step === "sending" && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="h-4 w-4 animate-spin" /> Pošiljam...
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="p-3 border-t flex gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              disabled={!isTextStep}
              placeholder={
                step === "name" ? "Vaše ime in priimek..." :
                step === "phone" ? "Vaša telefonska številka..." :
                step === "email" ? "Vaš e-mail naslov..." :
                "Izberite možnost zgoraj..."
              }
              className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
            />
            <Button
              size="icon"
              className="rounded-full h-10 w-10 flex-shrink-0"
              onClick={handleSend}
              disabled={!isTextStep || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Build message list from current state
// ---------------------------------------------------------------------------

function buildMessages(step: Step, diag: DiagState, pendingIssues: string[]): Msg[] {
  const msgs: Msg[] = [];

  // Greeting
  msgs.push(botMsg(
    "👋 Pozdravljeni! Sem iRepair diagnostični pomočnik.\n\nPomagal vam bom oceniti stroške popravila in poslal povpraševanje v servis.\n\nKatero napravo imate?",
    { options: DEVICES }
  ));

  if (!diag.device) return msgs;

  msgs.push({ role: "user", text: diag.device });

  // Model
  msgs.push(botMsg(
    `Kateri model ${diag.device} imate?`,
    { options: DEVICE_MODELS[diag.device] ?? ["Drugo"] }
  ));

  if (!diag.model) return msgs;

  msgs.push({ role: "user", text: diag.model });

  // Issues
  msgs.push(botMsg(
    "Katere težave imate z napravo?\nLahko izberete več možnosti hkrati.",
    { multiOptions: ISSUES }
  ));

  if (step === "issues") return msgs;

  msgs.push({ role: "user", text: diag.issues.join(", ") });

  // Urgency
  msgs.push(botMsg(
    "Kako urgentno potrebujete popravilo?",
    { options: URGENCIES.map(u => u.l) }
  ));

  if (step === "urgency") return msgs;

  const urgencyLabel = URGENCIES.find(u => u.v === diag.urgency)?.l ?? diag.urgency;
  msgs.push({ role: "user", text: urgencyLabel });

  // Price breakdown
  const { lines, total } = calcCost(diag.model, diag.issues, diag.urgency);
  const priceLines = lines.map(l => `  • ${l.label}: ${l.price}`).join("\n");
  msgs.push(botMsg(
    `💰 Ocena stroškov za ${diag.model}:\n\n${priceLines}\n${"─".repeat(28)}\n  Skupaj: ${total}\n\n(Diagnostika 20€ se vedno zaračuna in se odšteje od popravila.)\n\nZa pošiljanje povpraševanja potrebujem še vaše podatke.\n\nKako vam je ime?`
  ));

  if (step === "name") return msgs;

  msgs.push({ role: "user", text: diag.name });
  msgs.push(botMsg(`Hvala, ${diag.name}! Katera je vaša telefonska številka?`));

  if (step === "phone") return msgs;

  msgs.push({ role: "user", text: diag.phone });
  msgs.push(botMsg("In vaš e-mail naslov?"));

  if (step === "email") return msgs;

  msgs.push({ role: "user", text: diag.email });

  // Confirm
  if (step === "confirm" || step === "sending") {
    const { lines: cl, total: ct } = calcCost(diag.model, diag.issues, diag.urgency);
    const summary = [
      `📱 ${diag.device} — ${diag.model}`,
      `🔧 ${diag.issues.join(", ")}`,
      `⚡ ${urgencyLabel}`,
      `💰 Ocena: ${ct}`,
      ``,
      `👤 ${diag.name}`,
      `📞 ${diag.phone}`,
      `📧 ${diag.email}`,
    ].join("\n");
    void cl;
    msgs.push(botMsg(
      `Odlično! Tukaj je povzetek:\n\n${summary}\n\nPotrdite pošiljanje povpraševanja na info@irepair.si — odgovorili vam bomo v 2 urah.`,
      { sendButton: step === "confirm" }
    ));
  }

  if (step === "done") {
    msgs.push(botMsg(
      `✅ Povpraševanje je bilo poslano!\n\nOdgovorili vam bomo v 2 urah na ${diag.email}.\n\nNas najdete na:\n📍 Koprska 94, Ljubljana\n📞 059 023 951\n🕐 Tor–Pet: 8:30–17:00`
    ));
  }

  return msgs;
}
