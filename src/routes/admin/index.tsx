import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, Upload, Loader2, ImageIcon, X } from "lucide-react";

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
  available: boolean;
  created_at: string;
}

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

const CONDITION_COLORS: Record<string, string> = {
  nov:         "bg-emerald-100 text-emerald-700",
  odlicno:     "bg-blue-100 text-blue-700",
  dobro:       "bg-amber-100 text-amber-700",
  vidne_sledi: "bg-orange-100 text-orange-700",
};

// ---------------------------------------------------------------------------
// Image uploader
// ---------------------------------------------------------------------------

function ImageUploader({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
      if (error) { toast.error(`Napaka pri uploadu: ${error.message}`); continue; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(data.publicUrl);
    }

    onChange([...images, ...urls]);
    setUploading(false);
  };

  const remove = (url: string) => onChange(images.filter(u => u !== url));

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Slike</label>
      <div className="flex flex-wrap gap-3">
        {images.map(url => (
          <div key={url} className="relative h-20 w-20 rounded-xl overflow-hidden border border-border">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button type="button" onClick={() => remove(url)}
              className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        <button type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-20 w-20 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-5 w-5" /><span className="text-xs">Dodaj</span></>}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => upload(e.target.files)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product form (add / edit)
// ---------------------------------------------------------------------------

const EMPTY_FORM = { name: "", description: "", price: "", original_price: "", category: "telefoni", condition: "odlicno", images: [] as string[], available: true };

function ProductForm({ initial, onSave, onCancel }: {
  initial?: Partial<typeof EMPTY_FORM & { id: string }>;
  onSave: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error("Ime in cena sta obvezna."); return; }
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: parseInt(form.price as string),
      original_price: form.original_price ? parseInt(form.original_price as string) : null,
      category: form.category,
      condition: form.condition,
      images: form.images,
      available: form.available,
    };

    const { error } = (initial as { id?: string })?.id
      ? await supabase.from("shop_products").update(payload).eq("id", (initial as { id: string }).id)
      : await supabase.from("shop_products").insert([payload]);

    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success((initial as { id?: string })?.id ? "Izdelek posodobljen." : "Izdelek dodan!");
    onSave();
  };

  return (
    <form onSubmit={save} className="bg-card rounded-2xl border border-border p-6 space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Ime izdelka *</label>
          <input type="text" required placeholder="npr. iPhone 14 Pro 256GB Space Black"
            value={form.name} onChange={e => set("name", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Opis</label>
          <textarea rows={2} placeholder="Kratko stanje, vključena oprema, opombe..."
            value={form.description} onChange={e => set("description", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Cena (€) *</label>
          <input type="number" required min="1" placeholder="399"
            value={form.price} onChange={e => set("price", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Prvotna cena (€) — za prikaz popusta</label>
          <input type="number" min="1" placeholder="549 (neobvezno)"
            value={form.original_price} onChange={e => set("original_price", e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Kategorija *</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c.value} type="button"
                onClick={() => set("category", c.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${form.category === c.value ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
              >{c.label}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Stanje *</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button key={c.value} type="button"
                onClick={() => set("condition", c.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${form.condition === c.value ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
              >{c.label}</button>
            ))}
          </div>
        </div>
      </div>

      <ImageUploader images={form.images} onChange={imgs => set("images", imgs)} />

      <div className="flex items-center gap-3">
        <button type="button"
          onClick={() => set("available", !form.available)}
          className={`w-10 h-6 rounded-full transition-colors ${form.available ? "bg-primary" : "bg-muted"} relative`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.available ? "translate-x-4.5" : "translate-x-0.5"}`} />
        </button>
        <span className="text-sm">{form.available ? "Vidno v shopu" : "Skrito"}</span>
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
// Product list item
// ---------------------------------------------------------------------------

function ProductRow({ product, onRefresh }: { product: ShopProduct; onRefresh: () => void }) {
  const [editing, setEditing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const toggleAvailable = async () => {
    setToggling(true);
    const { error } = await supabase.from("shop_products").update({ available: !product.available }).eq("id", product.id);
    setToggling(false);
    if (error) { toast.error(error.message); return; }
    onRefresh();
  };

  const deleteProduct = async () => {
    if (!confirm(`Izbriši "${product.name}"?`)) return;
    const { error } = await supabase.from("shop_products").delete().eq("id", product.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Izbrisano.");
    onRefresh();
  };

  if (editing) return (
    <div className="mb-4">
      <ProductForm
        initial={{ ...product, price: String(product.price), original_price: product.original_price ? String(product.original_price) : "" }}
        onSave={() => { setEditing(false); onRefresh(); }}
        onCancel={() => setEditing(false)}
      />
    </div>
  );

  const img = product.images[0];
  const cond = CONDITIONS.find(c => c.value === product.condition)?.label ?? product.condition;

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 transition-opacity ${product.available ? "bg-card border-border" : "bg-muted/30 border-border opacity-60"}`}>
      <div className="h-14 w-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
        {img ? <img src={img} alt={product.name} className="h-full w-full object-cover" />
          : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground/40" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{product.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-primary font-bold text-sm">{product.price}€</span>
          <span className={`text-xs rounded-full px-2 py-0.5 ${CONDITION_COLORS[product.condition] ?? "bg-gray-100 text-gray-600"}`}>{cond}</span>
          <span className="text-xs text-muted-foreground">{CATEGORIES.find(c => c.value === product.category)?.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button title={product.available ? "Skrij" : "Objavi"} onClick={toggleAvailable} disabled={toggling}
          className="rounded-full p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          {toggling ? <Loader2 className="h-4 w-4 animate-spin" /> : product.available ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button title="Uredi" onClick={() => setEditing(true)}
          className="rounded-full p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground text-xs font-medium px-3">
          Uredi
        </button>
        <button title="Izbriši" onClick={deleteProduct}
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
    const { data, error } = await supabase
      .from("shop_products")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setProducts(data as ShopProduct[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const available = products.filter(p => p.available).length;
  const hidden = products.filter(p => !p.available).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass shadow-soft">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <a href="/" className="text-xl font-bold tracking-tight">i<span className="text-primary">Repair</span></a>
            <span className="ml-2 text-sm text-muted-foreground">Admin</span>
          </div>
          <a href="/shop" target="_blank" rel="noopener noreferrer"
            className="text-sm text-primary hover:underline">Odpri shop →</a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Skupaj", value: products.length, color: "text-foreground" },
            { label: "Vidno",  value: available,        color: "text-emerald-600" },
            { label: "Skrito", value: hidden,           color: "text-muted-foreground" },
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
