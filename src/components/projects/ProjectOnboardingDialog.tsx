import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarIcon, Link2, CalendarDays, X, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProjectOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  estimateTotal?: number | null;
  onComplete: () => void;
  onNavigatePlanning: () => void;
}

export function ProjectOnboardingDialog({
  open,
  onOpenChange,
  projectId,
  estimateTotal,
  onComplete,
  onNavigatePlanning,
}: ProjectOnboardingDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleLinkToEstimate = () => {
    if (estimateTotal) {
      setBudget(Math.round(estimateTotal).toString());
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("projects")
      .update({
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        budget: budget ? parseFloat(budget) : null,
      })
      .eq("id", projectId);

    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Projektdata sparad" });
      setStep(3);
      onComplete();
    }
    setSaving(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-lg">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Start- och slutdatum
              </DialogTitle>
              <DialogDescription>
                Ange projektets planerade start- och slutdatum
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Startdatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: sv }) : "Välj startdatum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Slutdatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: sv }) : "Välj slutdatum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Hoppa över</Button>
              <Button onClick={() => setStep(2)}>
                Nästa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Budget</DialogTitle>
              <DialogDescription>
                Ange projektets budget
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Budget (kr)</Label>
                <Input
                  type="number"
                  placeholder="Ange budget..."
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
              {estimateTotal && estimateTotal > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={handleLinkToEstimate}
                >
                  <Link2 className="h-4 w-4" />
                  Koppla till offertbelopp ({new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(estimateTotal)})
                </Button>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Tillbaka</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Sparar..." : "Klar"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Dags att skapa en planering!
              </DialogTitle>
              <DialogDescription>
                Skapa en planering för ditt projekt för att hålla koll på alla faser och milstolpar.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose}>
                <X className="mr-2 h-4 w-4" />
                Inte nu
              </Button>
              <Button onClick={() => { handleClose(); onNavigatePlanning(); }}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Skapa planering
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
