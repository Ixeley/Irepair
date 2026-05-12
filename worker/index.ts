import { Resend } from "resend";

interface Env {
  RESEND_API_KEY: string;
  ASSETS: Fetcher;
}

const BUSINESS_EMAIL = "info@irepair.si";

const URGENCY_LABELS: Record<string, string> = {
  standard: "Standardno (2–5 dni)",
  fast: "Hitra obdelava (1–2 dni)",
  urgent: "URGENTNO 24h (+50€ doplačilo)",
};

function buildBookingBusinessEmail(data: {
  device: string;
  model: string;
  issues: string[];
  urgency: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  replacement: boolean;
  totalCost?: string;
}): string {
  const urgencyLabel = URGENCY_LABELS[data.urgency] ?? data.urgency;
  const issuesList = data.issues.map((i) => `<li>${i}</li>`).join("");
  return `<!DOCTYPE html><html lang="sl"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px 40px;">
<h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">iRepair</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Novo naročilo popravila</p>
</td></tr>
<tr><td style="padding:32px 40px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Naprava</span><span style="color:#1d1d1f;font-weight:600;font-size:15px;">${data.device}${data.model ? ` — ${data.model}` : ""}</span></td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Težave</span><ul style="margin:4px 0 0;padding-left:20px;color:#1d1d1f;font-size:15px;">${issuesList}</ul></td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Urgentnost</span><span style="color:#1d1d1f;font-weight:600;font-size:15px;">${urgencyLabel}</span></td></tr>
${data.totalCost ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Ocena stroškov</span><span style="color:#1d4ed8;font-weight:700;font-size:16px;">${data.totalCost}</span></td></tr>` : ""}
${data.replacement ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Dodatno</span><span style="color:#1d1d1f;font-size:15px;">Nadomestni telefon</span></td></tr>` : ""}
${data.description ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Opis težave</span><span style="color:#1d1d1f;font-size:15px;">${data.description}</span></td></tr>` : ""}
</table>
<h2 style="margin:28px 0 16px;font-size:20px;color:#1d1d1f;">Kontaktni podatki</h2>
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Ime in priimek</span><span style="color:#1d1d1f;font-weight:600;font-size:15px;">${data.name}</span></td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Telefon</span><a href="tel:${data.phone}" style="color:#2563eb;font-size:15px;text-decoration:none;">${data.phone}</a></td></tr>
<tr><td style="padding:8px 0;"><span style="color:#6e6e73;font-size:13px;display:block;">E-pošta</span><a href="mailto:${data.email}" style="color:#2563eb;font-size:15px;text-decoration:none;">${data.email}</a></td></tr>
</table>
</td></tr>
<tr><td style="background:#f5f5f7;padding:20px 40px;text-align:center;"><p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, 1000 Ljubljana · <a href="tel:059023951" style="color:#2563eb;">059 023 951</a></p></td></tr>
</table></td></tr></table></body></html>`;
}

function buildBookingConfirmEmail(name: string, device: string, model: string): string {
  return `<!DOCTYPE html><html lang="sl"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px 40px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">iRepair</h1></td></tr>
