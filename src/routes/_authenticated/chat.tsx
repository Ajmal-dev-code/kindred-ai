import { createFileRoute, Outlet, useNavigate, useParams, useRouter, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { listThreads, createThread, deleteThread } from "@/lib/chat.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, Trash2, LogOut } from "lucide-react";
import logo from "@/assets/solace-logo.png";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Solace" }] }),
  component: ChatLayout,
});

function ChatLayout() {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;

  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const deleteFn = useServerFn(deleteThread);

  const threadsQuery = useQuery({
    queryKey: ["threads"],
    queryFn: () => listFn(),
  });

  const createMutation = useMutation({
    mutationFn: () => createFn(),
    onSuccess: (t) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: (_d, id) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.removeQueries({ queryKey: ["thread", id] });
      if (activeId === id) navigate({ to: "/chat" });
    },
  });

  // Auto-create a first thread when none exists and we're at /chat
  useEffect(() => {
    if (!activeId && threadsQuery.data) {
      if (threadsQuery.data.length === 0 && !createMutation.isPending) {
        createMutation.mutate();
      } else if (threadsQuery.data.length > 0) {
        navigate({
          to: "/chat/$threadId",
          params: { threadId: threadsQuery.data[0].id },
          replace: true,
        });
      }
    }
  }, [activeId, threadsQuery.data]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <aside className="hidden md:flex w-72 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
        <div className="p-4 flex items-center gap-2">
          <img src={logo} alt="" width={28} height={28} />
          <span className="font-serif text-lg">Solace</span>
        </div>
        <div className="px-3 pb-2">
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="w-full justify-start gap-2 rounded-full"
          >
            <Plus className="size-4" />
            New conversation
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {threadsQuery.data?.map((t) => (
            <div
              key={t.id}
              className={cn(
                "group flex items-center gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer transition",
                activeId === t.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60",
              )}
              onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } })}
            >
              <MessageCircle className="size-4 shrink-0 opacity-60" />
              <span className="truncate flex-1">{t.title}</span>
              <button
                type="button"
                aria-label="Delete conversation"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this conversation?")) deleteMutation.mutate(t.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {threadsQuery.data?.length === 0 && (
            <p className="px-3 py-6 text-xs text-muted-foreground text-center">
              Start your first conversation.
            </p>
          )}
        </nav>
        <div className="p-3 border-t border-border">
          <Link to="/" className="block">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              Home
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}