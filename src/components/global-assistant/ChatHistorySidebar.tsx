import { useEffect, useState } from "react";
import { History, Trash2, MessageSquare } from "lucide-react";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Conversation, Message, ConversationContext } from "@/types/global-assistant";

interface ChatHistorySidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectConversation: (conversation: Conversation) => void;
  currentConversationId: string | null;
}

interface DbConversation {
  id: string;
  title: string | null;
  messages: unknown;
  context: unknown;
  created_at: string;
  updated_at: string;
}

function groupConversationsByDate(conversations: Conversation[]) {
  const groups: Record<string, Conversation[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  conversations.forEach((conv) => {
    const date = new Date(conv.updated_at);
    if (isToday(date)) {
      groups.today.push(conv);
    } else if (isYesterday(date)) {
      groups.yesterday.push(conv);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  if (isToday(date) || isYesterday(date)) {
    return format(date, "HH:mm", { locale: sv });
  }
  return format(date, "d MMM", { locale: sv });
}

export function ChatHistorySidebar({
  open,
  onOpenChange,
  onSelectConversation,
  currentConversationId,
}: ChatHistorySidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchConversations();
    }
  }, [open]);

  const fetchConversations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("assistant_conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      const typed = (data as DbConversation[]).map((c) => ({
        id: c.id,
        title: c.title,
        messages: c.messages as Message[],
        context: c.context as ConversationContext,
        created_at: c.created_at,
        updated_at: c.updated_at,
      }));
      setConversations(typed);
    }
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    await supabase
      .from("assistant_conversations")
      .delete()
      .eq("id", conversationId);
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
  };

  const groups = groupConversationsByDate(conversations);

  const renderGroup = (title: string, items: Conversation[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={`group flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50 ${
                currentConversationId === conv.id ? "bg-muted" : ""
              }`}
            >
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">
                  {conv.title || "Ny konversation"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTime(conv.updated_at)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => handleDelete(e, conv.id)}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Chatthistorik
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Ingen chatthistorik ännu
              </p>
            ) : (
              <>
                {renderGroup("Idag", groups.today)}
                {renderGroup("Igår", groups.yesterday)}
                {renderGroup("Denna vecka", groups.thisWeek)}
                {renderGroup("Äldre", groups.older)}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