<tr><td style="padding:40px;text-align:center;">
<div style="font-size:48px;margin-bottom:16px;">✅</div>
<h2 style="margin:0 0 12px;font-size:22px;color:#1d1d1f;">Hvala, ${name}!</h2>
<p style="margin:0 0 8px;color:#4b5563;font-size:15px;">Vaše povpraševanje za <strong>${device}${model ? ` (${model})` : ""}</strong> smo prejeli.</p>
<p style="margin:0 0 28px;color:#4b5563;font-size:15px;">Odgovorili vam bomo v <strong>2 urah</strong>.</p>
<div style="background:#f0f7ff;border-radius:12px;padding:20px;text-align:left;margin-bottom:28px;">
<p style="margin:0 0 8px;font-weight:600;color:#1d1d1f;">Kam priti:</p>
<p style="margin:0;color:#4b5563;">Koprska 94, 1000 Ljubljana</p>
<p style="margin:4px 0 0;color:#4b5563;">Tor–Pet: 8:30–17:00 (Pon zaprto)</p>
</div>
<a href="tel:059023951" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;font-size:15px;">059 023 951</a>
</td></tr>
<tr><td style="background:#f5f5f7;padding:20px;text-align:center;"><p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, Ljubljana · info@irepair.si</p></td></tr>
</table></td></tr></table></body></html>`;
}

async function handleSendBooking(request: Request, env: Env): Promise<Response> {
  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Email ni konfiguriran." }), { status: 500 });
  }
  let data: {
    device: string; model: string; issues: string[]; urgency: string;
    name: string; email: string; phone: string; description: string;
    replacement: boolean; totalCost?: string;
  };
  try { data = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Neveljavni podatki." }), { status: 400 });
  }
  if (!data.name || !data.email || !data.phone || !data.device) {
    return new Response(JSON.stringify({ error: "Manjkajo obvezni podatki." }), { status: 400 });
  }
  const resend = new Resend(env.RESEND_API_KEY);
  try {
    await resend.emails.send({
      from: "iRepair Naročila <narocila@irepair.si>",
      to: [BUSINESS_EMAIL], replyTo: data.email,
      subject: `Novo naročilo: ${data.device}${data.model ? ` ${data.model}` : ""} — ${data.name}`,
      html: buildBookingBusinessEmail(data),
    });
    await resend.emails.send({
      from: "iRepair <narocila@irepair.si>",
      to: [data.email],
      subject: "iRepair — Vaše povpraševanje smo prejeli",
      html: buildBookingConfirmEmail(data.name, data.device, data.model),
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("Resend error:", err);
    return new Response(JSON.stringify({ error: "Napaka pri pošiljanju e-pošte." }), { status: 500 });
  }
}

async function handleSendPurchaseInquiry(request: Request, env: Env): Promise<Response> {
  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Email ni konfiguriran." }), { status: 500 });
  }
  let data: { productName: string; productId: string; price: number; name: string; email: string; phone: string; message?: string };
  try { data = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Neveljavni podatki." }), { status: 400 });
  }
  if (!data.name || !data.email || !data.phone || !data.productName) {
    return new Response(JSON.stringify({ error: "Manjkajo obvezni podatki." }), { status: 400 });
  }
  const resend = new Resend(env.RESEND_API_KEY);
  const businessHtml = `<!DOCTYPE html><html lang="sl"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px 40px;"><h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">iRepair Shop</h1><p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Novo povpraševanje za nakup</p></td></tr>
<tr><td style="padding:32px 40px;">
<h2 style="margin:0 0 20px;font-size:18px;color:#1d1d1f;">Povpraševanje za: <strong>${data.productName}</strong></h2>
<p style="margin:0 0 8px;color:#4b5563;">Cena: <strong>${data.price}€</strong></p>
${data.message ? `<p style="margin:0 0 16px;color:#4b5563;">Sporočilo: ${data.message}</p>` : ""}
<hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0;"/>
<p style="margin:0 0 6px;color:#4b5563;"><strong>${data.name}</strong></p>
<p style="margin:0 0 6px;"><a href="tel:${data.phone}" style="color:#2563eb;">${data.phone}</a></p>
<p style="margin:0;"><a href="mailto:${data.email}" style="color:#2563eb;">${data.email}</a></p>
</td></tr>
<tr><td style="background:#f5f5f7;padding:16px 40px;text-align:center;"><p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, Ljubljana · <a href="tel:059023951" style="color:#2563eb;">059 023 951</a></p></td></tr>
</table></td></tr></table></body></html>`;
  const confirmHtml = `<!DOCTYPE html><html lang="sl"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px 40px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">iRepair Shop</h1></td></tr>
<tr><td style="padding:40px;text-align:center;">
<div style="font-size:48px;margin-bottom:16px;">✅</div>
<h2 style="margin:0 0 12px;font-size:22px;color:#1d1d1f;">Hvala, ${data.name}!</h2>
<p style="margin:0 0 8px;color:#4b5563;font-size:15px;">Vaše povpraševanje za <strong>${data.productName}</strong> smo prejeli.</p>
<p style="margin:0 0 28px;color:#4b5563;font-size:15px;">Odgovorili vam bomo v <strong>2 urah</strong>.</p>
<div style="background:#f0f7ff;border-radius:12px;padding:20px;text-align:left;margin-bottom:28px;">
<p style="margin:0 0 8px;font-weight:600;color:#1d1d1f;">Prevzem v poslovalnici:</p>
<p style="margin:0;color:#4b5563;">Koprska 94, 1000 Ljubljana</p>
<p style="margin:4px 0 0;color:#4b5563;">Tor–Pet: 8:30–17:00</p>
</div>
<a href="tel:059023951" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;font-size:15px;">059 023 951</a>
</td></tr>
<tr><td style="background:#f5f5f7;padding:16px;text-align:center;"><p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, Ljubljana · info@irepair.si</p></td></tr>
</table></td></tr></table></body></html>`;
  try {
    await resend.emails.send({
      from: "iRepair Shop <narocila@irepair.si>", to: [BUSINESS_EMAIL], replyTo: data.email,
      subject: `Povpraševanje za nakup: ${data.productName} — ${data.name}`, html: businessHtml,
    });
    await resend.emails.send({
      from: "iRepair Shop <narocila@irepair.si>", to: [data.email],
      subject: "iRepair Shop — Vaše povpraševanje smo prejeli", html: confirmHtml,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Napaka pri pošiljanju." }), { status: 500 });
  }
}

async function handleSendSellInquiry(request: Request, env: Env): Promise<Response> {
  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Email ni konfiguriran." }), { status: 500 });
  }
  let data: { deviceType: string; model?: string; condition: string; askingPrice?: string; description?: string; name: string; email: string; phone: string };
  try { data = await request.json(); } catch {
    return new Response(JSON.stringify({ error: "Neveljavni podatki." }), { status: 400 });
  }
  if (!data.name || !data.email || !data.phone || !data.deviceType) {
    return new Response(JSON.stringify({ error: "Manjkajo obvezni podatki." }), { status: 400 });
  }
  const CONDITIONS: Record<string, string> = {
    odlicno: "Odlično — brez vidnih poškodb",
    dobro: "Dobro — manjše sledi uporabe",
    vidne_sledi: "Vidne sledi — poškodbe zaslona/ohišja",
    ne_dela: "Ne deluje / pokvarjena",
  };
  const resend = new Resend(env.RESEND_API_KEY);
  const businessHtml = `<!DOCTYPE html><html lang="sl"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;"><h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">iRepair Odkup</h1><p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Stranka želi prodati napravo</p></td></tr>
