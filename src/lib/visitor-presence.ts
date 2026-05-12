import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type VisitorState = {
  sessionId: string;
  page: string;
  activity: "browsing" | "booking" | "shop";
  joinedAt: string;
  lastSeen: string;
  bookingStep?: number;
  bookingDevice?: string;
  bookingModel?: string;
  bookingIssues?: string[];
  bookingUrgency?: string;
  bookingName?: string;
  bookingEmail?: string;
  bookingPhone?: string;
  shopTab?: "buy" | "sell";
  shopCategory?: string;
  shopProduct?: string;
  shopInquiry?: string;
};

export const VISITOR_CHANNEL = "irepair-visitors";

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem("_vsid");
    if (!id) {
      id = "v_" + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem("_vsid", id);
    }
    return id;
  } catch {
    return "v_" + Math.random().toString(36).slice(2, 9);
  }
}

export function markAsAdmin(): void {
  try { localStorage.setItem("_isAdmin", "1"); } catch { /* ignore */ }
}

export function isAdmin(): boolean {
  try { return localStorage.getItem("_isAdmin") === "1"; } catch { return false; }
}

let _channel: RealtimeChannel | null = null;
let _state: VisitorState | null = null;
let _heartbeat: ReturnType<typeof setInterval> | null = null;

async function send(event: "visitor_update" | "visitor_leave") {
  if (!_channel || !_state) return;
  _state.lastSeen = new Date().toISOString();
  try {
    await _channel.send({ type: "broadcast", event, payload: { ..._state } });
  } catch { /* ignore */ }
}

export function initVisitorTracking(page: string): () => void {
  if (isAdmin()) return () => {};

  const sessionId = getSessionId();
  _state = {
    sessionId,
    page,
    activity: "browsing",
    joinedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  };

  _channel = supabase.channel(VISITOR_CHANNEL);

  _channel.on("broadcast", { event: "request_state" }, () => {
    send("visitor_update");
  });

  _channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await send("visitor_update");
      _heartbeat = setInterval(() => send("visitor_update"), 15000);
    }
  });

  const onUnload = () => send("visitor_leave");
  window.addEventListener("beforeunload", onUnload);

  return () => {
    window.removeEventListener("beforeunload", onUnload);
    if (_heartbeat) { clearInterval(_heartbeat); _heartbeat = null; }
    send("visitor_leave");
    if (_channel) { supabase.removeChannel(_channel); _channel = null; }
    _state = null;
  };
}

export async function updateVisitorState(update: Partial<VisitorState>): Promise<void> {
  if (!_state) return;
  _state = { ..._state, ...update };
  await send("visitor_update");
}
