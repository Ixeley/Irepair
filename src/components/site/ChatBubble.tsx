import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchServicePrices, DEFAULT_PRICES, type IssuePrices, type Tier } from "@/lib/service-prices";
import { updateVisitorState, getSessionId, liveChatChannel, VISITOR_CHANNEL } from "@/lib/visitor-presence";
import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const DEVICES = ["iPhone", "iPad", "MacBook", "iMac", "Apple Watch", "MagSafe", "Drugo"];

// Issues are loaded dynamically from service prices (see prices state in ChatBubble)

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
    'iPad Pro 12.9" (5. gen)','iPad Pro 11" (3. gen)',
    "iPad mini 7","iPad mini 6","iPad (10. gen)","iPad (9. gen)","Starejši model",
  ],
  MacBook: [
    'MacBook Pro 16" (M4 Pro/Max)','MacBook Pro 14" (M4 Pro/Max)','MacBook Pro 16" (M3 Pro/Max)',
    'MacBook Pro 14" (M3 Pro/Max)','MacBook Air 15" (M3)','MacBook Air 13" (M3)',
    'MacBook Air 15" (M2)','MacBook Air 13" (M2)',
    'MacBook Pro 13" (M2)','MacBook Pro 13" (M1)','MacBook Air 13" (M1)',
    'MacBook Pro 13" (Intel 2019–2020)','MacBook Pro 15"/16" (Intel)',
    'MacBook Air (Intel 2018–2020)',"Starejši MacBook",
  ],
  iMac: ["iMac 24\" (M3)","iMac 24\" (M1)","iMac 27\" (Intel)","Starejši iMac"],
  "Apple Watch": [
    "Apple Watch Ultra 2","Apple Watch Series 10","Apple Watch Series 9",
    "Apple Watch Series 8","Apple Watch SE (2. gen)","Apple Watch Series 7",
  ],
  MagSafe: ["MagSafe adapter","MagSafe kabel"],
};

const MAC_UPSELL_OPTIONS = [
  "Čiščenje ventilatorjev — od 49€",
  "Nadgradnja SSD — od 79€",
  "Optimizacija performansa — od 69€",
];

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const MODEL_TIER: Record<string, Tier> = {
  "iPhone 16 Pro Max":"pro_max","iPhone 15 Pro Max":"pro_max","iPhone 14 Pro Max":"pro_max","iPhone 13 Pro Max":"pro_max","iPhone 12 Pro Max":"pro_max",
  "iPhone 16 Pro":"pro","iPhone 16 Plus":"pro","iPhone 16":"pro",
  "iPhone 15 Pro":"pro","iPhone 15 Plus":"pro","iPhone 15":"pro",
  "iPhone 14 Pro":"pro","iPhone 14 Plus":"pro","iPhone 14":"pro",
  "iPhone 13 Pro":"pro",
  "iPhone 13":"standard","iPhone 13 mini":"mini_se",
  "iPhone 12 Pro":"pro",
  "iPhone 12":"standard","iPhone 12 mini":"mini_se",
  "iPhone 11 Pro Max":"pro_max","iPhone 11 Pro":"pro","iPhone 11":"standard",
  "iPhone SE (3. gen)":"mini_se","iPhone SE (2. gen)":"mini_se","iPhone SE (1. gen)":"mini_se",
  "iPhone XS Max":"pro_max","iPhone XS":"pro","iPhone XR":"standard","iPhone X":"pro",
  "Starejši model":"mini_se",
  'MacBook Pro 16" (M4 Pro/Max)':"macbook_new",'MacBook Pro 14" (M4 Pro/Max)':"macbook_new",
  'MacBook Pro 16" (M3 Pro/Max)':"macbook_new",'MacBook Pro 14" (M3 Pro/Max)':"macbook_new",
  'MacBook Air 15" (M3)':"macbook_new",'MacBook Air 13" (M3)':"macbook_new",
  'MacBook Air 15" (M2)':"macbook_new",'MacBook Air 13" (M2)':"macbook_new",
  'MacBook Pro 13" (M2)':"macbook_new",'MacBook Pro 13" (M1)':"macbook_new",
  'MacBook Air 13" (M1)':"macbook_new",
  'MacBook Pro 13" (Intel 2019–2020)':"macbook_intel",'MacBook Pro 15"/16" (Intel)':"macbook_intel",
  'MacBook Air (Intel 2018–2020)':"macbook_intel","Starejši MacBook":"macbook_intel",
  'iPad Pro 13" (M4)':"ipad_pro",'iPad Pro 11" (M4)':"ipad_pro",'iPad Air 13" (M2)':"ipad_pro",
  'iPad Air 11" (M2)':"ipad_pro",'iPad Pro 12.9" (5. gen)':"ipad_pro",'iPad Pro 11" (3. gen)':"ipad_pro",
  "iPad mini 7":"ipad_std","iPad mini 6":"ipad_std","iPad (10. gen)":"ipad_std","iPad (9. gen)":"ipad_std",
  "Apple Watch Ultra 2":"watch","Apple Watch Series 10":"watch","Apple Watch Series 9":"watch",
  "Apple Watch Series 8":"watch","Apple Watch SE (2. gen)":"watch","Apple Watch Series 7":"watch",
};