<tr><td style="padding:32px 40px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Naprava</span><span style="color:#1d1d1f;font-weight:600;font-size:15px;">${data.deviceType}${data.model ? ` — ${data.model}` : ""}</span></td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Stanje</span><span style="color:#1d1d1f;font-size:15px;">${CONDITIONS[data.condition] ?? data.condition}</span></td></tr>
${data.askingPrice ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Zahtevana cena</span><span style="color:#059669;font-weight:700;font-size:16px;">${data.askingPrice}€</span></td></tr>` : ""}
${data.description ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Opis</span><span style="color:#1d1d1f;font-size:15px;">${data.description}</span></td></tr>` : ""}
</table>
<hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0;"/>
<p style="margin:0 0 6px;color:#4b5563;"><strong>${data.name}</strong></p>
<p style="margin:0 0 6px;"><a href="tel:${data.phone}" style="color:#2563eb;">${data.phone}</a></p>
<p style="margin:0;"><a href="mailto:${data.email}" style="color:#2563eb;">${data.email}</a></p>
</td></tr>
<tr><td style="background:#f5f5f7;padding:16px 40px;text-align:center;"><p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, Ljubljana · <a href="tel:059023951" style="color:#2563eb;">059 023 951</a></p></td></tr>
</table></td></tr></table></body></html>`;
  const confirmHtml = `<!DOCTYPE html><html lang="sl"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;text-align:center;"><h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">iRepair Odkup</h1></td></tr>
<tr><td style="padding:40px;text-align:center;">
<div style="font-size:48px;margin-bottom:16px;">💰</div>
<h2 style="margin:0 0 12px;font-size:22px;color:#1d1d1f;">Hvala, ${data.name}!</h2>
<p style="margin:0 0 8px;color:#4b5563;font-size:15px;">Vaše povpraševanje za odkup <strong>${data.deviceType}${data.model ? ` (${data.model})` : ""}</strong> smo prejeli.</p>
<p style="margin:0 0 28px;color:#4b5563;font-size:15px;">Ocenili bomo ponudbo in vam odgovorili v <strong>2 urah</strong>.</p>
<a href="tel:059023951" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;font-size:15px;">059 023 951</a>
</td></tr>
<tr><td style="background:#f5f5f7;padding:16px;text-align:center;"><p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, Ljubljana · info@irepair.si</p></td></tr>
</table></td></tr></table></body></html>`;
  try {
    await resend.emails.send({
      from: "iRepair Odkup <narocila@irepair.si>", to: [BUSINESS_EMAIL], replyTo: data.email,
      subject: `Odkup: ${data.deviceType}${data.model ? ` ${data.model}` : ""} — ${data.name}`, html: businessHtml,
    });
    await resend.emails.send({
      from: "iRepair Odkup <narocila@irepair.si>", to: [data.email],
      subject: "iRepair — Vaše povpraševanje za odkup smo prejeli", html: confirmHtml,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Napaka pri pošiljanju." }), { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST") {
      if (url.pathname === "/api/send-booking") return handleSendBooking(request, env);
      if (url.pathname === "/api/send-purchase-inquiry") return handleSendPurchaseInquiry(request, env);
      if (url.pathname === "/api/send-sell-inquiry") return handleSendSellInquiry(request, env);
    }

    // Serve static assets; fall back to index.html for SPA routing
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status === 404 && !url.pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(new Request(new URL("/index.html", request.url).toString()));
    }
    return assetResponse;
  },
};
