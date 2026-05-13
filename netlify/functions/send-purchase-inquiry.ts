import type { Handler } from "@netlify/functions";
import { Resend } from "resend";

const BUSINESS_EMAIL = "info@irepair.si";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "Email ni konfiguriran." }) };

  let data: { productName: string; productId: string; price: number; name: string; email: string; phone: string; message?: string };
  try { data = JSON.parse(event.body ?? "{}"); } catch { return { statusCode: 400, body: JSON.stringify({ error: "Neveljavni podatki." }) }; }

  if (!data.name || !data.email || !data.phone || !data.productName) {
    return { statusCode: 400, body: JSON.stringify({ error: "Manjkajo obvezni podatki." }) };
  }

  const resend = new Resend(apiKey);

  const businessHtml = `<!DOCTYPE html><html lang="sl"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px 40px;">
<h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">iRepair <span style="opacity:0.8">Shop</span></h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">🛒 Novo povpraševanje za nakup</p>
</td></tr>
<tr><td style="padding:32px 40px;">
<h2 style="margin:0 0 20px;font-size:18px;color:#1d1d1f;">Povpraševanje za: <strong>${data.productName}</strong></h2>
<p style="margin:0 0 8px;color:#4b5563;">Cena: <strong>${data.price}€</strong></p>
${data.message ? `<p style="margin:0 0 16px;color:#4b5563;">Sporočilo: ${data.message}</p>` : ""}
<hr style="border:none;border-top:1px solid #f0f0f0;margin:20px 0;"/>
<p style="margin:0 0 6px;color:#4b5563;"><strong>${data.name}</strong></p>
<p style="margin:0 0 6px;"><a href="tel:${data.phone}" style="color:#2563eb;">${data.phone}</a></p>
<p style="margin:0;"><a href="mailto:${data.email}" style="color:#2563eb;">${data.email}</a></p>
</td></tr>
<tr><td style="background:#f5f5f7;padding:16px 40px;text-align:center;">
<p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, Ljubljana · <a href="tel:059023951" style="color:#2563eb;">059 023 951</a></p>
</td></tr>
</table></td></tr></table></body></html>`;

  const confirmHtml = `<!DOCTYPE html><html lang="sl"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px 40px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">iRepair Shop</h1>
</td></tr>
<tr><td style="padding:40px;text-align:center;">
<div style="font-size:48px;margin-bottom:16px;">✅</div>
<h2 style="margin:0 0 12px;font-size:22px;color:#1d1d1f;">Hvala, ${data.name}!</h2>
<p style="margin:0 0 8px;color:#4b5563;font-size:15px;">Vaše povpraševanje za <strong>${data.productName}</strong> smo prejeli.</p>
<p style="margin:0 0 28px;color:#4b5563;font-size:15px;">Odgovorili vam bomo v <strong>2 urah</strong>.</p>
<div style="background:#f0f7ff;border-radius:12px;padding:20px;text-align:left;margin-bottom:28px;">
<p style="margin:0 0 8px;font-weight:600;color:#1d1d1f;">📍 Prevzem v poslovalnici:</p>
<p style="margin:0;color:#4b5563;">Koprska 94, 1000 Ljubljana</p>
<p style="margin:4px 0 0;color:#4b5563;">Tor–Pet: 8:30–17:00</p>
</div>
<a href="tel:059023951" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;font-size:15px;">📞 059 023 951</a>
</td></tr>
<tr><td style="background:#f5f5f7;padding:16px;text-align:center;">
<p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, Ljubljana · info@irepair.si</p>
</td></tr>
</table></td></tr></table></body></html>`;

  const FROM_SENDER = process.env.RESEND_FROM ?? "iRepair Shop <narocila@irepair.si>";
  try {
    const biz = await resend.emails.send({
      from: FROM_SENDER,
      to: [BUSINESS_EMAIL],
      replyTo: data.email,
      subject: `🛒 Povpraševanje za nakup: ${data.productName} — ${data.name}`,
      html: businessHtml,
    });
    if (biz.error) throw new Error(biz.error.message);
    const conf = await resend.emails.send({
      from: FROM_SENDER,
      to: [data.email],
      subject: "iRepair Shop — Vaše povpraševanje smo prejeli ✅",
      html: confirmHtml,
    });
    if (conf.error) throw new Error(conf.error.message);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Resend error:", msg);
    return { statusCode: 500, body: JSON.stringify({ error: `Napaka pri pošiljanju: ${msg}` }) };
  }
};
