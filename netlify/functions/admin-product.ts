import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

export const handler: Handler = async (event) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { statusCode: 500, body: JSON.stringify({ error: "Supabase service key not configured." }) };

  const admin = createClient(url, key);
  const method = event.httpMethod;
  const id = event.queryStringParameters?.id;

  // GET — list all products
  if (method === "GET") {
    const { data, error } = await admin
      .from("shop_products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify(data) };
  }

  // POST — create
  if (method === "POST") {
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(event.body ?? "{}"); } catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) }; }
    const { data, error } = await admin.from("shop_products").insert([payload]).select().single();
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 201, body: JSON.stringify(data) };
  }

  // PUT — update
  if (method === "PUT" && id) {
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(event.body ?? "{}"); } catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) }; }
    const { data, error } = await admin.from("shop_products").update(payload).eq("id", id).select().single();
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify(data) };
  }

  // DELETE
  if (method === "DELETE" && id) {
    const { error } = await admin.from("shop_products").delete().eq("id", id);
    if (error) return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
