import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Pricing (mirrors BookingForm)
// ---------------------------------------------------------------------------

const DEVICES = ["iPhone", "iPad", "MacBook", "iMac", "Apple Watch", "MagSafe", "Drugo"];

const ALL_ISSUES = [
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

const MAC_UPSELL_OPTIONS = [
  "Čiščenje ventilatorjev — od 49€",
  "Nadgradnja SSD — od 79€",
  "Optimizacija performansa — od 69€",
];

type Tier = "pro_max"|"pro"|"standard"|"mini_se"|"macbook_new"|"macbook_intel"|"ipad_pro"|"ipad_std"|"watch"|"other";
const MODEL_TIER: Record<string, Tier> = {
  "iPhone 16 Pro Max":"pro_max","iPhone 15 Pro Max":"pro_max","iPhone 14 Pro Max":"pro_max","iPhone 13 Pro Max":"pro_max","iPhone 12 Pro Max":"pro_max",
  "iPhone 16 Pro":"pro","iPhone 16 Plus":"pro","iPhone 16":"pro","iPhone 15 Pro":"pro","iPhone 15 Plus":"pro","iPhone 15":"pro",
  "iPhone 14 Pro":"pro","iPhone 14 Plus":"pro","iPhone 14":"pro","iPhone 13 Pro":"pro","iPhone 13":"standard",
  "iPhone 12 Pro":"pro","iPhone 12":"standard","iPhone 11 Pro Max":"pro","iPhone 11 Pro":"pro","iPhone 11":"standard",
  "iPhone 13 mini":"mini_se","iPhone 12 mini":"mini_se",
  "iPhone SE (3. gen)":"mini_se","iPhone SE (2. gen)":"mini_se","iPhone SE (1. gen)":"mini_se",
  "iPhone XS Max":"standard","iPhone XS":"standard","iPhone XR":"standard","iPhone X":"standard",
  'MacBook Pro 16" (M4/M3)':"macbook_new",'MacBook Pro 14" (M4/M3)':"macbook_new",'MacBook Pro 16" (M2/M1)':"macbook_new",
  'MacBook Pro 14" (M2/M1)':"macbook_new",'MacBook Pro 13" (M2/M1)':"macbook_new",'MacBook Air 15" (M3/M2)':"macbook_new",
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
function extractMin(p: string): number { const m = p.match(/(\d+)/); return m ? parseInt(m[1]) : 0; }
function calcCost(model: string, issues: string[], urgency: string, extra: string) {
  const lines: { label: string; price: string }[] = [{ label: "Diagnostika", price: "20€" }];
  let min = 20;
  for (const issue of issues) {
    const p = getPrice(model, issue);
    lines.push({ label: issue, price: p });
    min += extractMin(p);
  }
  if (urgency === "urgent") { lines.push({ label: "Urgentno doplačilo", price: "+50€" }); min += 50; }
  if (extra) { const ep = extra.match(/\d+/); if (ep) { lines.push({ label: extra.replace(/ — .*/, ""), price: `${ep[0]}€` }); min += parseInt(ep[0]); } }
  return { lines, total: `od ${min}€` };
}

// ---------------------------------------------------------------------------
// Device detection
// ---------------------------------------------------------------------------

function detectDeviceType(): string | null {
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
  if (w === 393 && h >= 874) return "iPhone 16 Pro";
  if (w === 393) return "iPhone 16";
  if (w === 390) return "iPhone 14";
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
function detectModel(device: string): string | null {
  if (device === "iPhone") return detectIphoneModel();
  if (device === "iPad") return detectIpadModel();
  return null;
}

function isYes(t: string): boolean { return /^(da|ja|yes|ok|seveda|vsekakor)/i.test(t.trim()); }
function isNo(t: string): boolean  { return /^(ne|no|nope|nič|nic)/i.test(t.trim()); }

// ---------------------------------------------------------------------------
// FAQ matching — returns answer string or null
// ---------------------------------------------------------------------------

function sl(t: string): string {
  return t.toLowerCase().replace(/š/g,"s").replace(/č/g,"c").replace(/ž/g,"z").replace(/đ/g,"d");
}

function matchFaq(raw: string): string | null {
  const t = sl(raw);

  if (/garanc/.test(t))
    return "Da, na vsa popravila dajemo 3-mesečno garancijo. 🛡️\n\nČe se po popravilu pojavi ista težava, jo odpravimo brezplačno.";

  if (/\bkje\b|naslov|poslovalnic|lokacij|priti|najdem/.test(t))
    return "📍 Nahajamo se na:\nKoprska 94, 1000 Ljubljana\n\n🕐 Tor–Pet: 8:30–17:00\nPonedeljek smo zaprti.";

  if (/kdaj|delovni.?cas|ura|urnik|\boprt\b|odprt/.test(t))
    return "🕐 Delovni čas:\nTor–Pet: 8:30–17:00\n\nPonedeljek smo zaprti.\n\n📍 Koprska 94, Ljubljana";

  if (/koliko stan|cena|cenik|koliko kosta|strosek|koliko znas/.test(t))
    return "💰 Orientacijske cene (odvisno od modela):\n\n• Zamenjava zaslona: od 89€\n• Zamenjava baterije: od 59€\n• Vodna škoda: od 79€\n• Diagnostika: 20€ (odšteje se od popravila)\n\nNatančno ceno izračunam, če mi poveste model naprave.";

  if (/diagnostika|diagnoz/.test(t))
    return "🔍 Diagnostika vidnih napak je brezplačna.\n\nČe je treba odpreti napravo, zaračunamo 20€ — ta znesek se odšteje od končnega popravila.";

  if (/kako dolgo|koliko casa|cas popravil|rok|trajanje|kdaj bo/.test(t))
    return "⏱️ Okvirni roki:\n\n• Standardno: 2–5 dni\n• Hitra obdelava: 1–2 dni\n• Urgentno 24h: možno (+50€ doplačilo)";

  if (/nadomestn|posoditi|zacasn.*telefon/.test(t))
    return "📱 Med popravilom vam zagotovimo nadomestni telefon.\n\nZa rezervacijo nas pokličite: 059 023 951.";

  if (/kurirsk|posta|dostava|po post/.test(t))
    return "Naprave sprejemamo samo osebno v poslovalnici — kurirske dostave ne nudimo.\n\n📍 Koprska 94, Ljubljana\nTor–Pet: 8:30–17:00";

  if (/podatk|backup|varnost/.test(t))
    return "🔒 Vaši podatki so varni — naprav ne resetiramo brez vašega dovoljenja.\n\nPriporočamo, da naredite varnostno kopijo pred oddajo.";

  if (/placilo|placam|gotovina|kartic|bancn/.test(t))
    return "💳 Plačate lahko z gotovino ali bančno kartico.\n\nRačun prejmete po opravljenem popravilu.";

  if (/kontakt|telefon.*stev|klicete|poklic/.test(t))
    return "📞 Pokličite nas: 059 023 951\n📧 info@irepair.si\n\n🕐 Tor–Pet: 8:30–17:00";

  return null;
}

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

interface Msg {
  role: "bot" | "user";
  text: string;
  buttons?: { label: string; value: string }[];
  issueButtons?: string[];   // remaining issues to pick from
  sendButton?: boolean;
}

type Step =
  | "idle" | "device_confirm" | "device_select" | "model_select"
  | "issue_first" | "issue_more" | "issue_add"
  | "urgency" | "upsell" | "upsell_pick"
  | "name" | "phone" | "email"
  | "confirm" | "sending" | "done";

interface Diag {
  device: string; model: string;
  detectedDevice: string | null; detectedModel: string | null;
  issues: string[]; urgency: string; extra: string;
  name: string; phone: string; email: string;
}
const EMPTY_DIAG: Diag = {
  device:"", model:"", detectedDevice:null, detectedModel:null,
  issues:[], urgency:"standard", extra:"",
  name:"", phone:"", email:"",
};

const GREETING: Msg = {
  role: "bot",
  text: "Pozdravljeni! 👋 Sem iRepair pomočnik.\n\nOpišite težavo z napravo ali postavite vprašanje — pomagal vam bom oceniti stroške popravila.",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [diag, setDiag] = useState<Diag>(EMPTY_DIAG);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const push = (...msgs: Msg[]) => setMessages(prev => [...prev, ...msgs]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const remainingIssues = (current: string[]) =>
    ALL_ISSUES.filter(i => !current.includes(i));

  const isMac = (device: string) => device === "MacBook" || device === "iMac";

  // ── after urgency is set, go to upsell (Mac) or straight to name ─────────
  const afterUrgency = (d: Diag) => {
    if (isMac(d.device)) {
      setStep("upsell");
      push({ role: "bot", text: "Ker imate Mac, vam lahko ponudimo tudi kakšno dodatno storitev — čiščenje, SSD nadgradnja ali optimizacija. Vas zanima kaj od tega?", buttons: [{ label: "Da, zanima me", value: "yes" }, { label: "Ne, hvala", value: "no" }] });
    } else {
      askName(d);
    }
  };

  const askName = (d: Diag) => {
    const { lines, total } = calcCost(d.model, d.issues, d.urgency, d.extra);
    const priceLines = lines.map(l => `  • ${l.label}: ${l.price}`).join("\n");
    setStep("name");
    push({ role: "bot", text: `💰 Ocena stroškov za ${d.model || d.device}:\n\n${priceLines}\n${"─".repeat(26)}\n  Skupaj: ${total}\n\n(Diagnostika 20€ se odšteje od popravila.)\n\nZa pošiljanje povpraševanja potrebujem vaše podatke.\n\nKako vam je ime?` });
  };

  // ── main action handler ──────────────────────────────────────────────────

  const handleAction = (userText: string, value?: string) => {
    const val = value ?? userText;

    // Idle → first user message (or repair-start button)
    if (step === "idle") {
      if (val !== "__start_repair__") {
        push({ role: "user", text: userText });

        // Answer FAQ questions without entering the diagnostic flow
        const faqAnswer = matchFaq(userText);
        if (faqAnswer) {
          push({ role: "bot", text: faqAnswer, buttons: [{ label: "Naroči popravilo", value: "__start_repair__" }] });
          return;
        }
      } else {
        push({ role: "user", text: "Naroči popravilo" });
      }

      // Start diagnostic flow
      const dd = detectDeviceType();
      const dm = dd ? detectModel(dd) : null;
      const newDiag = { ...EMPTY_DIAG, detectedDevice: dd, detectedModel: dm };
      setDiag(newDiag);

      if (dd && dm) {
        setStep("device_confirm");
        push({ role: "bot", text: `Vidim, da pišete z ${dd} (${dm}). Ali potrebujete pomoč prav s to napravo?`, buttons: [{ label: `Da, imam ${dm}`, value: "yes" }, { label: "Ne, imam drugo napravo", value: "no" }] });
      } else if (dd) {
        setStep("device_confirm");
        push({ role: "bot", text: `Vidim, da pišete z ${dd}. Ali potrebujete pomoč s to napravo?`, buttons: [{ label: `Da, ${dd}`, value: "yes" }, { label: "Ne, imam drugo napravo", value: "no" }] });
      } else {
        setStep("device_select");
        push({ role: "bot", text: "Katera naprava vas skrbi?", buttons: DEVICES.map(d => ({ label: d, value: d })) });
      }
      return;
    }

    // Device confirm
    if (step === "device_confirm") {
      push({ role: "user", text: userText });
      if (val === "yes" || isYes(val)) {
        const device = diag.detectedDevice!;
        const model = diag.detectedModel ?? "";
        const updated = { ...diag, device, model };
        setDiag(updated);
        if (model) {
          setStep("issue_first");
          push({ role: "bot", text: "Katera je vaša glavna težava?", issueButtons: ALL_ISSUES });
        } else {
          setStep("model_select");
          push({ role: "bot", text: `Kateri model ${device} imate?`, buttons: (DEVICE_MODELS[device] ?? ["Drugo"]).map(m => ({ label: m, value: m })) });
        }
      } else {
        setStep("device_select");
        push({ role: "bot", text: "Katera naprava vas skrbi?", buttons: DEVICES.map(d => ({ label: d, value: d })) });
      }
      return;
    }

    // Device select
    if (step === "device_select") {
      push({ role: "user", text: val });
      const updated = { ...diag, device: val, model: "" };
      setDiag(updated);
      setStep("model_select");
      push({ role: "bot", text: `Kateri model ${val} imate?`, buttons: (DEVICE_MODELS[val] ?? ["Drugo"]).map(m => ({ label: m, value: m })) });
      return;
    }

    // Model select
    if (step === "model_select") {
      push({ role: "user", text: val });
      const updated = { ...diag, model: val };
      setDiag(updated);
      setStep("issue_first");
      push({ role: "bot", text: "Katera je vaša glavna težava?", issueButtons: ALL_ISSUES });
      return;
    }

    // Issue first pick
    if (step === "issue_first") {
      push({ role: "user", text: val });
      const updated = { ...diag, issues: [val] };
      setDiag(updated);
      setStep("issue_more");
      push({ role: "bot", text: `Razumem — ${val.toLowerCase()}. Je z napravo morda še kaj narobe?`, buttons: [{ label: "Da, še kaj je", value: "yes" }, { label: "Ne, samo to", value: "no" }] });
      return;
    }

    // Issue more? yes/no
    if (step === "issue_more") {
      push({ role: "user", text: userText });
      if (val === "yes" || isYes(val)) {
        setStep("issue_add");
        push({ role: "bot", text: "Izberite naslednjo težavo:", issueButtons: remainingIssues(diag.issues) });
      } else {
        setStep("urgency");
        push({ role: "bot", text: "Kako urgentno potrebujete popravilo?", buttons: URGENCIES.map(u => ({ label: u.l, value: u.v })) });
      }
      return;
    }

    // Issue add
    if (step === "issue_add") {
      push({ role: "user", text: val });
      const updated = { ...diag, issues: [...diag.issues, val] };
      setDiag(updated);
      setStep("issue_more");
      push({ role: "bot", text: `V redu. Je morda še kakšna težava?`, buttons: [{ label: "Da, še kaj je", value: "yes" }, { label: "Ne, to je vse", value: "no" }] });
      return;
    }

    // Urgency
    if (step === "urgency") {
      const label = URGENCIES.find(u => u.v === val)?.l ?? val;
      push({ role: "user", text: label });
      const updated = { ...diag, urgency: val };
      setDiag(updated);
      afterUrgency(updated);
      return;
    }

    // Upsell yes/no
    if (step === "upsell") {
      push({ role: "user", text: userText });
      if (val === "yes" || isYes(val)) {
        setStep("upsell_pick");
        push({ role: "bot", text: "Katera storitev vas zanima?", buttons: [...MAC_UPSELL_OPTIONS.map(o => ({ label: o, value: o })), { label: "Kar vse skupaj 😄", value: "Čiščenje + SSD + Optimizacija" }] });
      } else {
        askName(diag);
      }
      return;
    }

    // Upsell pick
    if (step === "upsell_pick") {
      push({ role: "user", text: val });
      const updated = { ...diag, extra: val };
      setDiag(updated);
      askName(updated);
      return;
    }

    // Name
    if (step === "name") {
      const text = userText.trim();
      push({ role: "user", text });
      const updated = { ...diag, name: text };
      setDiag(updated);
      setStep("phone");
      push({ role: "bot", text: `Hvala, ${text}! Katera je vaša telefonska številka?` });
      return;
    }

    // Phone
    if (step === "phone") {
      const text = userText.trim();
      push({ role: "user", text });
      const updated = { ...diag, phone: text };
      setDiag(updated);
      setStep("email");
      push({ role: "bot", text: "In vaš e-mail naslov?" });
      return;
    }

    // Email
    if (step === "email") {
      const text = userText.trim();
      push({ role: "user", text });
      const updated = { ...diag, email: text };
      setDiag(updated);
      showConfirm(updated);
      return;
    }
  };

  const showConfirm = (d: Diag) => {
    const urgLabel = URGENCIES.find(u => u.v === d.urgency)?.l ?? d.urgency;
    const { total } = calcCost(d.model, d.issues, d.urgency, d.extra);
    const lines = [
      `📱 ${d.device}${d.model ? ` — ${d.model}` : ""}`,
      `🔧 ${d.issues.join(", ")}`,
      d.extra ? `➕ ${d.extra.replace(/ — .*/, "")}` : "",
      `⚡ ${urgLabel}`,
      `💰 Ocena: ${total}`,
      ``,
      `👤 ${d.name}`,
      `📞 ${d.phone}`,
      `📧 ${d.email}`,
    ].filter(Boolean).join("\n");
    setStep("confirm");
    push({ role: "bot", text: `Odlično! Tukaj je povzetek:\n\n${lines}\n\nPotrdite pošiljanje na info@irepair.si — odgovorili vam bomo v 2 urah.`, sendButton: true });
  };

  const handleSubmit = async () => {
    setSending(true);
    setStep("sending");
    const { total } = calcCost(diag.model, diag.issues, diag.urgency, diag.extra);
    const description = [diag.extra ? `Dodatna storitev: ${diag.extra}.` : "", `Ocena: ${total}. Povpraševanje oddano prek klepeta.`].filter(Boolean).join(" ");
    try {
      const res = await fetch("/.netlify/functions/send-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device: diag.device, model: diag.model, issues: diag.issues, urgency: diag.urgency, name: diag.name, phone: diag.phone, email: diag.email, description, replacement: false, totalCost: total }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Napaka. Pokličite 059 023 951.");
        setStep("confirm");
      } else {
        setStep("done");
        push({ role: "bot", text: `✅ Povpraševanje je bilo poslano!\n\nOdgovorili vam bomo v 2 urah na ${diag.email}.\n\n📍 Koprska 94, Ljubljana\n📞 059 023 951\n🕐 Tor–Pet: 8:30–17:00` });
        toast.success("Povpraševanje poslano!");
      }
    } catch {
      toast.error("Napaka. Pokličite nas na 059 023 951.");
      setStep("confirm");
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    handleAction(text);
  };

  const isTextStep = ["idle","name","phone","email"].includes(step);
  const lastMsg = messages[messages.length - 1];

  const placeholder =
    step === "idle" ? "Opišite težavo ali postavite vprašanje..." :
    step === "name" ? "Vaše ime in priimek..." :
    step === "phone" ? "Telefonska številka..." :
    step === "email" ? "E-mail naslov..." :
    "Izberite možnost zgoraj...";

  const resetChat = () => { setStep("idle"); setDiag(EMPTY_DIAG); setMessages([GREETING]); setInput(""); };

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:scale-110 transition-transform animate-float" aria-label="Odpri klepet">
          <MessageCircle className="h-6 w-6" />
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-background" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm bg-card rounded-3xl shadow-card overflow-hidden animate-fade-up flex flex-col" style={{ maxHeight: "calc(100vh - 3rem)" }}>
          {/* Header */}
          <div className="gradient-primary text-primary-foreground p-4 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="font-semibold">iRepair pomočnik</div>
              <div className="text-xs opacity-80 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Ocena stroškov brezplačna</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Zapri" className="hover:opacity-80"><X className="h-5 w-5" /></button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-secondary/30 space-y-3 text-sm" style={{ minHeight: "300px", maxHeight: "420px" }}>
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              return (
                <div key={i}>
                  <div className={`p-3 max-w-[88%] shadow-soft whitespace-pre-wrap ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" : "bg-card rounded-2xl rounded-tl-sm"}`}>
                    {m.text}
                  </div>

                  {/* Generic buttons */}
                  {m.buttons && isLast && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.buttons.map(b => (
                        <button key={b.value} onClick={() => handleAction(b.label, b.value)} className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                          {b.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Issue buttons (one-pick, vertical list) */}
                  {m.issueButtons && isLast && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.issueButtons.map(issue => (
                        <button key={issue} onClick={() => handleAction(issue)} className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                          {issue}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Send button */}
                  {m.sendButton && isLast && step === "confirm" && (
                    <div className="mt-3 space-y-2">
                      <Button className="w-full rounded-full shadow-glow" onClick={handleSubmit} disabled={sending}>
                        {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Pošiljam...</> : "✉️ Pošlji povpraševanje"}
                      </Button>
                      <button className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={resetChat}>Začni znova</button>
                    </div>
                  )}
                </div>
              );
            })}

            {step === "sending" && (
              <div className="flex items-center gap-2 text-muted-foreground text-xs"><Loader2 className="h-4 w-4 animate-spin" /> Pošiljam...</div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              disabled={!isTextStep || step === "sending"}
              placeholder={placeholder}
              className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-40"
            />
            <Button size="icon" className="rounded-full h-10 w-10 flex-shrink-0" onClick={handleSend} disabled={!isTextStep || !input.trim() || step === "sending"}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