function getPriceCB(prices: IssuePrices, model: string, issue: string): string {
  const tier = MODEL_TIER[model];
  if (!tier) return "Po diagnostiki";
  return prices[issue]?.[tier] ?? "Po diagnostiki";
}
function extractMin(p: string): number { const m = p.match(/(\d+)/); return m ? parseInt(m[1]) : 0; }
function calcCost(prices: IssuePrices, model: string, issues: string[], urgency: string, extra: string) {
  const lines: { label: string; price: string }[] = [{ label: "Diagnostika", price: "20€" }];
  let min = 20;
  for (const issue of issues) {
    const p = getPriceCB(prices, model, issue);
    lines.push({ label: issue, price: p });
    min += extractMin(p);
  }
  if (urgency === "urgent") { lines.push({ label: "Urgentno doplačilo", price: "+50€" }); min += 50; }
  if (extra) { const ep = extra.match(/\d+/); if (ep) { lines.push({ label: extra.replace(/ — .*/, ""), price: `${ep[0]}€` }); min += parseInt(ep[0]); } }
  return { lines, total: `od ${min}€` };
}

// ---------------------------------------------------------------------------
// NLP intent parsing
// ---------------------------------------------------------------------------

// Issue keyword → canonical issue name
const ISSUE_KEYWORDS: [RegExp, string][] = [
  [/zaslon|ekran|screen|display|razbit|razpok|po[cč]en|cracked|crack|stekl/i, "Poškodovan zaslon"],
  [/baterij|ne.{0,5}polni|polnit|napolni|akumul/i, "Ne polni / Baterija"],
  [/ne.{0,6}vklopi|ne.{0,6}dela|ne.{0,6}zagene|ne.{0,6}pri[žz]ge|[cč]rn.{0,6}zaslon|black.?screen|ne.{0,6}start/i, "Ne vključi se"],
  [/voda|teko[cč]in|mokr|vlaga|stik.{0,8}vod|padel.{0,10}v.{0,6}(vod|umivalni|stran)/i, "Stik s tekočino"],
  [/po[cč]asen|zamrzuj|zamrzne|\bslow\b|lag|obesi|zasekava|traja/i, "Počasen"],
  [/podatk|recovery|izgubil|izbrisani|backup/i, "Izguba podatkov"],
  [/tipkovnic|keyboard|tipke|tipka|ne.{0,5}tip/i, "Tipkovnica ne deluje"],
];

// Lazy-built model match patterns, sorted from most specific (longest) to least
let _modelPatterns: Array<{ re: RegExp; device: string; model: string }> | null = null;
function getModelPatterns() {
  if (_modelPatterns) return _modelPatterns;
  const esc = (s: string) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\ /g, "\\s*");
  const entries: Array<{ len: number; re: RegExp; device: string; model: string }> = [];
  for (const [device, models] of Object.entries(DEVICE_MODELS)) {
    for (const model of models) {
      try {
        const core = model.replace(/^(iPhone|iPad|MacBook Pro|MacBook Air|MacBook|Apple Watch|iMac)\s+/i, "");
        const pFull = esc(model);
        const pCore = esc(core);
        const reStr = pCore !== pFull ? `(?:${pFull}|${pCore})` : pFull;
        entries.push({ len: model.length, re: new RegExp(reStr, "i"), device, model });
      } catch { /* skip malformed pattern */ }
    }
  }
  entries.sort((a, b) => b.len - a.len);
  _modelPatterns = entries;
  return _modelPatterns;
}

interface ParsedIntent { device: string; model: string; issues: string[] }

