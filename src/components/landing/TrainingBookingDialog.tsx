import { useMemo, useState } from "react";
import { addDays, format, isSameDay, isWeekend } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import BookingSuccess from "./booking/BookingSuccess";

const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

const bookingSchema = z.object({
  name: z.string().trim().min(2, "Ange ditt namn").max(100),
  email: z.string().trim().email("Ange en giltig e-postadress").max(255),
  phone: z.string().trim().min(6, "Ange ditt telefonnummer").max(20),
  training_duration: z.enum(["30 min", "60 min"]),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface TrainingBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DurationCard({
  value,
  title,
  subtitle,
  selected,
}: {
  value: "30 min" | "60 min";
  title: string;
  subtitle: string;
  selected: boolean;
}) {
  return (
    <label
      className={cn(
        "relative flex flex-col items-start p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all",
        "focus-within:ring-2 focus-within:ring-primary/15 focus-within:border-primary/40",
        selected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/30 bg-card",
      )}
    >
      <RadioGroupItem value={value} className="sr-only" />
      <span className="text-lg font-semibold text-foreground leading-none">{value}</span>
      <span className="text-sm text-muted-foreground mt-1">{title}</span>
      <span className="text-xs text-muted-foreground/80 mt-2">{subtitle}</span>
    </label>
  );
}

function DayPill({
  day,
  selected,
  onSelect,
}: {
  day: Date;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center min-w-[64px] p-3 rounded-2xl border-2 transition-all",
        selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/30 bg-card",
      )}
    >
      <span className="text-xs text-muted-foreground uppercase">{format(day, "EEE", { locale: sv })}</span>
      <span className="text-lg font-semibold text-foreground">{format(day, "d")}</span>
      <span className="text-xs text-muted-foreground">{format(day, "MMM", { locale: sv })}</span>
    </button>
  );
}

function TimeButton({
  time,
  selected,
  disabled,
  onSelect,
}: {
  time: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "p-3 rounded-2xl border-2 font-medium transition-all",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "hover:border-primary/30",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-foreground bg-card",
      )}
    >
      {time}
    </button>
  );
}

export default function TrainingBookingDialog({ open, onOpenChange }: TrainingBookingDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { training_duration: "30 min" },
  });

  const trainingDuration = watch("training_duration");

  const availableDays = useMemo(() => {
    const days: Date[] = [];
    let currentDate = addDays(new Date(), 1);

    while (days.length < 10) {
      if (!isWeekend(currentDate)) days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return days;
  }, []);

  const preferredLabel = useMemo(() => {
    if (!selectedDate || !selectedTime) return "";
    const dayLabel = format(selectedDate, "EEEE d MMMM", { locale: sv });
    return `${dayLabel} kl ${selectedTime}`;
  }, [selectedDate, selectedTime]);

  const closeAndReset = () => {
    reset();
    setSelectedDate(null);
    setSelectedTime(null);
    setIsSubmitting(false);
    setIsSuccess(false);
    onOpenChange(false);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) closeAndReset();
    else onOpenChange(true);
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Välj datum och tid",
        description: "Du måste välja en dag och tid för att boka.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      training_duration: data.training_duration,
      preferred_date: format(selectedDate, "yyyy-MM-dd"),
      preferred_time: selectedTime,
      requested_at: new Date().toISOString(),
    };

    try {
      const { data: res, error } = await supabase.functions.invoke("training-booking", {
        body: payload,
      });

      if (error) throw error;
      if (!res?.ok) {
        // Edge function returns { ok: true } on success
        throw new Error("Booking failed");
      }

      setIsSuccess(true);
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Något gick fel",
        description: "Kunde inte skicka bokningen. Försök igen.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Boka din gratis utbildning</DialogTitle>
        </DialogHeader>

        {isSuccess ? (
          <BookingSuccess preferredLabel={preferredLabel} onClose={closeAndReset} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
            {/* Personal details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Namn</Label>
                <Input
                  id="name"
                  placeholder="Ditt namn"
                  {...register("name")}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.se"
                  {...register("email")}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="070-123 45 67"
                  {...register("phone")}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Training duration */}
            <div className="space-y-3">
              <Label>Utbildningslängd</Label>
              <RadioGroup
                value={trainingDuration}
                onValueChange={(value) => setValue("training_duration", value as "30 min" | "60 min")}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <DurationCard
                  value="30 min"
                  title="Snabbstart"
                  subtitle="Perfekt för att komma igång direkt"
                  selected={trainingDuration === "30 min"}
                />
                <DurationCard
                  value="60 min"
                  title="Djupdykning"
                  subtitle="För dig som vill gå igenom allt + Q&A"
                  selected={trainingDuration === "60 min"}
                />
              </RadioGroup>
            </div>

            {/* Date selection */}
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <Label>Välj dag</Label>
                {!selectedDate && (
                  <span className="text-xs text-muted-foreground">Obligatoriskt</span>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {availableDays.map((day) => (
                  <DayPill
                    key={day.toISOString()}
                    day={day}
                    selected={!!selectedDate && isSameDay(selectedDate, day)}
                    onSelect={() => {
                      setSelectedDate(day);
                      setSelectedTime(null);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Time selection (always visible) */}
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <Label>Välj tid</Label>
                {!selectedTime && (
                  <span className="text-xs text-muted-foreground">Obligatoriskt</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => (
                  <TimeButton
                    key={time}
                    time={time}
                    disabled={!selectedDate}
                    selected={selectedTime === time}
                    onSelect={() => setSelectedTime(time)}
                  />
                ))}
              </div>
              {!selectedDate && (
                <p className="text-xs text-muted-foreground">Välj en dag för att aktivera tiderna.</p>
              )}
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={isSubmitting || !selectedDate || !selectedTime}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Skickar...
                </>
              ) : (
                <>
                  Boka utbildning
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
