import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SessionFeedbackPopupProps {
  open: boolean;
  trigger: "logout" | "inactivity";
  onComplete: () => void;
}

export function SessionFeedbackPopup({ open, trigger, onComplete }: SessionFeedbackPopupProps) {
  const [rating, setRating] = useState(0);
  const [whatWasGood, setWhatWasGood] = useState("");
  const [whatCanImprove, setWhatCanImprove] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(0);
      setWhatWasGood("");
      setWhatCanImprove("");
    }
  }, [open]);

  const sendWebhook = async (skipped: boolean) => {
    try {
      const { data } = await supabase.auth.getUser();
      let fullName: string | null = null;
      if (data.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle();
        fullName = profile?.full_name || null;
      }
      await fetch("https://datavox.app.n8n.cloud/webhook/feedbacksession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: data.user?.id || null,
          email: data.user?.email || null,
          full_name: fullName,
          rating: skipped ? null : rating,
          what_was_good: skipped ? null : whatWasGood.trim() || null,
          what_can_improve: skipped ? null : whatCanImprove.trim() || null,
          trigger,
          skipped,
          sent_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("Session feedback webhook error:", e);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await sendWebhook(false);
    setIsSubmitting(false);
    onComplete();
  };

  const handleSkip = async () => {
    // Send to skip-specific webhook
    try {
      const { data } = await supabase.auth.getUser();
      let fullName: string | null = null;
      if (data.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle();
        fullName = profile?.full_name || null;
      }
      await fetch("https://datavox.app.n8n.cloud/webhook/feedbacksessionnekad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: data.user?.id || null,
          email: data.user?.email || null,
          full_name: fullName,
          trigger,
          skipped_at: new Date().toISOString(),
        }),
      });
    } catch (e) {
      console.error("Skip webhook error:", e);
    }
    onComplete();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/80" />
      <div className="fixed z-[70] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 rounded-xl border border-border/60 bg-card p-4 shadow-lg">
        <button
          onClick={handleSkip}
          className="absolute right-2 top-2 rounded-sm p-1 text-muted-foreground/60 transition-colors hover:text-foreground focus:outline-none"
          aria-label="Stäng"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-3">
          <p className="pr-6 text-sm font-medium leading-snug">
            {trigger === "logout"
              ? "Innan du loggar ut – hur var din upplevelse?"
              : "Du har varit inaktiv ett tag – hur var din upplevelse?"}
          </p>

          <div className="flex justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-sm p-0.5 transition-transform hover:scale-110 focus:outline-none"
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

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 text-xs"
            >
              Hoppa över
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
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
