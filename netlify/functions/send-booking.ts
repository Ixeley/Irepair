import type { Handler } from "@netlify/functions";
import { Resend } from "resend";

const BUSINESS_EMAIL = "info@irepair.si";

const URGENCY_LABELS: Record<string, string> = {
  standard: "Standardno (2–5 dni)",
  fast: "Hitra obdelava (1–2 dni)",
  urgent: "URGENTNO 24h (+50€ doplačilo)",
};

function buildBusinessEmail(data: {
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

  return `
<!DOCTYPE html>
<html lang="sl">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px 40px;">
            <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">i<span style="opacity:0.85">Repair</span></h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Novo naročilo popravila</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <h2 style="margin:0 0 24px;font-size:20px;color:#1d1d1f;">📋 Podrobnosti naročila</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="color:#6e6e73;font-size:13px;display:block;">Naprava</span>
                  <span style="color:#1d1d1f;font-weight:600;font-size:15px;">${data.device}${data.model ? ` — ${data.model}` : ""}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="color:#6e6e73;font-size:13px;display:block;">Težave</span>
                  <ul style="margin:4px 0 0;padding-left:20px;color:#1d1d1f;font-size:15px;">${issuesList}</ul>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="color:#6e6e73;font-size:13px;display:block;">Urgentnost</span>
                  <span style="color:#1d1d1f;font-weight:600;font-size:15px;">${urgencyLabel}</span>
                </td>
              </tr>
              ${data.totalCost ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Ocena stroškov</span><span style="color:#1d4ed8;font-weight:700;font-size:16px;">${data.totalCost}</span></td></tr>` : ""}
              ${data.replacement ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Dodatno</span><span style="color:#1d1d1f;font-size:15px;">Nadomestni telefon</span></td></tr>` : ""}
              ${data.description ? `<tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;"><span style="color:#6e6e73;font-size:13px;display:block;">Opis težave</span><span style="color:#1d1d1f;font-size:15px;">${data.description}</span></td></tr>` : ""}
            </table>

            <h2 style="margin:28px 0 16px;font-size:20px;color:#1d1d1f;">👤 Kontaktni podatki</h2>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="color:#6e6e73;font-size:13px;display:block;">Ime in priimek</span>
                  <span style="color:#1d1d1f;font-weight:600;font-size:15px;">${data.name}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="color:#6e6e73;font-size:13px;display:block;">Telefon</span>
                  <a href="tel:${data.phone}" style="color:#2563eb;font-size:15px;text-decoration:none;">${data.phone}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <span style="color:#6e6e73;font-size:13px;display:block;">E-pošta</span>
                  <a href="mailto:${data.email}" style="color:#2563eb;font-size:15px;text-decoration:none;">${data.email}</a>
                </td>
              </tr>
            </table>

            <div style="margin-top:28px;background:#f0f7ff;border-radius:12px;padding:16px 20px;">
              <p style="margin:0;color:#1d4ed8;font-size:13px;">💡 Stranka bo prišla <strong>osebno v poslovalnico</strong> na Koprski 94, Ljubljana.</p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f5f5f7;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, 1000 Ljubljana · <a href="tel:059023951" style="color:#2563eb;">059 023 951</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildConfirmationEmail(name: string, device: string, model: string): string {
  return `
<!DOCTYPE html>
<html lang="sl">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#3b82f6,#2563eb);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;">iRepair</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <h2 style="margin:0 0 12px;font-size:22px;color:#1d1d1f;">Hvala, ${name}!</h2>
            <p style="margin:0 0 8px;color:#4b5563;font-size:15px;">Vaše povpraševanje za <strong>${device}${model ? ` (${model})` : ""}</strong> smo prejeli.</p>
            <p style="margin:0 0 28px;color:#4b5563;font-size:15px;">Odgovorili vam bomo v <strong>2 urah</strong>.</p>
            <div style="background:#f0f7ff;border-radius:12px;padding:20px;text-align:left;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-weight:600;color:#1d1d1f;">📍 Kam priti:</p>
              <p style="margin:0;color:#4b5563;">Koprska 94, 1000 Ljubljana</p>
              <p style="margin:4px 0 0;color:#4b5563;">Tor–Pet: 8:30–17:00 (Pon zaprto)</p>
            </div>
            <a href="tel:059023951" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;font-size:15px;">
              📞 059 023 951
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#f5f5f7;padding:20px;text-align:center;">
            <p style="margin:0;color:#6e6e73;font-size:12px;">iRepair · Koprska 94, Ljubljana · info@irepair.si</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Email ni konfiguriran." }) };
  }

  let data: {
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
  };

  try {
    data = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Neveljavni podatki." }) };
  }

  if (!data.name || !data.email || !data.phone || !data.device) {
    return { statusCode: 400, body: JSON.stringify({ error: "Manjkajo obvezni podatki." }) };
  }

  const resend = new Resend(apiKey);

  // FROM address — must match a domain verified in Resend dashboard.
  // If irepair.si is not yet verified, add DNS records in Resend → Domains.
  const FROM_SENDER = process.env.RESEND_FROM ?? "iRepair <narocila@irepair.si>";

  try {
    // Email to business
    const biz = await resend.emails.send({
      from: FROM_SENDER,
      to: [BUSINESS_EMAIL],
      replyTo: data.email,
      subject: `🔧 Novo naročilo: ${data.device}${data.model ? ` ${data.model}` : ""} — ${data.name}`,
      html: buildBusinessEmail(data),
    });
    if (biz.error) throw new Error(biz.error.message);

    // Confirmation email to customer
    const conf = await resend.emails.send({
      from: FROM_SENDER,
      to: [data.email],
      subject: "iRepair — Vaše povpraševanje smo prejeli ✅",
      html: buildConfirmationEmail(data.name, data.device, data.model),
    });
    if (conf.error) throw new Error(conf.error.message);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Resend error:", msg);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Napaka pri pošiljanju: ${msg}` }),
    };
  }
};
