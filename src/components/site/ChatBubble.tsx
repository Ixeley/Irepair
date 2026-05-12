import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Msg = { role: "user" | "assistant"; content: string };

const INITIAL: Msg[] = [
  { role: "assistant", content: "👋 Pozdravljeni! Sem iRepair pomočnik. S čim vam lahko pomagam? Npr. cena zamenjave zaslona, urgentno popravilo, lokacija ..." },
];

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(INITIAL);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const resp = await fetch("/api/public/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        setMessages((m) => [...m, { role: "assistant", content: err.error || "Žal trenutno ne morem odgovoriti. Pokličite nas na 059 023 951." }]);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantText = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              assistantText += c;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: assistantText };
                return copy;
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", content: "Žal je prišlo do napake. Pokličite nas na 059 023 951." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:scale-110 transition-transform animate-float"
          aria-label="Odpri klepet"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-background" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] max-w-sm bg-card rounded-3xl shadow-card overflow-hidden animate-fade-up flex flex-col" style={{ maxHeight: "calc(100vh - 3rem)" }}>
          <div className="gradient-primary text-primary-foreground p-4 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="font-semibold">iRepair pomočnik</div>
              <div className="text-xs opacity-80 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" /> Na voljo zdaj
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Zapri" className="hover:opacity-80">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 bg-secondary/30 space-y-3 text-sm" style={{ minHeight: "300px", maxHeight: "400px" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 max-w-[88%] shadow-soft whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                    : "bg-card rounded-2xl rounded-tl-sm"
                }`}
              >
                {m.content || (loading && i === messages.length - 1 ? <Loader2 className="h-4 w-4 animate-spin" /> : "")}
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex gap-2 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
              placeholder="Vprašajte karkoli..."
              className="flex-1 rounded-full bg-secondary px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <Button size="icon" className="rounded-full h-10 w-10 flex-shrink-0" onClick={send} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
