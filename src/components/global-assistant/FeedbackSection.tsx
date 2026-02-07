import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FeedbackSectionProps {
  taskType: string;
  conversationId?: string;
  onComplete?: () => void;
}

type FeedbackStep = "rating" | "comment" | "complete";

export function FeedbackSection({ taskType, conversationId, onComplete }: FeedbackSectionProps) {
  const [step, setStep] = useState<FeedbackStep>("rating");
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (skipComment = false) => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Du måste vara inloggad för att ge feedback");
        return;
      }

      const { error } = await supabase.from("ai_feedback").insert({
        user_id: user.id,
        conversation_id: conversationId || null,
        task_type: taskType,
        rating,
        comment: skipComment ? null : comment || null,
      });

      if (error) throw error;

      setStep("complete");
      onComplete?.();
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Kunde inte spara feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
    setStep("comment");
  };

  const handleSkip = () => {
    if (step === "rating") {
      setStep("complete");
      onComplete?.();
    } else {
      submitFeedback(true);
    }
  };

  const getCommentPrompt = () => {
    if (rating >= 4) {
      return "Vad var det du tyckte var så bra?";
    }
    return "Vad tyckte du var så mindre bra?";
  };

  if (step === "complete") {
    return (
      <div className="border-t border-border/40 pt-4 mt-4">
        <p className="text-sm text-muted-foreground text-center">
          ✓ Tack för din feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-border/40 pt-4 mt-4 space-y-3">
      {step === "rating" && (
        <>
          <p className="text-sm text-muted-foreground text-center">
            Hur nöjd är du med AI-assistenten?
          </p>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => handleRatingClick(value)}
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    value <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={handleSkip}
            >
              Hoppa över
            </Button>
          </div>
        </>
      )}

      {step === "comment" && (
        <>
          <div className="flex items-center justify-center gap-1 mb-2">
            <span className="text-sm text-muted-foreground">Tack!</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`h-4 w-4 ${
                    value <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/40"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {getCommentPrompt()}
          </p>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Skriv din kommentar här..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Hoppa över
            </Button>
            <Button
              size="sm"
              onClick={() => submitFeedback(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Skickar..." : "Skicka"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
