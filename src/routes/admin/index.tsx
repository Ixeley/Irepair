import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Trash2, Eye, EyeOff, Loader2, ImageIcon, X, Check, AlertTriangle, Users } from "lucide-react";
import type { VisitorState } from "@/lib/visitor-presence";
import { VISITOR_CHANNEL, markAsAdmin } from "@/lib/visitor-presence";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

// ---------------------------------------------------------------------------
// Device database — name → category, colors, storage options
// ---------------------------------------------------------------------------

type Category = "telefoni" | "macbooki" | "ipadi" | "ure" | "drugo";

interface DeviceEntry {
  category: Category;
  colors: string[];
  storage: string[];
}

const DEVICE_DB: Record<string, DeviceEntry> = {
  // iPhone 16
  "iPhone 16 Pro Max": { category: "telefoni", colors: ["Black Titanium","White Titanium","Natural Titanium","Desert Titanium"], storage: ["256GB","512GB","1TB"] },
  "iPhone 16 Pro":     { category: "telefoni", colors: ["Black Titanium","White Titanium","Natural Titanium","Desert Titanium"], storage: ["128GB","256GB","512GB","1TB"] },
  "iPhone 16 Plus":    { category: "telefoni", colors: ["Black","White","Pink","Teal","Ultramarine"], storage: ["128GB","256GB","512GB"] },
  "iPhone 16":         { category: "telefoni", colors: ["Black","White","Pink","Teal","Ultramarine"], storage: ["128GB","256GB","512GB"] },
  // iPhone 15
  "iPhone 15 Pro Max": { category: "telefoni", colors: ["Black Titanium","White Titanium","Natural Titanium","Blue Titanium"], storage: ["256GB","512GB","1TB"] },
  "iPhone 15 Pro":     { category: "telefoni", colors: ["Black Titanium","White Titanium","Natural Titanium","Blue Titanium"], storage: ["128GB","256GB","512GB","1TB"] },
  "iPhone 15 Plus":    { category: "telefoni", colors: ["Black","Blue","Green","Yellow","Pink"], storage: ["128GB","256GB","512GB"] },
  "iPhone 15":         { category: "telefoni", colors: ["Black","Blue","Green","Yellow","Pink"], storage: ["128GB","256GB","512GB"] },
  // iPhone 14
  "iPhone 14 Pro Max": { category: "telefoni", colors: ["Space Black","Silver","Gold","Deep Purple"], storage: ["128GB","256GB","512GB","1TB"] },
  "iPhone 14 Pro":     { category: "telefoni", colors: ["Space Black","Silver","Gold","Deep Purple"], storage: ["128GB","256GB","512GB","1TB"] },
  "iPhone 14 Plus":    { category: "telefoni", colors: ["Midnight","Starlight","Blue","Purple","Product Red","Yellow"], storage: ["128GB","256GB","512GB"] },
  "iPhone 14":         { category: "telefoni", colors: ["Midnight","Starlight","Blue","Purple","Product Red","Yellow"], storage: ["128GB","256GB","512GB"] },
  // iPhone 13
  "iPhone 13 Pro Max": { category: "telefoni", colors: ["Alpine Green","Sierra Blue","Graphite","Gold","Silver"], storage: ["128GB","256GB","512GB","1TB"] },
  "iPhone 13 Pro":     { category: "telefoni", colors: ["Alpine Green","Sierra Blue","Graphite","Gold","Silver"], storage: ["128GB","256GB","512GB","1TB"] },
  "iPhone 13":         { category: "telefoni", colors: ["Midnight","Starlight","Blue","Green","Pink","Product Red"], storage: ["128GB","256GB","512GB"] },
  "iPhone 13 mini":    { category: "telefoni", colors: ["Midnight","Starlight","Blue","Green","Pink","Product Red"], storage: ["128GB","256GB","512GB"] },
  // iPhone 12
  "iPhone 12 Pro Max": { category: "telefoni", colors: ["Pacific Blue","Gold","Silver","Graphite"], storage: ["128GB","256GB","512GB"] },
  "iPhone 12 Pro":     { category: "telefoni", colors: ["Pacific Blue","Gold","Silver","Graphite"], storage: ["128GB","256GB","512GB"] },
  "iPhone 12":         { category: "telefoni", colors: ["Black","White","Blue","Green","Product Red","Purple"], storage: ["64GB","128GB","256GB"] },
  "iPhone 12 mini":    { category: "telefoni", colors: ["Black","White","Blue","Green","Product Red","Purple"], storage: ["64GB","128GB","256GB"] },
  // iPhone SE
  "iPhone SE (3. gen)": { category: "telefoni", colors: ["Midnight","Starlight","Product Red"], storage: ["64GB","128GB","256GB"] },
  "iPhone SE (2. gen)": { category: "telefoni", colors: ["Black","White","Product Red"], storage: ["64GB","128GB","256GB"] },
  // iPad Pro
  "iPad Pro 13\" M4":  { category: "ipadi", colors: ["Silver","Space Black"], storage: ["256GB","512GB","1TB","2TB"] },
  "iPad Pro 11\" M4":  { category: "ipadi", colors: ["Silver","Space Black"], storage: ["256GB","512GB","1TB","2TB"] },
  "iPad Pro 12.9\" M2": { category: "ipadi", colors: ["Silver","Space Gray"], storage: ["128GB","256GB","512GB","1TB","2TB"] },
  "iPad Pro 11\" M2":  { category: "ipadi", colors: ["Silver","Space Gray"], storage: ["128GB","256GB","512GB","1TB","2TB"] },
  // iPad Air
  "iPad Air 13\" M2":  { category: "ipadi", colors: ["Blue","Purple","Starlight","Space Gray"], storage: ["128GB","256GB","512GB","1TB"] },
  "iPad Air 11\" M2":  { category: "ipadi", colors: ["Blue","Purple","Starlight","Space Gray"], storage: ["128GB","256GB","512GB","1TB"] },
  // iPad mini
  "iPad mini 7":       { category: "ipadi", colors: ["Blue","Purple","Starlight","Space Gray"], storage: ["128GB","256GB","512GB"] },
  "iPad mini 6":       { category: "ipadi", colors: ["Blue","Purple","Starlight","Space Gray"], storage: ["64GB","256GB"] },
  // iPad
  "iPad (10. gen)":    { category: "ipadi", colors: ["Blue","Pink","Silver","Yellow"], storage: ["64GB","256GB"] },
  "iPad (9. gen)":     { category: "ipadi", colors: ["Silver","Space Gray"], storage: ["64GB","256GB"] },
  // MacBook Air
  "MacBook Air 15\" M3": { category: "macbooki", colors: ["Midnight","Starlight","Space Gray","Silver","Sky Blue"], storage: ["256GB","512GB","1TB","2TB"] },
  "MacBook Air 13\" M3": { category: "macbooki", colors: ["Midnight","Starlight","Space Gray","Silver","Sky Blue"], storage: ["256GB","512GB","1TB","2TB"] },
  "MacBook Air 15\" M2": { category: "macbooki", colors: ["Midnight","Starlight","Space Gray","Silver"], storage: ["256GB","512GB","1TB"] },
  "MacBook Air 13\" M2": { category: "macbooki", colors: ["Midnight","Starlight","Space Gray","Silver"], storage: ["256GB","512GB","1TB"] },
  "MacBook Air 13\" M1": { category: "macbooki", colors: ["Space Gray","Silver","Gold"], storage: ["256GB","512GB","1TB"] },
  // MacBook Pro
  "MacBook Pro 16\" M4 Pro": { category: "macbooki", colors: ["Space Black","Silver"], storage: ["512GB","1TB","2TB","4TB"] },
  "MacBook Pro 16\" M4 Max": { category: "macbooki", colors: ["Space Black","Silver"], storage: ["1TB","2TB","4TB"] },
  "MacBook Pro 14\" M4 Pro": { category: "macbooki", colors: ["Space Black","Silver"], storage: ["512GB","1TB","2TB","4TB"] },
  "MacBook Pro 14\" M4":     { category: "macbooki", colors: ["Space Black","Silver"], storage: ["512GB","1TB","2TB"] },
  "MacBook Pro 16\" M3 Pro": { category: "macbooki", colors: ["Space Black","Silver"], storage: ["512GB","1TB","2TB","4TB"] },
  "MacBook Pro 14\" M3 Pro": { category: "macbooki", colors: ["Space Black","Silver"], storage: ["512GB","1TB","2TB","4TB"] },
  "MacBook Pro 13\" M2":     { category: "macbooki", colors: ["Space Gray","Silver"], storage: ["256GB","512GB","1TB","2TB"] },
  // Apple Watch
  "Apple Watch Ultra 2":     { category: "ure", colors: ["Natural Titanium","Black Titanium"], storage: [] },
  "Apple Watch Series 10":   { category: "ure", colors: ["Jet Black","Rose Gold","Silver","Gold"], storage: [] },
  "Apple Watch Series 9":    { category: "ure", colors: ["Midnight","Starlight","Pink","Product Red","Silver","Gold"], storage: [] },
  "Apple Watch Series 8":    { category: "ure", colors: ["Midnight","Starlight","Product Red","Silver"], storage: [] },
  "Apple Watch SE (2. gen)": { category: "ure", colors: ["Midnight","Starlight","Silver"], storage: [] },
  // AirPods
  "AirPods 4":               { category: "drugo", colors: ["White"], storage: [] },
  "AirPods Pro (2. gen)":    { category: "drugo", colors: ["White"], storage: [] },
  "AirPods Max":             { category: "drugo", colors: ["Midnight","Starlight","Blue","Orange","Purple"], storage: [] },
};

