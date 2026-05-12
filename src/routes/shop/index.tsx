import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { initVisitorTracking, updateVisitorState } from "@/lib/visitor-presence";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ShoppingBag, ArrowLeft, Loader2, Tag, X, MapPin, Clock, Shield, Phone, MapPinned, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/shop/")({
  component: ShopPage,
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ShopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  category: string;
  condition: string;
  images: string[];
  colors: string[];
  stock_status: "na_zalogi" | "ni_zalogi" | "po_narocilu";
  delivery_days?: number;
  available: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: "vse",      label: "Vse" },
  { value: "telefoni", label: "Telefoni" },
  { value: "macbooki", label: "MacBooki" },
  { value: "ipadi",    label: "iPadi" },
  { value: "ure",      label: "Apple Watch" },
  { value: "drugo",    label: "Drugo" },
];

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  nov:         { label: "Nov",         color: "bg-emerald-100 text-emerald-700" },
  odlicno:     { label: "Odlično",     color: "bg-blue-100 text-blue-700" },
  dobro:       { label: "Dobro",       color: "bg-amber-100 text-amber-700" },
  vidne_sledi: { label: "Vidne sledi", color: "bg-orange-100 text-orange-700" },
};

const STOCK_LABELS: Record<string, { label: string; color: string }> = {
  na_zalogi:   { label: "Na zalogi",   color: "bg-emerald-100 text-emerald-700" },
  ni_zalogi:   { label: "Ni na zalogi", color: "bg-red-100 text-red-700" },
  po_narocilu: { label: "Po naročilu", color: "bg-amber-100 text-amber-700" },
};

const DEVICE_TYPES = ["iPhone", "iPad", "MacBook", "iMac", "Apple Watch", "AirPods", "Drugo"];
const SELL_CONDITIONS = [
  { value: "odlicno",     label: "Odlično — brez vidnih poškodb" },
  { value: "dobro",       label: "Dobro — manjše sledi uporabe" },
  { value: "vidne_sledi", label: "Vidne sledi — poškodbe zaslona/ohišja" },
  { value: "ne_dela",     label: "Ne deluje / pokvarjena" },
];

// ---------------------------------------------------------------------------
// Product card
// ---------------------------------------------------------------------------

