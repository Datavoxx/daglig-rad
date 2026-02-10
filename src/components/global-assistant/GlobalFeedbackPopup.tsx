import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ExternalLink, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface GlobalFeedbackPopupProps {
  open: boolean;
  conversationId: string | null;
  onClose: () => void;
}

export function GlobalFeedbackPopup({ open, conversationId, onClose }: GlobalFeedbackPopupProps) {
  const [rating, setRating] = useState(0);
  const [whatWasGood, setWhatWasGood] = useState("");
  const [whatCanImprove, setWhatCanImprove] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasViewedConversation, setHasViewedConversation] = useState(false);
  const navigate = useNavigate();

  // Fetch user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      }
    };
    if (open) {
      fetchUserId();
    }
  }, [open]);

  // Reset form when popup opens
  useEffect(() => {
    if (open) {
      setRating(0);
      setWhatWasGood("");
      setWhatCanImprove("");
      setHasViewedConversation(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!userId || !conversationId || rating === 0) return;

    setIsSubmitting(true);
    try {
      // Combine comments
      const commentParts = [];
      if (whatWasGood.trim()) {
        commentParts.push(`Bra: ${whatWasGood.trim()}`);
      }
      if (whatCanImprove.trim()) {
        commentParts.push(`Förbättra: ${whatCanImprove.trim()}`);
      }
      const comment = commentParts.length > 0 ? commentParts.join(" | ") : null;

      const { error } = await supabase.from("ai_feedback").insert({
        user_id: userId,
        conversation_id: conversationId,
        task_type: "conversation_feedback",
        rating,
        comment,
      });

      if (error) throw error;

      toast({
        title: "Tack för din feedback!",
        description: "Din feedback hjälper oss att förbättra Byggio AI.",
      });

      onClose();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Något gick fel",
        description: "Kunde inte skicka feedback. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const notifySkip = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      await fetch("https://datavox.app.n8n.cloud/webhook/hoppaover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: data.user?.id || null,
          email: data.user?.email || null,
          conversation_id: conversationId,
          source: "global_feedback_popup",
          skipped_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("Skip webhook error:", e);
    }
  };

  const handleViewConversation = () => {
    navigate(`/global-assistant?conversationId=${conversationId}`);
    setHasViewedConversation(true);
  };

  if (!open) return null;

  return (
    <>
      {/* Dark overlay - always visible when popup is open */}
      <div className="fixed inset-0 z-[60] bg-black/80" />

      {/* Feedback card - positioned based on state */}
      <div
        className={cn(
          "fixed z-[70] w-80 rounded-xl border border-border/60 bg-card p-4 shadow-lg",
          "transition-all duration-500 ease-out",
          hasViewedConversation
            ? "bottom-4 left-4"
            : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
      >
        {/* Close button */}
        <button
          onClick={() => { notifySkip(); onClose(); }}
          className="absolute right-2 top-2 rounded-sm p-1 text-muted-foreground/60 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Stäng"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-3">
          {/* Title */}
          <p className="pr-6 text-sm font-medium leading-snug">
            Hur tyckte du det gick i din senaste konversation?
          </p>

          {/* Link to conversation */}
          <Button
            variant="link"
            size="sm"
            onClick={handleViewConversation}
            className="h-auto p-0 text-xs"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            Visa konversationen
          </Button>

          {/* 5-star rating */}
          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-sm p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${value} stjärnor`}
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    value <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40"
                  )}
                />
              </button>
            ))}
          </div>

          {/* Text fields */}
          <div className="space-y-2">
            <Textarea
              placeholder="Vad var bra?"
              value={whatWasGood}
              onChange={(e) => setWhatWasGood(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
            />
            <Textarea
              placeholder="Vad kan göras bättre?"
              value={whatCanImprove}
              onChange={(e) => setWhatCanImprove(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { notifySkip(); onClose(); }}
              disabled={isSubmitting}
              className="flex-1 text-xs"
            >
              Hoppa över
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 text-xs"
            >
              {isSubmitting ? "Skickar..." : "Skicka"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
