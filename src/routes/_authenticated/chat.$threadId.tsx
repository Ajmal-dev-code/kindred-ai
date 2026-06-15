import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import type { UIMessage } from "ai";
import { getThreadMessages } from "@/lib/chat.functions";
import { ChatWindow } from "@/components/chat/chat-window";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = useParams({ from: "/_authenticated/chat/$threadId" });
  const getFn = useServerFn(getThreadMessages);

  const { data, isLoading } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getFn({ data: { threadId } }),
  });

  const initialMessages = useMemo<UIMessage[]>(() => {
    if (!data?.messages) return [];
    return data.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        parts: [{ type: "text", text: m.content }],
      }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Opening conversation…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Conversation not found.
      </div>
    );
  }

  return <ChatWindow key={threadId} threadId={threadId} initialMessages={initialMessages} />;
}