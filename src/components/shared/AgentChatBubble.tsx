import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

// Import Byggio AI logo
import byggioAILogo from "@/assets/byggio-ai-logo.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SagaContext {
  type: "saga";
  projectName: string;
  clientName: string;
  scope: string;
  assumptions: string[];
  items: Array<{
    moment: string;
    article?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    unit_price?: number;
    subtotal?: number;
  }>;
  addons: Array<{
    name: string;
    price: number;
    is_selected?: boolean;
  }>;
  rotEnabled: boolean;
  markupPercent: number;
  totals: {
    laborCost: number;
    materialCost: number;
    subcontractorCost: number;
    totalInclVat: number;
  };
}

interface BoContext {
  type: "bo";
  projectId: string;
  projectName: string;
  clientName?: string;
  status?: string;
  phases?: Array<{
    name: string;
    startWeek: number;
    duration: number;
    tasks?: string[];
  }>;
  totalWeeks?: number;
  recentDiaryEntries?: Array<{
    report_date: string;
    work_items?: string[];
    notes?: string;
  }>;
  ataItems?: Array<{
    description: string;
    status?: string;
    estimated_cost?: number;
  }>;
  workOrders?: Array<{
    title: string;
    status?: string;
    due_date?: string;
  }>;
}

type AgentContext = SagaContext | BoContext;

interface AgentChatBubbleProps {
  agent: "saga" | "bo";
  context: Omit<SagaContext, "type"> | Omit<BoContext, "type">;
}

// Byggio AI configuration (unified)
const agentConfig = {
  name: "Byggio AI",
  title: "Din AI-assistent",
  avatar: byggioAILogo,
  greeting: "Hej! Jag är Byggio AI, din assistent. Ställ frågor så hjälper jag dig!",
  placeholder: "Fråga Byggio AI...",
};

export function AgentChatBubble({ agent, context }: AgentChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    try {
      const fullContext: AgentContext = { type: agent, ...context } as AgentContext;

      const response = await supabase.functions.invoke("agent-chat", {
        body: {
          agent,
          messages: [...messages, userMessage],
          context: fullContext,
        },
      });

      if (response.error) throw response.error;

      // Handle streaming response
      if (response.data?.content) {
        // Non-streaming fallback
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.data.content },
        ]);
      } else if (response.data?.stream) {
        // SSE stream handling
        const reader = response.data.stream.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        if (fullContent) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: fullContent },
          ]);
          setStreamingContent("");
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ursäkta, något gick fel. Försök igen." },
      ]);
    } finally {
      setIsLoading(false);
      setStreamingContent("");
    }
  }, [input, isLoading, messages, agent, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:scale-105 active:scale-95 transition-all duration-200",
          "group cursor-pointer",
          isOpen && "hidden"
        )}
      >
        <Avatar className="h-8 w-8 border-2 border-primary-foreground/20">
          <AvatarImage src={agentConfig.avatar} alt={agentConfig.name} />
          <AvatarFallback>{agentConfig.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium leading-none">Fråga {agentConfig.name}</span>
          <span className="text-xs opacity-80">{agentConfig.title}</span>
        </div>
        <MessageCircle className="h-4 w-4 ml-1 opacity-60" />
      </button>

      {/* Chat panel */}
      <div
        className={cn(
          "fixed top-4 bottom-4 right-4 z-50 w-80 sm:w-96",
          "bg-card border border-border rounded-2xl shadow-xl",
          "flex flex-col overflow-hidden",
          "transition-all duration-300 ease-out",
          isOpen
            ? "opacity-100 translate-x-0 scale-100"
            : "opacity-0 translate-x-4 scale-95 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={agentConfig.avatar} alt={agentConfig.name} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {agentConfig.name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{agentConfig.name}</h3>
            <p className="text-xs text-muted-foreground">{agentConfig.title}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {/* Initial greeting */}
            {messages.length === 0 && !streamingContent && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={agentConfig.avatar} alt={agentConfig.name} />
                  <AvatarFallback>{agentConfig.name[0]}</AvatarFallback>
                </Avatar>
                <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-foreground">{agentConfig.greeting}</p>
                </div>
              </div>
            )}

            {/* Message history */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={agentConfig.avatar} alt={agentConfig.name} />
                    <AvatarFallback>{agentConfig.name[0]}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 max-w-[85%]",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted/50 rounded-tl-sm"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming response */}
            {streamingContent && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={agentConfig.avatar} alt={agentConfig.name} />
                  <AvatarFallback>{agentConfig.name[0]}</AvatarFallback>
                </Avatar>
                <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                  <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:my-1">
                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !streamingContent && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={agentConfig.avatar} alt={agentConfig.name} />
                  <AvatarFallback>{agentConfig.name[0]}</AvatarFallback>
                </Avatar>
                <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{agentConfig.name} skriver...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={agentConfig.placeholder}
              className="min-h-[44px] max-h-[120px] resize-none text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 h-11 w-11"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
