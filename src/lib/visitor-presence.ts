import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type VisitorState = {
  sessionId: string;
  page: string;
  activity: "browsing" | "booking";
  joinedAt: string;
  bookingStep?: number;
  bookingDevice?: string;
  bookingModel?: string;
  bookingIssues?: string[];
  bookingUrgency?: string;
  bookingName?: string;
  bookingEmail?: string;
  bookingPhone?: string;
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

let _channel: RealtimeChannel | null = null;
let _state: VisitorState | null = null;
let _subscribed = false;

export function initVisitorTracking(page: string): () => void {
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

  _channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      _subscribed = true;
      if (_state) await _channel!.track(_state);
    }
  });

  return () => {
    if (_channel) {
      _channel.untrack();
      supabase.removeChannel(_channel);
    }
    _channel = null;
    _state = null;
    _subscribed = false;
  };
}

export async function updateVisitorState(update: Partial<VisitorState>): Promise<void> {
  if (!_channel || !_state) return;
  _state = { ..._state, ...update };
  if (_subscribed) {
    await _channel.track(_state);
  }
}