function parseIntent(text: string): ParsedIntent {
  const result: ParsedIntent = { device: "", model: "", issues: [] };
  // Extract issues
  const seen = new Set<string>();
  for (const [re, issue] of ISSUE_KEYWORDS) {
    if (re.test(text) && !seen.has(issue)) { seen.add(issue); result.issues.push(issue); }
  }
  // Extract model (most specific first)
  for (const { re, device, model } of getModelPatterns()) {
    if (re.test(text)) { result.device = device; result.model = model; break; }
  }
  // Fallback: device-only keywords
  if (!result.device) {
    const t = text.toLowerCase();
    if (/\biphone\b/.test(t)) result.device = "iPhone";
    else if (/\bipad\b/.test(t)) result.device = "iPad";
    else if (/\bmacbook\b|\bmac book\b/.test(t)) result.device = "MacBook";
    else if (/\bimac\b/.test(t)) result.device = "iMac";
    else if (/apple\s*watch/.test(t)) result.device = "Apple Watch";
    else if (/\bmac\b/.test(t)) result.device = "MacBook";
  }
  return result;
}

// ---------------------------------------------------------------------------
// Device detection from browser
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
// FAQ matching
// ---------------------------------------------------------------------------

function sl(t: string): string {
  return t.toLowerCase()
    .replace(/š/g,"s").replace(/č/g,"c").replace(/ž/g,"z").replace(/đ/g,"d");
}

function isRepairIntent(t: string): boolean {
  return /iphone|ipad|macbook|imac|samsung|huawei|xiaomi|motorola|telefon|tablica|laptop|racunalnik|zaslon|ekran|baterij|polni|vklopi|voda|tekocin|pocasen|tipkovnic|popravi|pokvarjen|kvaren|razbit|razpok|ne dela|strgan|crn zaslon/.test(t);
}
function looksLikeQuestion(t: string): boolean {
  return /\bali\b|\bkje\b|\bkdaj\b|\bkako\b|\bkakn|\bkoliko\b|\bkaj\b|\bimate\b|\bnudite\b|\bponujate\b|\bste\b|\bvasa\b|\bvase\b/.test(t);
}

