import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 500, body: JSON.stringify({ error: "Supabase service key not configured." }) };

  let filename = "image.jpg";
  try { filename = JSON.parse(event.body ?? "{}").filename ?? filename; } catch { /* ok */ }

  const admin = createClient(url, key);
  const ext = filename.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await admin.storage.from("product-images").createSignedUploadUrl(path);
  if (error || !data) return { statusCode: 500, body: JSON.stringify({ error: error?.message ?? "Upload URL failed" }) };

  const publicUrl = admin.storage.from("product-images").getPublicUrl(path).data.publicUrl;

  return {
    statusCode: 200,
    body: JSON.stringify({ signedUrl: data.signedUrl, token: data.token, path, publicUrl }),
  };
};
