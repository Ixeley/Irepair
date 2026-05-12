import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, Loader2, ImageIcon, X } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
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
  { value: "telefoni",  label: "Telefoni" },
  { value: "macbooki",  label: "MacBooki" },
  { value: "ipadi",     label: "iPadi" },
  { value: "ure",       label: "Apple Watch" },
  { value: "drugo",     label: "Drugo" },
];

const CONDITIONS = [
  { value: "nov",         label: "Nov" },
  { value: "odlicno",     label: "Odlično" },
  { value: "dobro",       label: "Dobro" },
  { value: "vidne_sledi", label: "Vidne sledi" },
];

const STOCK_OPTIONS = [
  { value: "na_zalogi",   label: "Na zalogi",   color: "bg-emerald-100 text-emerald-700" },
  { value: "ni_zalogi",   label: "Ni na zalogi", color: "bg-red-100 text-red-700" },
  { value: "po_narocilu", label: "Po naročilu",  color: "bg-amber-100 text-amber-700" },
];

const CONDITION_COLORS: Record<string, string> = {
  nov:         "bg-emerald-100 text-emerald-700",
  odlicno:     "bg-blue-100 text-blue-700",
  dobro:       "bg-amber-100 text-amber-700",
  vidne_sledi: "bg-orange-100 text-orange-700",
};

// Common Apple device colors
const SUGGESTED_COLORS = [
  "Midnight", "Starlight", "Blue", "Green", "Yellow", "Pink", "Purple", "Red",
  "Black", "White", "Silver", "Gold", "Space Gray", "Space Black", "Graphite",
  "Natural Titanium", "Black Titanium", "White Titanium", "Desert Titanium",
  "Deep Purple", "Sierra Blue", "Alpine Green", "Midnight Green",
];

// ---------------------------------------------------------------------------
// API helpers (use Netlify Functions → service role key, bypasses RLS)
// ---------------------------------------------------------------------------

async function apiGet(): Promise<ShopProduct[]> {
  const res = await fetch("/.netlify/functions/admin-product");
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Load failed");
  return res.json();
}

async function apiPost(payload: Record<string, unknown>): Promise<ShopProduct> {
  const res = await fetch("/.netlify/functions/admin-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Save failed");
  return json;
}

async function apiPut(id: string, payload: Record<string, unknown>): Promise<ShopProduct> {
  const res = await fetch(`/.netlify/functions/admin-product?id=${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Update failed");
  return json;
}

async function apiDelete(id: string): Promise<void> {
  const res = await fetch(`/.netlify/functions/admin-product?id=${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Delete failed");
}

// Upload image via signed URL from server (uses service role key — no Storage policy needed)
async function uploadImage(file: File): Promise<string> {
  // 1. Get signed upload URL from server
  const urlRes = await fetch("/.netlify/functions/get-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name }),
  });
  const urlData = await urlRes.json().catch(() => ({}));
  if (!urlRes.ok) throw new Error(urlData.error ?? "Could not get upload URL");

  // 2. Upload directly to Supabase Storage
  const uploadRes = await fetch(urlData.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Image upload failed");

  return urlData.publicUrl as string;
}

// ---------------------------------------------------------------------------
// Image uploader
// ---------------------------------------------------------------------------

function ImageUploader({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const url = await uploadImage(file);
        urls.push(url);
      } catch (e) {
        toast.error(`Upload napaka: ${(e as Error).message}`);
      }
    }
    onChange([...images, ...urls]);
    setUploading(false);
  };

  const remove = (url: string) => onChange(images.filter(u => u !== url));
  const moveFirst = (url: string) => onChange([url, ...images.filter(u => u !== url)]);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Slike <span className="text-muted-foreground font-normal">(prva slika = naslovna)</span></label>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative h-20 w-20 rounded-xl overflow-hidden border border-border group">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {i !== 0 && (
                <button type="button" onClick={() => moveFirst(url)} title="Nastavi kot naslovno"
                  className="rounded-full bg-white/90 px-1.5 py-0.5 text-xs font-medium text-gray-800">1.</button>
              )}
              <button type="button" onClick={() => remove(url)}
                className="rounded-full bg-red-500 p-1 text-white"><X className="h-3 w-3" /></button>
            </div>
            {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-center text-xs py-0.5">Naslovna</span>}
          </div>
        ))}

        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="h-20 w-20 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ImageIcon className="h-5 w-5" /><span className="text-xs">Dodaj</span></>}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color tag input
