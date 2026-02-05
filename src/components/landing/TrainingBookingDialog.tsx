import { useState } from "react";
import { format, addDays, isWeekend, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { ArrowRight, Loader2, CheckCircle } from "lucide-react";
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

const WEBHOOK_URL = "https://datavox.app.n8n.cloud/webhook/utbildning";

const timeSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"];

const bookingSchema = z.object({
  name: z.string().min(2, "Ange ditt namn").max(100),
  email: z.string().email("Ange en giltig e-postadress").max(255),
  phone: z.string().min(6, "Ange ditt telefonnummer").max(20),
  training_duration: z.enum(["30 min", "60 min"]),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface TrainingBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TrainingBookingDialog = ({ open, onOpenChange }: TrainingBookingDialogProps) => {
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
    defaultValues: {
      training_duration: "30 min",
    },
  });

  const trainingDuration = watch("training_duration");

  // Generate next 14 weekdays
  const getAvailableDays = () => {
    const days: Date[] = [];
    let currentDate = addDays(new Date(), 1); // Start from tomorrow
    
    while (days.length < 10) {
      if (!isWeekend(currentDate)) {
        days.push(currentDate);
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  };

  const availableDays = getAvailableDays();

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
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Webhook request failed");
      }

      setIsSuccess(true);
      
      // Reset after 3 seconds and close
      setTimeout(() => {
        setIsSuccess(false);
        reset();
        setSelectedDate(null);
        setSelectedTime(null);
        onOpenChange(false);
      }, 3000);
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

  const handleClose = (open: boolean) => {
    if (!open) {
      reset();
      setSelectedDate(null);
      setSelectedTime(null);
      setIsSuccess(false);
    }
    onOpenChange(open);
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Tack för din bokning!</h3>
            <p className="text-muted-foreground">
              Vi ringer dig {selectedDate && format(selectedDate, "EEEE d MMMM", { locale: sv })} kl {selectedTime}.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Boka din gratis utbildning</DialogTitle>
        </DialogHeader>

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
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
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
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
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
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Training duration */}
          <div className="space-y-3">
            <Label>Utbildningslängd</Label>
            <RadioGroup
              value={trainingDuration}
              onValueChange={(value) => setValue("training_duration", value as "30 min" | "60 min")}
              className="grid grid-cols-2 gap-3"
            >
              <label
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border-2 cursor-pointer transition-all",
                  trainingDuration === "30 min"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <RadioGroupItem value="30 min" className="sr-only" />
                <span className="font-medium text-foreground">30 min</span>
                <span className="text-sm text-muted-foreground">Snabbstart</span>
              </label>
              <label
                className={cn(
                  "flex flex-col items-start p-4 rounded-xl border-2 cursor-pointer transition-all",
                  trainingDuration === "60 min"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <RadioGroupItem value="60 min" className="sr-only" />
                <span className="font-medium text-foreground">60 min</span>
                <span className="text-sm text-muted-foreground">Djupdykning</span>
              </label>
            </RadioGroup>
          </div>

          {/* Date selection */}
          <div className="space-y-3">
            <Label>Välj dag</Label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {availableDays.map((day) => (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    setSelectedDate(day);
                    setSelectedTime(null);
                  }}
                  className={cn(
                    "flex flex-col items-center min-w-[60px] p-3 rounded-xl border-2 transition-all",
                    selectedDate && isSameDay(selectedDate, day)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <span className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE", { locale: sv })}
                  </span>
                  <span className="text-lg font-semibold text-foreground">
                    {format(day, "d")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(day, "MMM", { locale: sv })}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Time selection */}
          {selectedDate && (
            <div className="space-y-3">
              <Label>Välj tid</Label>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "p-3 rounded-xl border-2 font-medium transition-all",
                      selectedTime === time
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/30 text-foreground"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

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
      </DialogContent>
    </Dialog>
  );
};

export default TrainingBookingDialog;
