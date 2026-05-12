import { Resend } from "resend";

interface Env {
  RESEND_API_KEY: string;
}

const BUSINESS_EMAIL = "info@irepair.si";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.RESEND_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Email ni konfiguriran." }), { status: 500 });
  }

  let data: { deviceType: string; model?: string; condition: string; askingPrice?: string; description?: string; name: string; email: string; phone: string };
  try {
    data = await context.request.json();
  } catch {
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

  const resend = new Resend(apiKey);

  const businessHtml = `<!DOCTYPE html><html lang="sl"><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;">
<h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">iRepair <span style="opacity:0.8">Odkup</span></h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">💰 Stranka želi prodati napravo</p>
</td></tr>
<tr><td style="padding:32px 40px;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
<span style="color:#6e6e73;font-size:13px;display:block;">Naprava</span>
<span style="color:#1d1d1f;font-weight:600;font-size:15px;">${data.deviceType}${data.model ? ` — ${data.model}` : ""}</span>
</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
<span style="color:#6e6e73;font-size:13px;display:block;">Stanje</span>
<span style="color:#1d1d1f;font-size:15px;">${CONDITIONS[data.condition] ?? data.condition}</span>
</td></tr>
${data.askingPrice ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Zahtevana cena</span><span style="color:#059669;font-weight:700;font-size:16px;">${data.askingPrice}€</span></td></tr>` : ""}
${data.description ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Opis</span><span style="color:#1d1d1f;font-size:15px;">${data.description}</span></td></tr>` : ""}
</table>
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
<tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">iRepair Odkup</h1>
</td></tr>
<tr><td style="padding:40px;text-align:center;">
<div style="font-size:48px;margin-bottom:16px;">💰</div>
<h2 style="margin:0 0 12px;font-size:22px;color:#1d1d1f;">Hvala, ${data.name}!</h2>
<p style="margin:0 0 8px;color:#4b5563;font-size:15px;">Vaše povpraševanje za odkup <strong>${data.deviceType}${data.model ? ` (${data.model})` : ""}</strong> smo prejeli.</p>
<p style="margin:0 0 28px;color:#4b5563;font-size:15px;">Ocenili bomo ponudbo in vam odgovorili v <strong>2 urah</strong>.</p>
<a href="tel:059023951" style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;font-size:15px;">📞 059 023 951</a>
</td></tr>
<tr><td style="background:#f5f5f7;padding:16px;text-align:center;">
<p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, Ljubljana · info@irepair.si</p>
</td></tr>
</table></td></tr></table></body></html>`;

  try {
    await resend.emails.send({
      from: "iRepair Odkup <narocila@irepair.si>",
      to: [BUSINESS_EMAIL],
      replyTo: data.email,
      subject: `💰 Odkup: ${data.deviceType}${data.model ? ` ${data.model}` : ""} — ${data.name}`,
      html: businessHtml,
    });
    await resend.emails.send({
      from: "iRepair Odkup <narocila@irepair.si>",
      to: [data.email],
      subject: "iRepair — Vaše povpraševanje za odkup smo prejeli 💰",
      html: confirmHtml,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Napaka pri pošiljanju." }), { status: 500 });
  }
};