function ProductCard({ product, onInquiry, onHover }: {
  product: ShopProduct;
  onInquiry: (p: ShopProduct, color: string) => void;
  onHover?: (name: string | null) => void;
}) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0] ?? "");
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const img = product.images[0];
  const cond = CONDITION_LABELS[product.condition] ?? { label: product.condition, color: "bg-gray-100 text-gray-700" };
  const stock = STOCK_LABELS[product.stock_status ?? "na_zalogi"] ?? STOCK_LABELS.na_zalogi;
  const isUnavailable = product.stock_status === "ni_zalogi";

  const handleMouseEnter = () => {
    hoverTimer.current = setTimeout(() => onHover?.(product.name), 1500);
  };
  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };

  return (
    <div
      className={`bg-card rounded-2xl shadow-soft overflow-hidden flex flex-col hover:shadow-card transition-shadow ${isUnavailable ? "opacity-60" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image */}
      <div className="aspect-square bg-secondary/40 overflow-hidden relative">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {/* Stock badge on image */}
        <span className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${stock.color}`}>
          {stock.label}
          {product.stock_status === "po_narocilu" && product.delivery_days
            ? ` · ${product.delivery_days} dni`
            : ""}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Condition + name */}
        <div>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cond.color}`}>{cond.label}</span>
          <h3 className="mt-2 font-semibold text-sm leading-snug">{product.name}</h3>
          {product.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
        </div>

        {/* Color picker */}
        {product.colors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {product.colors.map(c => (
              <button key={c} type="button" onClick={() => setSelectedColor(c)}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${selectedColor === c ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Price + button */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <span className="text-xl font-bold text-primary">{product.price}€</span>
            {product.original_price && (
              <span className="ml-2 text-sm text-muted-foreground line-through">{product.original_price}€</span>
            )}
          </div>
          <Button size="sm" className="rounded-full text-xs px-4" disabled={isUnavailable}
            onClick={() => onInquiry(product, selectedColor)}>
            {isUnavailable ? "Ni na zalogi" : "Povpraševanje"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Purchase inquiry modal
// ---------------------------------------------------------------------------

function PurchaseModal({ product, selectedColor, onClose }: {
  product: ShopProduct;
  selectedColor: string;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const productLabel = selectedColor ? `${product.name} (${selectedColor})` : product.name;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/send-purchase-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productLabel,
          productId: product.id,
          price: product.price,
          ...form,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json.error ?? "Napaka"); return; }
      setDone(true);
    } catch { toast.error("Napaka. Pokličite 059 023 951."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-card rounded-3xl shadow-card w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Povpraševanje za nakup</h2>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-secondary"><X className="h-5 w-5" /></button>
          </div>

          {done ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Povpraševanje poslano!</h3>
              <p className="text-sm text-muted-foreground mb-2">Odgovorili vam bomo v 2 urah.</p>
              <p className="text-sm text-muted-foreground">Prevzem: <strong>Koprska 94, Ljubljana</strong></p>
              <Button className="mt-6 rounded-full" onClick={onClose}>Zapri</Button>
            </div>
          ) : (
            <>
              {/* Product summary */}
              <div className="rounded-2xl bg-secondary/50 p-4 mb-5 flex gap-3">
                {product.images[0] && (
                  <img src={product.images[0]} alt={product.name} className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />
                )}
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  {selectedColor && (
                    <p className="text-xs text-muted-foreground mt-0.5">Barva: <strong>{selectedColor}</strong></p>
                  )}
                  {product.stock_status === "po_narocilu" && product.delivery_days && (
                    <p className="text-xs text-amber-600 mt-0.5">Dobavni rok: {product.delivery_days} dni</p>
                  )}
                  <p className="text-xl font-bold text-primary mt-1">{product.price}€</p>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-3">
                {[
                  { name: "name",  label: "Ime in priimek",    type: "text",  placeholder: "Jan Novak" },
                  { name: "phone", label: "Telefonska številka", type: "tel",   placeholder: "041 123 456" },
                  { name: "email", label: "E-mail",             type: "email", placeholder: "jan@email.com" },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">{f.label}</label>
                    <input type={f.type} required placeholder={f.placeholder}
                      value={(form as Record<string, string>)[f.name]}
                      onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Sporočilo (neobvezno)</label>
                  <textarea rows={2} placeholder="Vprašanje o stanju naprave..."
                    value={form.message}
                    onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
                </div>
                <Button type="submit" className="w-full rounded-full shadow-glow" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Pošiljam...</> : "Pošlji povpraševanje"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">Prevzem osebno · Koprska 94, Ljubljana</p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sell form
// ---------------------------------------------------------------------------

function SellSection() {
  const [form, setForm] = useState({ deviceType: "", model: "", condition: "", askingPrice: "", description: "", name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.deviceType || !form.condition) { toast.error("Izberite tip naprave in stanje."); return; }
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/send-sell-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json.error ?? "Napaka"); return; }
      setDone(true);
    } catch { toast.error("Napaka. Pokličite 059 023 951."); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="text-center py-16">
      <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
      <h3 className="text-2xl font-bold mb-2">Povpraševanje poslano!</h3>
      <p className="text-muted-foreground mb-1">Ocenili bomo vašo napravo in vam odgovorili v 2 urah.</p>
      <p className="text-muted-foreground flex items-center justify-center gap-4 mt-2">
        <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> 059 023 951</span>
        <span className="flex items-center gap-1"><MapPinned className="h-4 w-4" /> Koprska 94, Ljubljana</span>
      </p>
      <Button className="mt-6 rounded-full" onClick={() => setDone(false)}>Novo povpraševanje</Button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={submit} className="bg-card rounded-3xl shadow-card p-6 sm:p-8 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Tip naprave *</label>
          <div className="flex flex-wrap gap-2">
            {DEVICE_TYPES.map(d => (
              <button key={d} type="button" onClick={() => set("deviceType", d)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${form.deviceType === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          <input type="text" placeholder="npr. iPhone 14 Pro (neobvezno)" value={form.model} onChange={e => set("model", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Stanje naprave *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SELL_CONDITIONS.map(c => (
              <button key={c.value} type="button" onClick={() => set("condition", c.value)}
                className={`rounded-xl border px-4 py-3 text-sm text-left transition-colors ${form.condition === c.value ? "bg-primary/10 border-primary text-primary font-medium" : "border-border hover:border-primary/50"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vaša cena (€)</label>
            <input type="number" min="0" placeholder="Neobvezno" value={form.askingPrice} onChange={e => set("askingPrice", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Opis / opombe</label>
            <input type="text" placeholder="Npr. nov zaslon, brez zaslona..." value={form.description} onChange={e => set("description", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <hr className="border-border" />

        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { k: "name",  label: "Ime in priimek *", type: "text",  ph: "Jan Novak" },
            { k: "phone", label: "Telefon *",         type: "tel",   ph: "041 123 456" },
            { k: "email", label: "E-mail *",          type: "email", ph: "jan@email.com" },
          ].map(f => (
            <div key={f.k}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input type={f.type} required placeholder={f.ph}
                value={(form as Record<string, string>)[f.k]}
                onChange={e => set(f.k, e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          ))}
        </div>

        <Button type="submit" size="lg" className="w-full rounded-full shadow-glow" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Pošiljam...</> : "Pošlji povpraševanje za odkup"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">Odgovorimo v 2 urah · Oddaja osebno v poslovalnici</p>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main shop page
// ---------------------------------------------------------------------------

function ShopPage() {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("vse");
  const [inquiry, setInquiry] = useState<{ product: ShopProduct; color: string } | null>(null);

  useEffect(() => {
    return initVisitorTracking("shop");
  }, []);

  useEffect(() => {
    updateVisitorState({
      activity: "shop",
      shopTab: tab,
      shopCategory: tab === "buy" ? category : undefined,
      shopProduct: undefined,
      shopInquiry: undefined,
    });
  }, [tab, category]);

  const handleInquiry = (product: ShopProduct, color: string) => {
    setInquiry({ product, color });
    updateVisitorState({ shopInquiry: color ? `${product.name} (${color})` : product.name });
  };

  const handleInquiryClose = () => {
    setInquiry(null);
    updateVisitorState({ shopInquiry: undefined });
  };

  const handleProductHover = (name: string | null) => {
    if (name) updateVisitorState({ shopProduct: name });
  };

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const { data, error } = await supabase
          .from("shop_products")
          .select("*")
          .eq("available", true)
          .order("created_at", { ascending: false });
        if (error) console.error("[Shop]", error.message);
        if (data) setProducts(data as ShopProduct[]);
      } catch (e) {
        console.error("[Shop] unexpected:", e);
      }
      setLoading(false);
    };
    fetch_();
  }, []);

  const filtered = category === "vse" ? products : products.filter(p => p.category === category);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass shadow-soft">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            <span className="text-xl font-bold tracking-tight">i<span className="text-primary">Repair</span></span>
          </a>
          <div className="flex items-center gap-2 text-foreground">
            <Tag className="h-5 w-5 text-primary" />
            <span className="font-semibold">Izdelki</span>
          </div>
          <a href="tel:059023951" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">059 023 951</a>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero py-16 px-4 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-primary to-[oklch(0.5_0.2_250)] bg-clip-text text-transparent">
            Izdelki
          </span>
        </h1>
        <p className="text-xl font-semibold text-foreground mb-3">Odkup &amp; Prodaja Apple naprav</p>
        <p className="text-muted-foreground text-base max-w-xl mx-auto mb-8">
          Rabljene Apple naprave po dostopnih cenah. Prevzem osebno.<br />
          Prodajte nam vašo napravo — odkupimo vse modele.
        </p>

        <div className="inline-flex rounded-full bg-card shadow-soft p-1.5 gap-1">
          {[
            { v: "buy",  label: "Kupite napravo" },
            { v: "sell", label: "Prodajte nam" },
          ].map(t => (
            <button key={t.v} onClick={() => setTab(t.v as "buy" | "sell")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${tab === t.v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12">

        {/* ── BUY ── */}
        {tab === "buy" && (
          <>
            <div className="flex flex-wrap gap-2 mb-8">
              {CATEGORIES.map(c => (
                <button key={c.value} onClick={() => setCategory(c.value)}
                  className={`rounded-full border px-5 py-2 text-sm font-medium transition-colors ${category === c.value ? "bg-primary text-primary-foreground border-primary shadow-glow" : "border-border hover:border-primary/60"}`}>
                  {c.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">Ni razpoložljivih izdelkov</h3>
                <p className="text-sm text-muted-foreground">Pokličite nas: 059 023 951</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(p => (
                  <ProductCard key={p.id} product={p}
                    onInquiry={handleInquiry}
                    onHover={handleProductHover} />
                ))}
              </div>
            )}

            <div className="mt-12 rounded-2xl bg-card border border-border p-6">
              <div className="grid sm:grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
                {[
                  { icon: <MapPin className="h-6 w-6 text-primary mx-auto" />,  title: "Prevzem osebno",  desc: "Koprska 94, Ljubljana" },
                  { icon: <Clock className="h-6 w-6 text-primary mx-auto" />,   title: "Delovni čas",     desc: "Tor–Pet: 8:30–17:00" },
                  { icon: <Shield className="h-6 w-6 text-primary mx-auto" />,  title: "Garancija",       desc: "3 mesece na vse naprave" },
                ].map(b => (
                  <div key={b.title}>
                    <div className="mb-2">{b.icon}</div>
                    <div className="font-medium text-foreground">{b.title}</div>
                    <div>{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── SELL ── */}
        {tab === "sell" && (
          <>
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2">Prodajte nam vašo napravo</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Odkupujemo iPhone, iPad, MacBook in ostale Apple naprave — v vsakem stanju.
                Izpolnite obrazec, ocenili bomo in vam odgovorili v 2 urah.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm">
                {["Vse modele", "Vsako stanje", "Hitra ocena", "Gotovina / bančni nakazilo"].map(f => (
                  <span key={f} className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />{f}
                  </span>
                ))}
              </div>
            </div>
            <SellSection />
          </>
        )}
      </main>

      {inquiry && (
        <PurchaseModal
          product={inquiry.product}
          selectedColor={inquiry.color}
          onClose={handleInquiryClose}
        />
      )}

      <footer className="border-t mt-16 py-8 text-center text-sm text-muted-foreground">
        iRepair · Koprska 94, 1000 Ljubljana · <a href="tel:059023951" className="text-primary">059 023 951</a>
      </footer>
    </div>
  );
}
