import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

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

  const handleViewConversation = () => {
    navigate(`/global-assistant?conversationId=${conversationId}`);
    // Keep popup open so user can give feedback after viewing conversation
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-lg">
            Hur tyckte du det gick i din senaste konversation med Byggio AI?
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Link to conversation */}
          <Button
            variant="link"
            onClick={handleViewConversation}
            className="mx-auto flex items-center gap-1.5 text-sm"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Visa konversationen
          </Button>

          {/* 5-star rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-sm p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${value} stjärnor`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    value <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Text fields */}
          <div className="space-y-3">
            <Textarea
              placeholder="Vad var bra?"
              value={whatWasGood}
              onChange={(e) => setWhatWasGood(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <Textarea
              placeholder="Vad kan göras bättre?"
              value={whatCanImprove}
              onChange={(e) => setWhatCanImprove(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <AlertDialogFooter className="mt-4 flex-row gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Hoppa över
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Skickar..." : "Skicka"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
