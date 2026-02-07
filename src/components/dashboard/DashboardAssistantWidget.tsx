import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { ChatInput } from "@/components/global-assistant/ChatInput";
import { QuickSuggestions } from "@/components/global-assistant/QuickSuggestions";

export function DashboardAssistantWidget() {
  const navigate = useNavigate();

  const handleSend = (message: string) => {
    navigate("/global-assistant", { 
      state: { initialMessage: message } 
    });
  };

  return (
    <section className="rounded-2xl border border-border/40 bg-card/50 p-6 ring-1 ring-black/5 dark:ring-white/5">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-center gap-2 text-center">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">
            Vad kan jag hjälpa dig med?
          </h2>
        </div>
        
        <ChatInput onSend={handleSend} />
        
        <QuickSuggestions onSelect={handleSend} />
      </div>
    </section>
  );
}
