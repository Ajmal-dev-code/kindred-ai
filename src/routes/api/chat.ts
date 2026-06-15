import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { SOLACE_SYSTEM_PROMPT } from "@/lib/system-prompt";
import type { Database } from "@/integrations/supabase/types";

type Body = { id?: string; messages?: UIMessage[] };

function uiMessageText(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? (p as { type: "text"; text: string }).text : ""))
    .join("")
    .trim();
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.replace(/^Bearer\s+/i, "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        if (!LOVABLE_API_KEY) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) return new Response("Unauthorized", { status: 401 });
        const userId = userData.user.id;

        const body = (await request.json()) as Body;
        const threadId = body.id;
        const messages = body.messages ?? [];
        if (!threadId || messages.length === 0) {
          return new Response("Bad request", { status: 400 });
        }

        // Verify thread belongs to user
        const { data: thread } = await supabase
          .from("threads")
          .select("id, title")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        // Persist incoming user message (last one)
        const lastUser = [...messages].reverse().find((m) => m.role === "user");
        if (lastUser) {
          const text = uiMessageText(lastUser);
          if (text) {
            await supabase.from("messages").insert({
              thread_id: threadId,
              user_id: userId,
              role: "user",
              content: text,
            });

            // Auto-title from first user message
            if (thread.title === "New conversation") {
              const newTitle = text.slice(0, 60) + (text.length > 60 ? "…" : "");
              await supabase.from("threads").update({ title: newTitle }).eq("id", threadId);
            } else {
              await supabase
                .from("threads")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", threadId);
            }
          }
        }

        const gateway = createLovableAiGatewayProvider(LOVABLE_API_KEY);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SOLACE_SYSTEM_PROMPT,
          messages: convertToModelMessages(messages),
          onFinish: async ({ text }) => {
            if (text?.trim()) {
              await supabase.from("messages").insert({
                thread_id: threadId,
                user_id: userId,
                role: "assistant",
                content: text,
              });
            }
          },
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});