// ---------------------------------------------------------------------------

function ColorInput({ colors, onChange }: { colors: string[]; onChange: (c: string[]) => void }) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const add = (color: string) => {
    const c = color.trim();
    if (!c || colors.includes(c)) return;
    onChange([...colors, c]);
    setInput("");
    setShowSuggestions(false);
  };

  const remove = (c: string) => onChange(colors.filter(x => x !== c));

  const suggestions = SUGGESTED_COLORS.filter(
    c => !colors.includes(c) && c.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Barve <span className="text-muted-foreground font-normal">(opcijsko — za barvne variante)</span></label>

      {colors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {colors.map(c => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium">
              {c}
              <button type="button" onClick={() => remove(c)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text" placeholder="Dodaj barvo (npr. Midnight) + Enter"
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(input); } }}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-card max-h-44 overflow-y-auto">
            {suggestions.slice(0, 10).map(s => (
              <button key={s} type="button" onMouseDown={() => add(s)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors">{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product form
// ---------------------------------------------------------------------------

const EMPTY_FORM = {
  name: "", description: "", price: "", original_price: "",
  category: "telefoni", condition: "odlicno",
  images: [] as string[], colors: [] as string[],
  stock_status: "na_zalogi", delivery_days: "", available: true,
};

type FormState = typeof EMPTY_FORM;

function ProductForm({ initial, onSave, onCancel }: {
  initial?: Partial<FormState & { id: string }>;
  onSave: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) { toast.error("Ime in cena sta obvezna."); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseInt(form.price),
        original_price: form.original_price ? parseInt(form.original_price) : null,
        category: form.category,
        condition: form.condition,
        images: form.images,
        colors: form.colors,
        stock_status: form.stock_status,
        delivery_days: form.stock_status === "po_narocilu" && form.delivery_days ? parseInt(form.delivery_days) : null,
        available: form.available,
      };
      const id = (initial as { id?: string } | undefined)?.id;
      if (id) await apiPut(id, payload);
      else await apiPost(payload);
      toast.success(id ? "Posodobljeno." : "Izdelek dodan!");
      onSave();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={save} className="bg-card rounded-2xl border border-border p-6 space-y-5">
      {/* Name + description */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ime izdelka *</label>
          <input type="text" required placeholder="npr. iPhone 14 Pro 256GB"
            value={form.name} onChange={e => set("name", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Opis</label>
          <textarea rows={2} placeholder="Kratko stanje, oprema, opombe..."
            value={form.description} onChange={e => set("description", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>
      </div>

      {/* Price */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Cena (€) *</label>
          <input type="number" required min="1" placeholder="399"
            value={form.price} onChange={e => set("price", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Prvotna cena (€) — za prikaz popusta</label>
          <input type="number" min="1" placeholder="549"
            value={form.original_price} onChange={e => set("original_price", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      {/* Category + condition */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Kategorija *</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} type="button" onClick={() => set("category", c.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${form.category === c.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Stanje *</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button key={c.value} type="button" onClick={() => set("condition", c.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${form.condition === c.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stock status */}
      <div>
        <label className="block text-sm font-medium mb-2">Zaloga</label>
        <div className="flex flex-wrap gap-2">
          {STOCK_OPTIONS.map(s => (
            <button key={s.value} type="button" onClick={() => set("stock_status", s.value)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${form.stock_status === s.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}>
              {s.label}
            </button>
          ))}
        </div>
        {form.stock_status === "po_narocilu" && (
          <div className="mt-3">
            <label className="block text-xs text-muted-foreground mb-1">Dobavni rok (dni)</label>
            <input type="number" min="1" max="90" placeholder="npr. 7"
              value={form.delivery_days} onChange={e => set("delivery_days", e.target.value)}
              className="w-32 rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}
      </div>

      {/* Colors */}
      <ColorInput colors={form.colors} onChange={c => set("colors", c)} />

      {/* Images */}
      <ImageUploader images={form.images} onChange={imgs => set("images", imgs)} />

      {/* Visible toggle */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set("available", !form.available)}
          className={`relative w-10 h-6 rounded-full transition-colors ${form.available ? "bg-primary" : "bg-muted"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.available ? "translate-x-[18px]" : "translate-x-0.5"}`} />
        </button>
        <span className="text-sm font-medium">{form.available ? "Vidno v shopu" : "Skrito"}</span>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="rounded-full" disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Shranjujem...</> : "Shrani"}
        </Button>
        {onCancel && <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>Prekliči</Button>}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Product row
// ---------------------------------------------------------------------------

function ProductRow({ product, onRefresh }: { product: ShopProduct; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleAvailable = async () => {
    setLoading(true);
    try { await apiPut(product.id, { available: !product.available }); onRefresh(); }
    catch (e) { toast.error((e as Error).message); }
    setLoading(false);
  };

  const del = async () => {
    if (!confirm(`Izbriši "${product.name}"?`)) return;
    try { await apiDelete(product.id); toast.success("Izbrisano."); onRefresh(); }
    catch (e) { toast.error((e as Error).message); }
  };

  if (editing) return (
    <div className="mb-4">
      <ProductForm
        initial={{
          ...product,
          price: String(product.price),
          original_price: product.original_price ? String(product.original_price) : "",
          delivery_days: product.delivery_days ? String(product.delivery_days) : "",
        }}
        onSave={() => { setEditing(false); onRefresh(); }}
        onCancel={() => setEditing(false)}
      />
    </div>
  );

  const img = product.images[0];
  const stock = STOCK_OPTIONS.find(s => s.value === product.stock_status);

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 transition-opacity ${product.available ? "bg-card border-border" : "bg-muted/30 border-border opacity-60"}`}>
      <div className="h-14 w-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
        {img ? <img src={img} alt={product.name} className="h-full w-full object-cover" />
          : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground/40" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{product.name}</p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <span className="text-primary font-bold text-sm">{product.price}€</span>
          <span className={`text-xs rounded-full px-2 py-0.5 ${CONDITION_COLORS[product.condition] ?? "bg-gray-100 text-gray-600"}`}>
            {CONDITIONS.find(c => c.value === product.condition)?.label}
          </span>
          {stock && <span className={`text-xs rounded-full px-2 py-0.5 ${stock.color}`}>{stock.label}</span>}
          {product.colors.length > 0 && <span className="text-xs text-muted-foreground">{product.colors.join(", ")}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button title={product.available ? "Skrij" : "Objavi"} onClick={toggleAvailable} disabled={loading}
          className="rounded-full p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : product.available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button onClick={() => setEditing(true)}
          className="rounded-full px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          Uredi
        </button>
        <button onClick={del}
          className="rounded-full p-2 hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin page
// ---------------------------------------------------------------------------

function AdminPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setProducts(await apiGet()); }
    catch (e) { toast.error((e as Error).message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const available = products.filter(p => p.available).length;
  const hidden = products.filter(p => !p.available).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass shadow-soft">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl font-bold tracking-tight">i<span className="text-primary">Repair</span></a>
            <span className="text-muted-foreground text-sm">/ Admin</span>
          </div>
          <a href="/shop" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
            Odpri shop →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Skupaj",  value: products.length, color: "text-foreground" },
            { label: "Vidno",   value: available,        color: "text-emerald-600" },
            { label: "Skrito",  value: hidden,           color: "text-muted-foreground" },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-5 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Add product */}
        <div className="mb-8">
          {showForm ? (
            <>
              <h2 className="font-semibold text-lg mb-4">Nov izdelek</h2>
              <ProductForm onSave={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />
            </>
          ) : (
            <Button onClick={() => setShowForm(true)} className="rounded-full gap-2 shadow-glow">
              <Plus className="h-4 w-4" /> Dodaj nov izdelek
            </Button>
          )}
        </div>

        {/* Product list */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Vsi izdelki</h2>
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>Ni še nobenega izdelka.</p>
              <p className="text-sm mt-1">Dodajte prvega s klikom na gumb zgoraj.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map(p => <ProductRow key={p.id} product={p} onRefresh={load} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
