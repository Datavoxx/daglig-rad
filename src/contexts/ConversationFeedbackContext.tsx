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
  const dismissedRef = useRef(false);
  const location = useLocation();

  // Check if ANY feedback already exists for this conversation (regardless of task_type)
  const checkExistingFeedback = async (conversationId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("ai_feedback")
      .select("id")
      .eq("conversation_id", conversationId)
      .limit(1);
    
    return (data?.length ?? 0) > 0;
  };

  // When lastConversationId is set, start timer once (not on every navigation)
  useEffect(() => {
    if (lastConversationId && !dismissedRef.current && !location.pathname.includes("/global-assistant")) {
      checkExistingFeedback(lastConversationId).then((exists) => {
        if (!exists && !dismissedRef.current) {
          timerRef.current = setTimeout(() => {
            if (!dismissedRef.current) {
              setShowPopup(true);
            }
          }, 30000);
        }
      });
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [lastConversationId]);

  // If user goes back to /global-assistant BEFORE popup shows, cancel timer
  useEffect(() => {
    if (location.pathname.includes("/global-assistant") && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [location.pathname]);

  const handleClose = () => {
    setShowPopup(false);
    dismissedRef.current = true;
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
