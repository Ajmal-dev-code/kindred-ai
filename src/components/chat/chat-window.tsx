import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/solace-logo.png";
import { toast } from "sonner";

type Props = {
  threadId: string;
  initialMessages: UIMessage[];
};

export function ChatWindow({ threadId, initialMessages }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [],
  );

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (err) => {
      toast.error(err.message || "Something went wrong. Please try again.");
    },
  });

  const isStreaming = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus();
  }, [threadId, isStreaming]);

  const handleSubmit = (msg: PromptInputMessage) => {
    const text = msg.text?.trim();
    if (!text) return;
    sendMessage({ text });
  };

  return (
    <div className="flex flex-col h-full">
      <Conversation className="flex-1">
        <ConversationContent className="max-w-3xl mx-auto w-full px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<img src={logo} alt="" width={56} height={56} />}
              title="What's on your mind?"
              description="Tell me what's going on — big or small. I'm here to listen."
            />
          ) : (
            messages.map((m) => {
              const text = m.parts
                .map((p) =>
                  p.type === "text" ? (p as { type: "text"; text: string }).text : "",
                )
                .join("");
              if (m.role === "user") {
                return (
                  <Message key={m.id} from="user">
                    <MessageContent>{text}</MessageContent>
                  </Message>
                );
              }
              return (
                <Message key={m.id} from="assistant">
                  <div className="w-full">
                    {text ? (
                      <MessageResponse>{text}</MessageResponse>
                    ) : (
                      <Shimmer>Thinking…</Shimmer>
                    )}
                  </div>
                </Message>
              );
            })
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <div className="w-full">
                <Shimmer>Thinking…</Shimmer>
              </div>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-background/80 backdrop-blur">
        <div className="max-w-3xl mx-auto w-full px-4 py-4">
          <PromptInput onSubmit={handleSubmit} className="rounded-2xl">
            <PromptInputTextarea
              ref={textareaRef}
              placeholder="Share what's going on…"
              autoFocus
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} disabled={isStreaming} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-[11px] text-center text-muted-foreground">
            Solace is an AI companion, not a substitute for a licensed therapist.
          </p>
        </div>
      </div>
    </div>
  );
}