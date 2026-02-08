import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GlobalFeedbackPopup } from "@/components/global-assistant/GlobalFeedbackPopup";

interface ConversationFeedbackContextType {
  setLastConversation: (id: string) => void;
}

const ConversationFeedbackContext = createContext<ConversationFeedbackContextType | null>(null);

export function useConversationFeedback() {
  const context = useContext(ConversationFeedbackContext);
  if (!context) {
    throw new Error("useConversationFeedback must be used within ConversationFeedbackProvider");
  }
  return context;
}

interface ConversationFeedbackProviderProps {
  children: ReactNode;
}

export function ConversationFeedbackProvider({ children }: ConversationFeedbackProviderProps) {
  const [lastConversationId, setLastConversationId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  // Check if feedback already exists for this conversation
  const checkExistingFeedback = async (conversationId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("ai_feedback")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("task_type", "conversation_feedback")
      .limit(1);
    
    return (data?.length ?? 0) > 0;
  };

  // When lastConversationId is set and we're NOT on /global-assistant
  useEffect(() => {
    if (lastConversationId && !location.pathname.includes("/global-assistant")) {
      // Check if feedback already given
      checkExistingFeedback(lastConversationId).then((exists) => {
        if (!exists) {
          timerRef.current = setTimeout(() => {
            setShowPopup(true);
          }, 30000); // 30 seconds
        }
      });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lastConversationId, location.pathname]);

  // If user goes back to /global-assistant BEFORE popup shows, cancel timer (but don't close popup)
  useEffect(() => {
    if (location.pathname.includes("/global-assistant") && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [location.pathname]);

  const handleClose = () => {
    setShowPopup(false);
    setLastConversationId(null);
  };

  return (
    <ConversationFeedbackContext.Provider value={{ setLastConversation: setLastConversationId }}>
      {children}
      <GlobalFeedbackPopup
        open={showPopup}
        conversationId={lastConversationId}
        onClose={handleClose}
      />
    </ConversationFeedbackContext.Provider>
  );
}