// ---------------------------------------------------------------------------
// Color hex map
// ---------------------------------------------------------------------------

const COLOR_HEX: Record<string, string> = {
  "Midnight":          "#1C1C1E",
  "Starlight":         "#F2EDE3",
  "Silver":            "#E3E4E2",
  "Gold":              "#F5D98C",
  "Space Gray":        "#636366",
  "Space Black":       "#2C2C2E",
  "Graphite":          "#535150",
  "Black":             "#1C1C1E",
  "White":             "#F5F5F0",
  "Black Titanium":    "#353535",
  "White Titanium":    "#E5E0D8",
  "Natural Titanium":  "#C8B89A",
  "Desert Titanium":   "#C4A882",
  "Blue Titanium":     "#4A6680",
  "Pink":              "#F2A7B0",
  "Yellow":            "#F5E27D",
  "Green":             "#CAD9C8",
  "Blue":              "#A5C8E4",
  "Teal":              "#4A9A8E",
  "Ultramarine":       "#4861A3",
  "Purple":            "#C8B8D8",
  "Product Red":       "#BE0000",
  "Deep Purple":       "#59546C",
  "Alpine Green":      "#4B5945",
  "Sierra Blue":       "#A8C2D0",
  "Midnight Green":    "#4A5240",
  "Pacific Blue":      "#3D6E8A",
  "Coral":             "#FF6E5A",
  "Sky Blue":          "#A8C8E0",
  "Rose Gold":         "#E8BFAF",
  "Jet Black":         "#1A1A1A",
  "Orange":            "#E8804A",
};

