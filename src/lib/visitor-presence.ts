import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type VisitorState = {
  sessionId: string;
  page: string;
  activity: "browsing" | "booking" | "shop";
  joinedAt: string;
  isAdmin?: boolean;
  // booking fields
  bookingStep?: number;
  bookingDevice?: string;
  bookingModel?: string;
  bookingIssues?: string[];
  bookingUrgency?: string;
  bookingName?: string;
  bookingEmail?: string;
  bookingPhone?: string;
  // shop fields
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
let _subscribed = false;
let _unloadHandler: (() => void) | null = null;

export function initVisitorTracking(page: string): () => void {
  if (isAdmin()) return () => {};

  const sessionId = getSessionId();

  _state = {
    sessionId,
    page,
    activity: "browsing",
    joinedAt: new Date().toISOString(),
  };

  _channel = supabase.channel(VISITOR_CHANNEL, {
    config: { presence: { key: sessionId } },
  });

  _unloadHandler = () => { _channel?.untrack(); };
  window.addEventListener("beforeunload", _unloadHandler);

  _channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      _subscribed = true;
      if (_state) await _channel!.track(_state);
    }
  });

  return () => {
    if (_unloadHandler) window.removeEventListener("beforeunload", _unloadHandler);
    if (_channel) {
      _channel.untrack();
      supabase.removeChannel(_channel);
    }
    _channel = null;
    _state = null;
    _subscribed = false;
    _unloadHandler = null;
  };
}

export async function updateVisitorState(update: Partial<VisitorState>): Promise<void> {
  if (!_channel || !_state) return;
  _state = { ..._state, ...update };
  if (_subscribed) {
    await _channel.track(_state);
  }
}
