import { supabase } from "@/integrations/supabase/client";

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

// Current active tracking instance — replaced atomically on each init.
interface Tracking {
  state: VisitorState;
  send: (event: "visitor_update" | "visitor_leave") => Promise<void>;
}

let _tracking: Tracking | null = null;
let _cleanupFn: (() => void) | null = null;

export function initVisitorTracking(page: string): () => void {
  if (isAdmin()) return () => {};

  // Always tear down any previous tracking before starting fresh.
  // This prevents leaked channels when React remounts or StrictMode fires.
  if (_cleanupFn) { _cleanupFn(); _cleanupFn = null; }

  const sessionId = getSessionId();
  const state: VisitorState = {
    sessionId,
    page,
    activity: "browsing",
    joinedAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  };

  const channel = supabase.channel(VISITOR_CHANNEL);
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  // send() is a closure over the LOCAL channel and state — no module-level
  // variable lookups, so stale channels can never broadcast current state.
  const send = async (event: "visitor_update" | "visitor_leave") => {
    state.lastSeen = new Date().toISOString();
    try {
      await channel.send({ type: "broadcast", event, payload: { ...state } });
    } catch { /* ignore */ }
  };

  _tracking = { state, send };

  channel.on("broadcast", { event: "request_state" }, () => {
    send("visitor_update");
  });

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      // Clear before starting — prevents interval accumulation on reconnect.
      if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
      await send("visitor_update");
      heartbeat = setInterval(() => send("visitor_update"), 15000);
    }
  });

  const onUnload = () => send("visitor_leave");
  window.addEventListener("beforeunload", onUnload);

  _cleanupFn = () => {
    window.removeEventListener("beforeunload", onUnload);
    if (heartbeat) { clearInterval(heartbeat); heartbeat = null; }
    send("visitor_leave");
    supabase.removeChannel(channel);
    if (_tracking?.state === state) _tracking = null;
  };

  return _cleanupFn;
}

export async function updateVisitorState(update: Partial<VisitorState>): Promise<void> {
  if (!_tracking) return;
  Object.assign(_tracking.state, update);
  await _tracking.send("visitor_update");
}