// Is a color too light to show a white checkmark?
function needsDarkCheck(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

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
  storage: string[];
  stock_status: "na_zalogi" | "ni_zalogi" | "po_narocilu";
  delivery_days?: number;
  available: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "telefoni", label: "Telefoni" },
  { value: "macbooki", label: "MacBooki" },
  { value: "ipadi",    label: "iPadi" },
  { value: "ure",      label: "Apple Watch" },
  { value: "drugo",    label: "Drugo" },
];

const CONDITIONS = [
  { value: "nov",         label: "Nov" },
  { value: "odlicno",     label: "Odlično" },
  { value: "dobro",       label: "Dobro" },
  { value: "vidne_sledi", label: "Vidne sledi" },
];

const STOCK_OPTIONS = [
  { value: "na_zalogi",   label: "Na zalogi",    color: "bg-emerald-100 text-emerald-700" },
  { value: "ni_zalogi",   label: "Ni na zalogi", color: "bg-red-100 text-red-700" },
  { value: "po_narocilu", label: "Po naročilu",  color: "bg-amber-100 text-amber-700" },
];

const CONDITION_COLORS: Record<string, string> = {
  nov:         "bg-emerald-100 text-emerald-700",
  odlicno:     "bg-blue-100 text-blue-700",
  dobro:       "bg-amber-100 text-amber-700",
  vidne_sledi: "bg-orange-100 text-orange-700",
};

