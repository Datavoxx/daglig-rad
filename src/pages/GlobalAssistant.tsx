import { useState, useEffect, useCallback } from "react";
import { Sparkles, Plus, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/global-assistant/ChatInput";
import { MessageList } from "@/components/global-assistant/MessageList";
import { QuickSuggestions } from "@/components/global-assistant/QuickSuggestions";
import { ChatHistorySidebar } from "@/components/global-assistant/ChatHistorySidebar";
import type { Message, VerificationMatch, NextAction, ConversationContext, Conversation } from "@/types/global-assistant";
import type { Json } from "@/integrations/supabase/types";

export default function GlobalAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [context, setContext] = useState<ConversationContext>({});
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleNewChat = () => {
    setMessages([]);
    setContext({});
    setCurrentConversationId(null);
  };

  const handleLoadConversation = (conversation: Conversation) => {
    setMessages(conversation.messages);
    setContext(conversation.context);
    setCurrentConversationId(conversation.id);
    setHistoryOpen(false);
  };

  // Fetch user info on mount
  useEffect(() => {
    const fetchUser = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        setUserId(userData.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", userData.user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0]);
        } else {
          setUserName(userData.user.email?.split("@")[0] || "");
        }
      }
    };
    fetchUser();
  }, []);

  // Save conversation to database
  const saveConversation = useCallback(async (
    newMessages: Message[],
    newContext: ConversationContext,
    conversationId: string | null
  ) => {
    if (!userId || newMessages.length === 0) return conversationId;

    // Filter out loading messages for storage
    const messagesToSave = newMessages.filter((m) => m.type !== "loading");
    if (messagesToSave.length === 0) return conversationId;

    // Generate title from first user message
    const firstUserMessage = messagesToSave.find((m) => m.role === "user");
    const title = firstUserMessage?.content.slice(0, 50) || "Ny konversation";

    if (conversationId) {
      // Update existing conversation
      await supabase
        .from("assistant_conversations")
        .update({
          messages: messagesToSave as unknown as Json,
          context: newContext as unknown as Json,
          title,
        })
        .eq("id", conversationId);
      return conversationId;
    } else {
      // Create new conversation
      const { data } = await supabase
        .from("assistant_conversations")
        .insert({
          user_id: userId,
          messages: messagesToSave as unknown as Json,
          context: newContext as unknown as Json,
          title,
        })
        .select("id")
        .single();
      return data?.id || null;
    }
  }, [userId]);

  const sendMessage = async (content: string, contextOverride?: Partial<ConversationContext>) => {
    const effectiveContext = contextOverride 
      ? { ...context, ...contextOverride } 
      : context;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      type: "text",
    };
    
    const loadingMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      type: "loading",
    };

    const newMessagesWithLoading = [...messages, userMessage, loadingMessage];
    setMessages(newMessagesWithLoading);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("global-assistant", {
        body: {
          message: content,
          history: messages.filter((m) => m.type !== "loading"),
          context: effectiveContext,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.content || "",
        type: data.type || "text",
        data: data.data,
      };

      const finalMessages = [...messages, userMessage, assistantMessage];
      setMessages(finalMessages);

      // Update context if provided
      const finalContext = data.context 
        ? { ...effectiveContext, ...data.context }
        : effectiveContext;
      
      if (data.context) {
        setContext(finalContext);
      }

      // Save to database
      const newConversationId = await saveConversation(finalMessages, finalContext, currentConversationId);
      if (newConversationId && newConversationId !== currentConversationId) {
        setCurrentConversationId(newConversationId);
      }
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => m.id !== loadingMessage.id);
        return [
          ...withoutLoading,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Något gick fel. Försök igen.",
            type: "text",
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProposalConfirm = async () => {
    await sendMessage("Ja, kör på!");
  };

  const handleProposalCancel = async () => {
    await sendMessage("Avbryt");
  };

  const handleProposalModify = async () => {
    // User can type what they want to change
  };

  const handleVerificationSelect = async (messageId: string, match: VerificationMatch) => {
    const message = messages.find((m) => m.id === messageId);
    let newContext: Partial<ConversationContext> = {};
    
    if (message?.data?.entityType === "customer") {
      newContext = { selectedCustomerId: match.id };
    } else if (message?.data?.entityType === "project") {
      newContext = { selectedProjectId: match.id };
    } else if (message?.data?.entityType === "estimate") {
      newContext = { selectedEstimateId: match.id };
    } else if (message?.data?.entityType === "invoice") {
      newContext = { selectedInvoiceId: match.id };
    } else if (message?.data?.entityType === "inspection") {
      newContext = { selectedInspectionId: match.id };
    }
    
    setContext((prev) => ({ ...prev, ...newContext }));
    await sendMessage(`Visa information om ${match.title}`, newContext);
  };

  const handleVerificationSearchOther = async () => {
    await sendMessage("Sök efter en annan");
  };

  const handleVerificationCreateNew = async () => {
    await sendMessage("Skapa en ny istället");
  };

  const handleNextAction = async (action: NextAction) => {
    await sendMessage(action.prompt);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="relative flex h-[calc(100vh-3.5rem)] flex-col">
      {/* History Sidebar */}
      <ChatHistorySidebar
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onSelectConversation={handleLoadConversation}
        currentConversationId={currentConversationId}
      />

      {/* Header - always visible */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHistoryOpen(true)}
            className="h-8 w-8"
            title="Visa historik"
          >
            <History className="h-4 w-4" />
          </Button>
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Global Assistant</span>
        </div>
        {hasMessages && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="h-8 w-8"
            title="Ny chatt"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Empty state - centered welcome */}
      {!hasMessages && (
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-foreground">
            Vad kan jag hjälpa dig med{userName ? `, ${userName}` : ""}?
          </h1>
          <p className="mb-8 text-center text-muted-foreground max-w-md">
            Jag kan hjälpa dig skapa offerter, hitta projekt, söka kunder och mycket mer.
          </p>
          <div className="w-full max-w-2xl space-y-4">
            <ChatInput onSend={sendMessage} disabled={isLoading} />
            <QuickSuggestions onSelect={sendMessage} />
          </div>
        </div>
      )}

      {/* Conversation view */}
      {hasMessages && (
        <>
          <MessageList
            messages={messages}
            onProposalConfirm={handleProposalConfirm}
            onProposalCancel={handleProposalCancel}
            onProposalModify={handleProposalModify}
            onVerificationSelect={handleVerificationSelect}
            onVerificationSearchOther={handleVerificationSearchOther}
            onVerificationCreateNew={handleVerificationCreateNew}
            onNextAction={handleNextAction}
            isLoading={isLoading}
          />
          <div className="border-t border-border/40 bg-background/80 backdrop-blur-sm px-4 py-3">
            <div className="mx-auto max-w-2xl">
              <ChatInput
                onSend={sendMessage}
                disabled={isLoading}
                placeholder="Skriv ett meddelande..."
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