function matchFaq(raw: string): string | null {
  const t = sl(raw);
  if (/\btel\b|telefonsk|tel\.?\s*stev|\bstev\b|kontakt|klicete|poklic|dosezem|napisete|email|e.?mail|napisem|naslov.*kontak/.test(t))
    return "📞 Pokličite nas: 059 023 951\n📧 info@irepair.si\n\n🕐 Tor–Pet: 8:30–17:00\n📍 Koprska 94, Ljubljana";
  if (/garanc/.test(t))
    return "Da, na vsa popravila dajemo 3-mesečno garancijo. 🛡️\n\nČe se po popravilu pojavi ista težava, jo odpravimo brezplačno.";
  if (/\bkje\b|naslov|poslovalnic|lokacij|priti|najdem/.test(t))
    return "📍 Nahajamo se na:\nKoprska 94, 1000 Ljubljana\n\n🕐 Tor–Pet: 8:30–17:00\nPonedeljek smo zaprti.";
  if (/kdaj|delovni.?cas|ura|urnik|odprt|zaprt/.test(t))
    return "🕐 Delovni čas:\nTor–Pet: 8:30–17:00\n\nPonedeljek smo zaprti.\n\n📍 Koprska 94, Ljubljana";
  if (/koliko.?stan|cena|cenik|koliko.?kosta|strosek|koliko.?znas|popravilo.?kosta/.test(t))
    return "💰 Orientacijske cene (odvisno od modela):\n\n• Zamenjava zaslona: od 89€\n• Zamenjava baterije: od 59€\n• Vodna škoda: od 79€\n• Diagnostika: 20€ (odšteje se od popravila)\n\nNatančno ceno izračunam, če mi poveste model naprave.";
  if (/diagnostika|diagnoz/.test(t))
    return "🔍 Diagnostika vidnih napak je brezplačna.\n\nČe je treba odpreti napravo, zaračunamo 20€ — ta znesek se odšteje od končnega popravila.";
  if (/kako.?dolgo|koliko.?casa|cas.?popravil|rok|trajanje|kdaj.?bo.?gotov|kdaj.?bom/.test(t))
    return "⏱️ Okvirni roki:\n\n• Standardno: 2–5 dni\n• Hitra obdelava: 1–2 dni\n• Urgentno 24h: možno (+50€ doplačilo)";
  if (/nadomestn|posoditi|zacasn.*(telefon|naprav)|izposoj/.test(t))
    return "📱 Med popravilom vam zagotovimo nadomestni telefon.\n\nZa rezervacijo nas pokličite: 059 023 951.";
  if (/kurirsk|posta|dostava|po.?post|poslat/.test(t))
    return "Naprave sprejemamo samo osebno v poslovalnici — kurirske dostave ne nudimo.\n\n📍 Koprska 94, Ljubljana\nTor–Pet: 8:30–17:00";
  if (/podatk|backup|rezervn.?kopij|varnost.*podatk/.test(t))
    return "🔒 Vaši podatki so varni — naprav ne resetiramo brez vašega dovoljenja.\n\nPriporočamo varnostno kopijo pred oddajo.";
  if (/placilo|placam|gotovina|kartic|bancn|kako.?plac/.test(t))
    return "💳 Plačate lahko z gotovino ali bančno kartico.\n\nRačun prejmete po opravljenem popravilu.";
  if (/kaj.?popravlj|katere.?storit|kaj.?nudite|kaj.?ponujate|kaj.*(delate|pocnete)/.test(t))
    return "🔧 Specializiramo se za:\n\n• Popravilo zaslonov (iPhone, iPad, MacBook)\n• Zamenjava baterij\n• Matične plošče — rebalansiranje & mikro-restavracija\n• Reševanje podatkov\n• Vodna škoda\n• Čiščenje, SSD nadgradnja (Mac)\n\nDelamo na vseh modelih Apple naprav.";
  if (looksLikeQuestion(t) && !isRepairIntent(t))
    return "Za podrobnejše informacije nas pokličite na 059 023 951 ali pišite na info@irepair.si. 😊\n\nAli vam pomagam z oceno stroška popravila?";
  return null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Msg {
  role: "bot" | "user";
  text: string;
  buttons?: { label: string; value: string }[];
  issueButtons?: string[];
  sendButton?: boolean;
}

type Step =
  | "idle" | "device_confirm" | "device_select" | "model_select"
  | "issue_first" | "issue_more" | "issue_add"
  | "urgency" | "upsell" | "upsell_pick"
  | "name" | "phone" | "email"
  | "confirm" | "sending" | "done"
  | "pre_live_device" | "pre_live_issue"
  | "live_chat_waiting" | "live_chat";

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatBubble() {
  const [prices, setPrices] = useState<IssuePrices>(DEFAULT_PRICES);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("idle");
  const [diag, setDiag] = useState<Diag>(EMPTY_DIAG);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const greeted = useRef(false);
  const liveChatRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [liveInput, setLiveInput] = useState("");

  useEffect(() => { fetchServicePrices().then(setPrices); }, []);

  // Dynamic greeting on first open — immediately suggests detected device
  useEffect(() => {
    if (!open || greeted.current) return;
    greeted.current = true;
    updateVisitorState({ chatActive: true });
    const dd = detectDeviceType();
    const dm = dd ? detectModel(dd) : null;
    setDiag(prev => ({ ...prev, detectedDevice: dd, detectedModel: dm }));

    const base = "Pozdravljeni! 👋 Sem iRepair pomočnik.\n\nOpišite težavo z napravo ali postavite vprašanje — pomagal vam bom oceniti stroške popravila.";
    if (dd && dm) {
      setMessages([{
        role: "bot",
        text: `${base}\n\n📱 Vidim, da pišete z ${dd} — ${dm}.`,
        buttons: [
          { label: `Imam težavo z ${dm}`, value: "__start_detected__" },
          { label: "Imam drugo napravo", value: "__start_other__" },
        ],
      }]);
    } else if (dd) {
      setMessages([{
        role: "bot",
        text: `${base}\n\n📱 Vidim, da pišete z ${dd}.`,
        buttons: [
          { label: `Imam težavo z ${dd}`, value: "__start_detected__" },
          { label: "Imam drugo napravo", value: "__start_other__" },
        ],
      }]);
    } else {
      setMessages([{ role: "bot", text: base }]);
    }
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);


  const push = (...msgs: Msg[]) => setMessages(prev => [...prev, ...msgs]);

  const remainingIssues = (current: string[]) => Object.keys(prices).filter(i => !current.includes(i));
  const isMac = (device: string) => device === "MacBook" || device === "iMac";

  const afterUrgency = (d: Diag) => {
    if (isMac(d.device)) {
      setStep("upsell");
      push({ role: "bot", text: "Ker imate Mac, vam lahko ponudimo tudi kakšno dodatno storitev — čiščenje, SSD nadgradnja ali optimizacija. Vas zanima kaj od tega?", buttons: [{ label: "Da, zanima me", value: "yes" }, { label: "Ne, hvala", value: "no" }] });
    } else {
      askName(d);
    }
  };

  const askName = (d: Diag) => {
    const { lines, total } = calcCost(prices, d.model, d.issues, d.urgency, d.extra);
    const priceLines = lines.map(l => `  • ${l.label}: ${l.price}`).join("\n");
    setStep("name");
    push({ role: "bot", text: `💰 Ocena stroškov za ${d.model || d.device}:\n\n${priceLines}\n${"─".repeat(26)}\n  Skupaj: ${total}\n\n(Diagnostika 20€ se odšteje od popravila.)\n\nZa pošiljanje povpraševanja potrebujem vaše podatke.\n\nKako vam je ime?` });
  };

  // Show quick price summary + ask if more issues
  const showQuickPrice = (d: Diag) => {
    const { lines, total } = calcCost(prices, d.model, d.issues, "standard", "");
    const priceLines = lines.map(l => `  • ${l.label}: ${l.price}`).join("\n");
    setStep("issue_more");
    push({
      role: "bot",
      text: `Razumem — ${d.issues.map(i => i.toLowerCase()).join(", ")} (${d.model || d.device}).\n\n💰 Okvirna cena:\n${priceLines}\n${"─".repeat(26)}\n  Skupaj: ${total}\n\nJe z napravo morda še kaj narobe?`,
      buttons: [{ label: "Ne, samo to", value: "no" }, { label: "Da, še kaj je", value: "yes" }],
    });
  };

  // ── main action handler ──────────────────────────────────────────────────

  const handleAction = (userText: string, value?: string) => {
    const val = value ?? userText;

    // ── Idle ──────────────────────────────────────────────────────────────
    if (step === "idle") {

      // Detected-device quick-start buttons
      if (val === "__start_detected__") {
        push({ role: "user", text: diag.detectedModel
          ? `Imam težavo z ${diag.detectedModel}`
          : `Imam težavo z ${diag.detectedDevice}` });
        const device = diag.detectedDevice!;
        const model = diag.detectedModel ?? "";
        const updated = { ...diag, device, model };
        setDiag(updated);
        if (model) {
          setStep("issue_first");
          push({ role: "bot", text: "Katera je vaša glavna težava?", issueButtons: Object.keys(prices) });
        } else {
          setStep("model_select");
          push({ role: "bot", text: `Kateri model ${device} imate?`, buttons: (DEVICE_MODELS[device] ?? []).map(m => ({ label: m, value: m })) });
        }
        return;
      }

      if (val === "__start_other__") {
        push({ role: "user", text: "Imam drugo napravo" });
        setStep("device_select");
        push({ role: "bot", text: "Katera naprava vas skrbi?", buttons: DEVICES.map(d => ({ label: d, value: d })) });
        return;
      }

      // Legacy start button from FAQ reply
      if (val === "__start_repair__") {
        push({ role: "user", text: "Naroči popravilo" });
        const dd = diag.detectedDevice;
        const dm = diag.detectedModel;
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

      // Free-text message
      push({ role: "user", text: userText });

      // Live agent request detection
      const tLower = userText.toLowerCase();
      if (/zaposlen|agent|[cč]lovek|operater|oseb|pogovor|poveži|poveji|live|prav[i]? [cč]lovek/.test(tLower) &&
          /ho[cč]|rab|pros|[žz]elim|daj|pokli[cč]|povezi|poveži/.test(tLower)) {
        requestLiveChat();
        return;
      }

      // FAQ check first
      const faqAnswer = matchFaq(userText);
      if (faqAnswer) {
        push({ role: "bot", text: faqAnswer, buttons: [{ label: "Naroči popravilo", value: "__start_repair__" }] });
        return;
      }

      // NLP: try to extract device/model/issues from the message
      const intent = parseIntent(userText);
      const dd = diag.detectedDevice;
      const dm = diag.detectedModel;

      const device = intent.device;
      const model = intent.model;
      const issues = intent.issues;

      const newDiag: Diag = { ...EMPTY_DIAG, detectedDevice: dd, detectedModel: dm, device, model, issues };
      setDiag(newDiag);

      if (device && model && issues.length > 0) {
        // Best case — have everything
        showQuickPrice(newDiag);
      } else if (device && model) {
        setStep("issue_first");
        push({ role: "bot", text: `Razumem — ${model}. Katera je vaša glavna težava?`, issueButtons: Object.keys(prices) });
      } else if (device && !model && DEVICE_MODELS[device]) {
        setStep("model_select");
        push({ role: "bot", text: `Kateri model ${device} imate?`, buttons: DEVICE_MODELS[device].map(m => ({ label: m, value: m })) });
      } else if (issues.length > 0 && !device) {
        // Know the issue, need device — offer browser-detected first
        if (dd && dm) {
          setStep("device_confirm");
          push({ role: "bot", text: `Razumem — ${issues[0].toLowerCase()}. Vidim, da pišete z ${dd} (${dm}). Je to naprava, ki jo želite popraviti?`, buttons: [{ label: `Da, ${dm}`, value: "yes" }, { label: "Ne, imam drugo napravo", value: "no" }] });
        } else if (dd) {
          setStep("device_confirm");
          push({ role: "bot", text: `Razumem — ${issues[0].toLowerCase()}. Vidim, da pišete z ${dd}. Je to ta naprava?`, buttons: [{ label: `Da, ${dd}`, value: "yes" }, { label: "Ne, imam drugo napravo", value: "no" }] });
        } else {
          setStep("device_select");
          push({ role: "bot", text: "Razumem. Katera naprava vas skrbi?", buttons: DEVICES.map(d => ({ label: d, value: d })) });
        }
      } else {
        // Nothing useful extracted — fall back to browser detection
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
      }
      return;
    }

    // ── Device confirm ────────────────────────────────────────────────────
    if (step === "device_confirm") {
      push({ role: "user", text: userText });
      if (val === "yes" || isYes(val)) {
        const device = diag.detectedDevice!;
        const model = diag.detectedModel ?? diag.model ?? "";
        const updated = { ...diag, device, model };
        setDiag(updated);
        if (model) updateVisitorState({ chatActive: true, chatDevice: device, chatModel: model });
        if (model) {
          if (updated.issues.length > 0) {
            showQuickPrice(updated);
          } else {
            setStep("issue_first");
            push({ role: "bot", text: "Katera je vaša glavna težava?", issueButtons: Object.keys(prices) });
          }
        } else {
          setStep("model_select");
          push({ role: "bot", text: `Kateri model ${device} imate?`, buttons: (DEVICE_MODELS[device] ?? []).map(m => ({ label: m, value: m })) });
        }
      } else {
        setDiag(prev => ({ ...prev, issues: [] }));
        setStep("device_select");
        push({ role: "bot", text: "Katera naprava vas skrbi?", buttons: DEVICES.map(d => ({ label: d, value: d })) });
      }
      return;
    }

    // ── Device select ─────────────────────────────────────────────────────
    if (step === "device_select") {
      push({ role: "user", text: val });
      const updated = { ...diag, device: val, model: "" };
      setDiag(updated);
      setStep("model_select");
      push({ role: "bot", text: `Kateri model ${val} imate?`, buttons: (DEVICE_MODELS[val] ?? ["Drugo"]).map(m => ({ label: m, value: m })) });
      return;
    }

    // ── Model select ──────────────────────────────────────────────────────
    if (step === "model_select") {
      push({ role: "user", text: val });
      const updated = { ...diag, model: val };
      setDiag(updated);
      updateVisitorState({ chatActive: true, chatDevice: updated.device, chatModel: val });
      if (updated.issues.length > 0) {
        showQuickPrice(updated);
      } else {
        setStep("issue_first");
        push({ role: "bot", text: "Katera je vaša glavna težava?", issueButtons: Object.keys(prices) });
      }
      return;
    }

    // ── Issue first ───────────────────────────────────────────────────────
    if (step === "issue_first") {
      push({ role: "user", text: val });
      const updated = { ...diag, issues: [val] };
      setDiag(updated);
      updateVisitorState({ chatIssues: updated.issues });
      showQuickPrice(updated);
      return;
    }

    // ── Issue more? yes/no ────────────────────────────────────────────────
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

    // ── Issue add ─────────────────────────────────────────────────────────
    if (step === "issue_add") {
      push({ role: "user", text: val });
      const updated = { ...diag, issues: [...diag.issues, val] };
      setDiag(updated);
      updateVisitorState({ chatIssues: updated.issues });
      setStep("issue_more");
      push({ role: "bot", text: "V redu. Je morda še kakšna težava?", buttons: [{ label: "Da, še kaj je", value: "yes" }, { label: "Ne, to je vse", value: "no" }] });
      return;
    }

    // ── Urgency ───────────────────────────────────────────────────────────
    if (step === "urgency") {
      const label = URGENCIES.find(u => u.v === val)?.l ?? val;
      push({ role: "user", text: label });
      const updated = { ...diag, urgency: val };
      setDiag(updated);
      afterUrgency(updated);
      return;
    }

    // ── Upsell yes/no ─────────────────────────────────────────────────────
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

    // ── Upsell pick ───────────────────────────────────────────────────────
    if (step === "upsell_pick") {
      push({ role: "user", text: val });
      const updated = { ...diag, extra: val };
      setDiag(updated);
      askName(updated);
      return;
    }

    // ── Name ──────────────────────────────────────────────────────────────
    if (step === "name") {
      const text = userText.trim();
      push({ role: "user", text });
      const updated = { ...diag, name: text };
      setDiag(updated);
      setStep("phone");
      push({ role: "bot", text: `Hvala, ${text}! Katera je vaša telefonska številka?` });
      return;
    }

    // ── Phone ─────────────────────────────────────────────────────────────
    if (step === "phone") {
      const text = userText.trim();
      push({ role: "user", text });
      const updated = { ...diag, phone: text };
      setDiag(updated);
      setStep("email");
      push({ role: "bot", text: "In vaš e-mail naslov?" });
      return;
    }

    // ── Email ─────────────────────────────────────────────────────────────
    if (step === "email") {
      const text = userText.trim();
      push({ role: "user", text });
      const updated = { ...diag, email: text };
      setDiag(updated);
      showConfirm(updated);
      return;
    }

    // ── Pre-live: device ──────────────────────────────────────────────────
    if (step === "pre_live_device") {
      push({ role: "user", text: val });
      const updated = { ...diag, device: val };
      setDiag(updated);
      updateVisitorState({ chatDevice: val });
      setStep("pre_live_issue");
      push({ role: "bot", text: "Kakšna je vaša težava?", issueButtons: Object.keys(prices) });
      return;
    }

    // ── Pre-live: issue ───────────────────────────────────────────────────
    if (step === "pre_live_issue") {
      push({ role: "user", text: val });
      const updated = { ...diag, issues: [val] };
      setDiag(updated);
      updateVisitorState({ chatIssues: [val] });
      doRequestLiveChat(updated);
      return;
    }
  };

  const showConfirm = (d: Diag) => {
    const urgLabel = URGENCIES.find(u => u.v === d.urgency)?.l ?? d.urgency;
    const { total } = calcCost(prices, d.model, d.issues, d.urgency, d.extra);
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
    const { total } = calcCost(prices, diag.model, diag.issues, diag.urgency, diag.extra);
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
    if (step === "live_chat") {
      push({ role: "user", text });
      liveChatRef.current?.send({ type: "broadcast", event: "chat_message", payload: { from: "user", text } });
      return;
    }
    handleAction(text);
  };

  const isTextStep = ["idle","name","phone","email","live_chat","live_chat_waiting","pre_live_device","pre_live_issue"].includes(step);

  const placeholder =
    step === "idle" ? "Opišite težavo, npr. 'počen zaslon na 16 Pro'..." :
    step === "name" ? "Vaše ime in priimek..." :
    step === "phone" ? "Telefonska številka..." :
    step === "email" ? "E-mail naslov..." :
    step === "live_chat" ? "Pišite zaposlenemu..." :
    step === "live_chat_waiting" ? "Opišite težavo medtem ko čakate..." :
    "Izberite možnost zgoraj...";

  // Actually open the live chat channel (called after pre-info is collected)
  const doRequestLiveChat = (d: Diag = diag) => {
    if (liveChatRef.current) return;
    updateVisitorState({ wantsLiveChat: true, chatDevice: d.device || undefined, chatModel: d.model || undefined, chatIssues: d.issues.length ? d.issues : undefined });
    setStep("live_chat_waiting");
    push({ role: "bot", text: "🔔 Sporočilo je poslano zaposlenemu.\n\nPočakajte, priključil se bo v kratkem." });

    const sid = getSessionId();
    const ch = supabase.channel(liveChatChannel(sid));

    ch.on("broadcast", { event: "chat_accept" }, () => {
      updateVisitorState({ liveChatActive: true, wantsLiveChat: false });
      setStep("live_chat");
      push({ role: "bot", text: "✅ Zaposleni se je pridružil klepetu!\n\nKako vam lahko pomagamo?" });
    });

    ch.on("broadcast", { event: "chat_message" }, ({ payload: p }) => {
      if (p.from === "admin") push({ role: "bot", text: p.text });
    });

    ch.on("broadcast", { event: "chat_end" }, () => {
      push({ role: "bot", text: "Zaposleni je zapustil klepet. Hvala za pogovor! 👋\n\nZa nadaljnjo pomoč pokličite 059 023 951." });
      setStep("done");
      updateVisitorState({ liveChatActive: false, wantsLiveChat: false });
      if (liveChatRef.current) { supabase.removeChannel(liveChatRef.current); liveChatRef.current = null; }
    });

    ch.on("broadcast", { event: "chat_handback" }, () => {
      updateVisitorState({ liveChatActive: false, wantsLiveChat: false, chatActive: true });
      if (liveChatRef.current) { supabase.removeChannel(liveChatRef.current); liveChatRef.current = null; }
      push({ role: "bot", text: "Zaposleni vas je predal nazaj pomočniku. 🤖" });
      setStep("device_select");
      push({ role: "bot", text: "Katera naprava vas skrbi?", buttons: DEVICES.map(d => ({ label: d, value: d })) });
    });

    ch.subscribe();
    liveChatRef.current = ch;
  };

  // Entry point — collect device+issue first if not known, then connect
  const requestLiveChat = () => {
    if (liveChatRef.current) return;
    if (!diag.device) {
      push({ role: "bot", text: "Preden pokličem zaposlenega — povejte mi za katero napravo gre:" });
      setStep("pre_live_device");
      push({ role: "bot", text: "", buttons: DEVICES.map(d => ({ label: d, value: d })) });
      return;
    }
    if (!diag.issues.length) {
      push({ role: "bot", text: "Kakšna je vaša težava?" });
      setStep("pre_live_issue");
      push({ role: "bot", text: "", issueButtons: Object.keys(prices) });
      return;
    }
    doRequestLiveChat();
  };

  const resetChat = () => {
    if (liveChatRef.current) { supabase.removeChannel(liveChatRef.current); liveChatRef.current = null; }
    updateVisitorState({ chatActive: false, wantsLiveChat: false, liveChatActive: false, chatDevice: undefined, chatModel: undefined, chatIssues: undefined });
    greeted.current = false;
    setStep("idle");
    setDiag(EMPTY_DIAG);
    setMessages([]);
    setInput("");
    setLiveInput("");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-50 h-14 w-14 rounded-full gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:scale-110 transition-transform animate-float"
          style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))", right: "1.5rem" }}
          aria-label="Odpri klepet"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-background" />
        </button>
      )}

      {open && (
        <div
          className="fixed z-50 bg-card rounded-3xl shadow-card overflow-hidden animate-fade-up flex flex-col"
          style={{
            bottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
            right: "1rem",
            left: "1rem",
            maxWidth: "24rem",
            marginLeft: "auto",
            maxHeight: "calc(100dvh - 5rem)",
          }}
        >
          {/* Header */}
          <div className="gradient-primary text-primary-foreground p-4 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="font-semibold">iRepair pomočnik</div>
              <div className="text-xs opacity-80 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /> Ocena stroškov brezplačna</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Zapri" className="hover:opacity-80 p-1"><X className="h-5 w-5" /></button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-secondary/30 space-y-3 text-sm" style={{ minHeight: "200px", maxHeight: "min(380px, 50dvh)" }}>
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              return (
                <div key={i}>
                  <div className={`p-3 max-w-[88%] shadow-soft whitespace-pre-wrap ${m.role === "user" ? "ml-auto bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" : "bg-card rounded-2xl rounded-tl-sm"}`}>
                    {m.text}
                  </div>

                  {m.buttons && isLast && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.buttons.map(b => (
                        <button key={b.value} onClick={() => handleAction(b.label, b.value)} className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                          {b.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {m.issueButtons && isLast && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.issueButtons.map(issue => (
                        <button key={issue} onClick={() => handleAction(issue)} className="rounded-full border border-primary/40 bg-card px-3 py-1.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors">
                          {issue}
                        </button>
                      ))}
                    </div>
                  )}

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

          {/* Live chat request button */}
          {!["done","sending","live_chat","live_chat_waiting"].includes(step) && (
            <div className="px-3 pb-2 flex-shrink-0 flex justify-center">
              <button onClick={requestLiveChat} className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> Pogovor z zaposlenim
              </button>
            </div>
          )}

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