// ---------------------------------------------------------------------------
// API helpers — direct Supabase client (anon key + RLS disabled via setup-all.sql)
// ---------------------------------------------------------------------------

async function apiGet(): Promise<ShopProduct[]> {
  const { data, error } = await supabase.from("shop_products").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ShopProduct[];
}

async function apiPost(payload: Record<string, unknown>): Promise<ShopProduct> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from("shop_products").insert(payload as any).select().single();
  if (error) throw new Error(error.message);
  return data as ShopProduct;
}

async function apiPut(id: string, payload: Record<string, unknown>): Promise<ShopProduct> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from("shop_products").update(payload as any).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data as ShopProduct;
}

async function apiDelete(id: string): Promise<void> {
  const { error } = await supabase.from("shop_products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
  if (error) throw new Error(`Upload napaka: ${error.message}`);
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
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
        urls.push(await uploadImage(file));
      } catch (e) {
        toast.error(`Napaka pri uploadu: ${(e as Error).message}`);
      }
    }
    if (urls.length) onChange([...images, ...urls]);
    setUploading(false);
  };

  const remove = (url: string) => onChange(images.filter(u => u !== url));
  const moveFirst = (url: string) => onChange([url, ...images.filter(u => u !== url)]);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Slike <span className="text-muted-foreground font-normal text-xs">(prva = naslovna)</span>
      </label>
      <div className="flex flex-wrap gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative h-20 w-20 rounded-xl overflow-hidden border border-border group">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {i !== 0 && (
                <button type="button" onClick={() => moveFirst(url)} title="Nastavi kot naslovno"
                  className="rounded bg-white/90 px-1.5 py-0.5 text-xs font-bold text-gray-800">1.</button>
              )}
              <button type="button" onClick={() => remove(url)}
                className="rounded-full bg-red-500 p-1 text-white"><X className="h-3 w-3" /></button>
            </div>
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-center text-[10px] py-0.5">
                Naslovna
              </span>
            )}
          </div>
        ))}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="h-20 w-20 rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50">
          {uploading
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : <><ImageIcon className="h-5 w-5" /><span className="text-xs">Dodaj</span></>
          }
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { handleFiles(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Device name autocomplete
// ---------------------------------------------------------------------------

function DeviceNameInput({
  value, onChange, onDeviceSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  onDeviceSelect: (entry: DeviceEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const deviceNames = Object.keys(DEVICE_DB);
  const suggestions = value.length >= 2
    ? deviceNames.filter(n => n.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  const select = (name: string) => {
    onChange(name);
    onDeviceSelect(DEVICE_DB[name]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">Ime naprave *</label>
      <input
        type="text" required
        placeholder="Začni tipkati npr. iPhone 16 Pro..."
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-card max-h-52 overflow-y-auto">
          {suggestions.map(name => (
            <button key={name} type="button" onMouseDown={() => select(name)}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors flex items-center justify-between">
              <span>{name}</span>
              <span className="text-xs text-muted-foreground ml-2">
                {CATEGORIES.find(c => c.value === DEVICE_DB[name].category)?.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Color circles picker
// ---------------------------------------------------------------------------

function ColorPicker({
  suggested, selected, onChange,
}: {
  suggested: string[];
  selected: string[];
  onChange: (c: string[]) => void;
}) {
  const toggle = (c: string) =>
    onChange(selected.includes(c) ? selected.filter(x => x !== c) : [...selected, c]);

  if (suggested.length === 0) return null;

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Barve <span className="text-xs text-muted-foreground font-normal">(izberi katere imaš na zalogi)</span>
      </label>
      <div className="flex flex-wrap gap-3">
        {suggested.map(color => {
          const hex = COLOR_HEX[color] ?? "#888";
          const isSelected = selected.includes(color);
          const darkCheck = needsDarkCheck(hex);
          return (
            <button
              key={color} type="button" onClick={() => toggle(color)}
              title={color}
              className="relative group flex flex-col items-center gap-1"
            >
              <span
                className={`block h-9 w-9 rounded-full transition-all ${isSelected ? "ring-[3px] ring-primary ring-offset-2" : "ring-1 ring-black/10 hover:ring-2 hover:ring-primary/50"}`}
                style={{ backgroundColor: hex }}
              >
                {isSelected && (
                  <Check
                    className={`h-4 w-4 absolute inset-0 m-auto ${darkCheck ? "text-gray-800" : "text-white"}`}
                    style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
                  />
                )}
              </span>
              <span className="text-[10px] text-muted-foreground max-w-[52px] text-center leading-tight group-hover:text-foreground transition-colors">
                {color}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Storage pills picker
// ---------------------------------------------------------------------------

function StoragePicker({ options, selected, onChange }: { options: string[]; selected: string[]; onChange: (s: string[]) => void }) {
  if (options.length === 0) return null;
  const toggle = (s: string) =>
    onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s]);

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Kapaciteta <span className="text-xs text-muted-foreground font-normal">(izberi katere variante imaš)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map(s => (
          <button key={s} type="button" onClick={() => toggle(s)}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${selected.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/60"}`}>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${value ? "translate-x-6" : "translate-x-1"}`} />
      </button>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product form
// ---------------------------------------------------------------------------

const EMPTY_FORM = {
  name: "", description: "", price: "", original_price: "",
  category: "telefoni" as Category, condition: "odlicno",
  images: [] as string[], colors: [] as string[], storage: [] as string[],
  stock_status: "na_zalogi", delivery_days: "", available: true,
  _suggestedColors: [] as string[],
  _suggestedStorage: [] as string[],
};

type FormState = typeof EMPTY_FORM;

function ProductForm({ initial, onSave, onCancel }: {
  initial?: Partial<FormState & { id: string }>;
  onSave: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const set = (k: string, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const handleDeviceSelect = (entry: DeviceEntry) => {
    setForm(p => ({
      ...p,
      category: entry.category,
      _suggestedColors: entry.colors,
      _suggestedStorage: entry.storage,
      colors: [],
      storage: [],
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceInt = parseInt(form.price);
    if (!form.name.trim()) { setSaveError("Vnesite ime naprave."); return; }
    if (isNaN(priceInt) || priceInt < 1) { setSaveError("Vnesite veljavno ceno."); return; }
    setSaving(true);
    setSaveError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: priceInt,
        original_price: form.original_price ? parseInt(form.original_price) : null,
        category: form.category,
        condition: form.condition,
        images: form.images,
        colors: form.colors,
        storage: form.storage,
        stock_status: form.stock_status,
        delivery_days: form.stock_status === "po_narocilu" && form.delivery_days
          ? parseInt(form.delivery_days) : null,
        available: form.available,
      };
      const id = (initial as { id?: string } | undefined)?.id;
      if (id) await apiPut(id, payload);
      else await apiPost(payload);
      toast.success(id ? "Posodobljeno." : "Izdelek dodan!");
      onSave();
    } catch (err) {
      const msg = (err as Error).message;
      setSaveError(msg);
      toast.error(msg);
    }
    setSaving(false);
  };

  return (
    <form onSubmit={save} className="bg-card rounded-2xl border border-border p-6 space-y-6">
      {/* Name autocomplete */}
      <DeviceNameInput
        value={form.name}
        onChange={v => set("name", v)}
        onDeviceSelect={handleDeviceSelect}
      />

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">Opis</label>
        <textarea rows={2} placeholder="Kratko stanje, oprema, opombe..."
          value={form.description} onChange={e => set("description", e.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none" />
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
          <label className="block text-sm font-medium mb-1">Prvotna cena (€) — popust</label>
          <input type="number" min="1" placeholder="549 (neobvezno)"
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
          {form._suggestedColors.length > 0 && (
            <p className="mt-2 text-xs text-emerald-600">Kategorija zaznana samodejno</p>
          )}
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
          <div className="mt-3 flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Dobavni rok:</label>
            <input type="number" min="1" max="90" placeholder="7"
              value={form.delivery_days} onChange={e => set("delivery_days", e.target.value)}
              className="w-24 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            <span className="text-xs text-muted-foreground">dni</span>
          </div>
        )}
      </div>

      {/* Color circles */}
      <ColorPicker
        suggested={form._suggestedColors}
        selected={form.colors}
        onChange={c => set("colors", c)}
      />

      {/* Storage pills */}
      <StoragePicker
        options={form._suggestedStorage}
        selected={form.storage}
        onChange={s => set("storage", s)}
      />

      {/* Images */}
      <ImageUploader images={form.images} onChange={imgs => set("images", imgs)} />

      {/* Visible toggle */}
      <Toggle value={form.available} onChange={v => set("available", v)}
        label={form.available ? "Vidno v shopu" : "Skrito"} />

      {saveError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">Napaka pri shranjevanju</p>
            <p className="font-mono text-xs mt-0.5">{saveError}</p>
            {(saveError.includes("fetch") || saveError.includes("Failed")) && (
              <p className="mt-1 text-xs">Preverite <code className="bg-red-100 rounded px-0.5">VITE_SUPABASE_URL</code> in <code className="bg-red-100 rounded px-0.5">VITE_SUPABASE_PUBLISHABLE_KEY</code> v Netlify env vars.</p>
            )}
            {(saveError.includes("permission") || saveError.includes("denied") || saveError.includes("policy") || saveError.includes("RLS")) && (
              <p className="mt-1 text-xs">Zaženite <code className="bg-red-100 rounded px-0.5">supabase/setup-all.sql</code> v Supabase SQL Editorju.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t border-border">
        <Button type="submit" className="rounded-full" disabled={saving}>
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Shranjujem...</> : "Shrani izdelek"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>Prekliči</Button>
        )}
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
          name: product.name,
          description: product.description,
          price: String(product.price),
          original_price: product.original_price ? String(product.original_price) : "",
          category: product.category as Category,
          condition: product.condition,
          images: product.images,
          colors: product.colors,
          storage: product.storage ?? [],
          stock_status: product.stock_status,
          delivery_days: product.delivery_days ? String(product.delivery_days) : "",
          available: product.available,
          _suggestedColors: product.colors,
          _suggestedStorage: product.storage ?? [],
          id: product.id,
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
        {img
          ? <img src={img} alt={product.name} className="h-full w-full object-cover" />
          : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground/40" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{product.name}</p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <span className="text-primary font-bold text-sm">{product.price}€</span>
          <span className={`text-xs rounded-full px-2 py-0.5 ${CONDITION_COLORS[product.condition] ?? "bg-gray-100 text-gray-600"}`}>
            {CONDITIONS.find(c => c.value === product.condition)?.label}
          </span>
          {stock && <span className={`text-xs rounded-full px-2 py-0.5 ${stock.color}`}>{stock.label}</span>}
        </div>
        {/* Color swatches preview */}
        {product.colors.length > 0 && (
          <div className="flex gap-1 mt-1.5">
            {product.colors.map(c => (
              <span key={c} title={c}
                className="h-4 w-4 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: COLOR_HEX[c] ?? "#888" }} />
            ))}
          </div>
        )}
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
// Live visitors
// ---------------------------------------------------------------------------

const STEP_LABELS = ["Naprava", "Model", "Težava", "Urgentnost", "Kontakt", "Potrditev"];
const URGENCY_LABELS: Record<string, string> = {
  standard: "Standardno", fast: "Hitra obdelava", urgent: "URGENTNO 24h",
};

function VisitorCard({ visitor }: { visitor: VisitorState }) {
  const isBooking = visitor.activity === "booking";
  const isShop = visitor.activity === "shop";
  const [expanded, setExpanded] = useState(isBooking);

  const elapsed = useMemo(() => {
    const mins = Math.floor((Date.now() - new Date(visitor.joinedAt).getTime()) / 60000);
    if (mins < 1) return "< 1 min";
    return `${mins} min`;
  }, [visitor.joinedAt]);

  const pageLabel = visitor.page === "shop" ? "Shop" : "Servis";
  const activityLabel = isBooking
    ? `Izpolnjuje obrazec · Korak ${visitor.bookingStep ?? 1}/6`
    : isShop
    ? visitor.shopInquiry
      ? "Povpraševanje za nakup"
      : visitor.shopTab === "sell"
      ? "Prodaja naprave"
      : "Brska po shopu"
    : "Brska po strani";

  const dotColor = isBooking
    ? "bg-primary animate-pulse"
    : isShop
    ? "bg-amber-500 animate-pulse"
    : "bg-emerald-500";

  const borderColor = isBooking
    ? "border-primary/30 bg-primary/5"
    : isShop
    ? "border-amber-200 bg-amber-50/50"
    : "border-border bg-card";

  return (
    <div className={`rounded-2xl border transition-all ${borderColor}`}>
      {/* Header — always visible, click to expand */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dotColor}`} />
          <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{visitor.sessionId}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs font-medium text-foreground flex-shrink-0">{pageLabel}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground truncate">{activityLabel}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-muted-foreground">{elapsed}</span>
          <span className="text-muted-foreground text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-border/50">
          {isBooking && (
            <div className="space-y-2 text-xs">
              <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">
                Korak {visitor.bookingStep}/6 — {STEP_LABELS[(visitor.bookingStep ?? 1) - 1]}
              </span>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
                {visitor.bookingDevice && <div><span className="text-muted-foreground">Naprava: </span><span className="font-medium">{visitor.bookingDevice}</span></div>}
                {visitor.bookingModel  && <div><span className="text-muted-foreground">Model: </span><span className="font-medium">{visitor.bookingModel}</span></div>}
                {visitor.bookingIssues?.length ? <div className="col-span-2"><span className="text-muted-foreground">Težave: </span><span className="font-medium">{visitor.bookingIssues.join(", ")}</span></div> : null}
                {visitor.bookingUrgency && <div><span className="text-muted-foreground">Urgentnost: </span><span className="font-medium">{URGENCY_LABELS[visitor.bookingUrgency] ?? visitor.bookingUrgency}</span></div>}
                {visitor.bookingName  && <div><span className="text-muted-foreground">Ime: </span><span className="font-medium">{visitor.bookingName}</span></div>}
                {visitor.bookingPhone && <div><span className="text-muted-foreground">Tel: </span><span className="font-medium">{visitor.bookingPhone}</span></div>}
                {visitor.bookingEmail && <div className="col-span-2"><span className="text-muted-foreground">Email: </span><span className="font-medium">{visitor.bookingEmail}</span></div>}
              </div>
            </div>
          )}
          {isShop && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs mt-1">
              <div><span className="text-muted-foreground">Tab: </span><span className="font-medium">{visitor.shopTab === "sell" ? "Prodaja naprave" : "Kupuje napravo"}</span></div>
              {visitor.shopCategory && visitor.shopCategory !== "vse" && (
                <div><span className="text-muted-foreground">Kategorija: </span><span className="font-medium">{visitor.shopCategory}</span></div>
              )}
              {visitor.shopProduct && (
                <div className="col-span-2"><span className="text-muted-foreground">Gleda: </span><span className="font-medium">{visitor.shopProduct}</span></div>
              )}
              {visitor.shopInquiry && (
                <div className="col-span-2"><span className="text-muted-foreground">Povpraševanje za: </span><span className="font-medium text-amber-700">{visitor.shopInquiry}</span></div>
              )}
            </div>
          )}
          {!isBooking && !isShop && (
            <p className="text-xs text-muted-foreground">Brska po servisni strani</p>
          )}
        </div>
      )}
    </div>
  );
}

function LiveVisitors() {
  const [visitors, setVisitors] = useState<VisitorState[]>([]);

  useEffect(() => {
    markAsAdmin();
    const channel = supabase.channel(VISITOR_CHANNEL);

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<VisitorState>();
      // Deduplicate: each presence key maps to an array — take the latest entry only
      const deduped = Object.values(state).map(entries => entries[entries.length - 1]).filter(Boolean);
      setVisitors(deduped);
    });

    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const booking = visitors.filter(v => v.activity === "booking").length;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" /> Živi obiski
        </h2>
        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-0.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {visitors.length} {visitors.length === 1 ? "obiskovalec" : "obiskovalcev"}
        </span>
        {booking > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-0.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {booking} izpolnjuje obrazec
          </span>
        )}
      </div>

      {visitors.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Trenutno ni aktivnih obiskovalcev.</p>
      ) : (
        <div className="space-y-2">
          {visitors.map(v => <VisitorCard key={v.sessionId} visitor={v} />)}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin page
// ---------------------------------------------------------------------------

const SUPABASE_CONFIGURED =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function AdminPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try { setProducts(await apiGet()); }
    catch (e) { setLoadError((e as Error).message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const available = products.filter(p => p.available).length;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
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
        {!SUPABASE_CONFIGURED && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-semibold mb-1">Supabase ni konfiguriran</p>
              <p>Manjkata okoljski spremenljivki <code className="bg-amber-100 rounded px-1">VITE_SUPABASE_URL</code> in <code className="bg-amber-100 rounded px-1">VITE_SUPABASE_PUBLISHABLE_KEY</code>. Dodajte ju v Netlify → Site configuration → Environment variables, nato naredite redeploy.</p>
            </div>
          </div>
        )}
        {loadError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-900">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-500" />
            <div>
              <p className="font-semibold mb-1">Napaka pri nalaganju izdelkov</p>
              <p className="font-mono text-xs">{loadError}</p>
              {loadError.includes("Failed to fetch") || loadError.includes("fetch") ? (
                <p className="mt-1">Preverite, ali ste pravilno nastavili Supabase okoljske spremenljivke in ali je URL pravilen.</p>
              ) : loadError.includes("permission") || loadError.includes("RLS") || loadError.includes("policy") ? (
                <p className="mt-1">Zaženite <code className="bg-red-100 rounded px-1">supabase/setup-all.sql</code> v Supabase SQL Editorju, da onemogočite RLS.</p>
              ) : null}
            </div>
          </div>
        )}
        <LiveVisitors />

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Skupaj", value: products.length,                         color: "text-foreground" },
            { label: "Vidno",  value: available,                               color: "text-emerald-600" },
            { label: "Skrito", value: products.length - available,             color: "text-muted-foreground" },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-5 text-center">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

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
