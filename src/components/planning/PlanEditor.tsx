import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GripVertical, AlertCircle, CalendarIcon, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanPhase } from "./GanttTimeline";
import { format, addWeeks, addDays } from "date-fns";
import { sv } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { VoiceInputOverlay } from "@/components/shared/VoiceInputOverlay";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AI_AGENTS } from "@/config/aiAgents";

interface PlanEditorProps {
  phases: PlanPhase[];
  totalWeeks: number;
  confidence: number;
  summary: string;
  startDate?: Date;
  onStartDateChange?: (date: Date | undefined) => void;
  onPhasesChange: (phases: PlanPhase[]) => void;
  onApprove: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const COLORS = [
  { value: "slate", label: "Grå" },
  { value: "blue", label: "Blå" },
  { value: "emerald", label: "Grön" },
  { value: "amber", label: "Gul" },
  { value: "purple", label: "Lila" },
  { value: "rose", label: "Rosa" },
  { value: "cyan", label: "Cyan" },
  { value: "orange", label: "Orange" },
];

const colorClasses: Record<string, string> = {
  slate: "bg-slate-200",
  blue: "bg-blue-100",
  emerald: "bg-emerald-100",
  amber: "bg-amber-100",
  purple: "bg-purple-100",
  rose: "bg-rose-100",
  cyan: "bg-cyan-100",
  orange: "bg-orange-100",
};

// Calculate end date (Friday after X weeks from start)
const getEndDate = (start: Date, weeks: number): Date => {
  const lastWeekStart = addWeeks(start, weeks - 1);
  return addDays(lastWeekStart, 4); // Monday + 4 = Friday
};

export function PlanEditor({
  phases,
  totalWeeks,
  confidence,
  summary,
  startDate,
  onStartDateChange,
  onPhasesChange,
  onApprove,
  onCancel,
  isLoading,
}: PlanEditorProps) {
  const [editingPhases, setEditingPhases] = useState<PlanPhase[]>(phases);
  const [isApplyingVoice, setIsApplyingVoice] = useState(false);

  const handlePhaseChange = (index: number, field: keyof PlanPhase, value: string | number) => {
    const updated = [...editingPhases];
    updated[index] = { ...updated[index], [field]: value };
    setEditingPhases(updated);
    onPhasesChange(updated);
  };

  const handleAddPhase = () => {
    const lastPhase = editingPhases[editingPhases.length - 1];
    const newStartWeek = lastPhase ? lastPhase.start_week + lastPhase.duration_weeks : 1;
    const newPhase: PlanPhase = {
      name: "Ny fas",
      start_week: newStartWeek,
      duration_weeks: 1,
      color: COLORS[editingPhases.length % COLORS.length].value,
    };
    const updated = [...editingPhases, newPhase];
    setEditingPhases(updated);
    onPhasesChange(updated);
  };

  const handleRemovePhase = (index: number) => {
    const updated = editingPhases.filter((_, i) => i !== index);
    setEditingPhases(updated);
    onPhasesChange(updated);
  };

  const handleVoiceEdit = async (transcript: string) => {
    setIsApplyingVoice(true);
    try {
      const { data: updatedData, error } = await supabase.functions.invoke("apply-voice-edits", {
        body: {
          transcript,
          currentData: { phases: editingPhases, totalWeeks, startDate },
          documentType: "planning",
        },
      });

      if (error) throw error;

      if (updatedData?.phases) {
        setEditingPhases(updatedData.phases);
        onPhasesChange(updatedData.phases);
        toast.success("Ändringar applicerade");
      }
    } catch (error: any) {
      console.error("Voice edit error:", error);
      toast.error("Kunde inte applicera ändringar");
    } finally {
      setIsApplyingVoice(false);
    }
  };

  const confidenceColor = confidence >= 0.8 ? "text-emerald-600" : confidence >= 0.5 ? "text-amber-600" : "text-rose-600";
  
  const endDate = startDate ? getEndDate(startDate, totalWeeks) : undefined;

  return (
    <div className="space-y-6">
      {/* Summary & Confidence */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Tolkad planering</h3>
              <p className="text-sm text-muted-foreground">{summary}</p>
            </div>
            <div className="flex items-center gap-2">
              {confidence < 0.7 && (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <Badge variant="secondary" className={cn("font-mono", confidenceColor)}>
                {Math.round(confidence * 100)}% säkerhet
              </Badge>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm">
              <span className="font-medium">Uppskattad total tid:</span>{" "}
              <span className="text-muted-foreground">ca {totalWeeks} veckor</span>
            </p>
          </div>
          
          {/* Date picker section */}
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Projektstart (måndag)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "d MMM yyyy", { locale: sv }) : "Välj startdatum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date && onStartDateChange) {
                        // Always set to Monday of the selected week
                        const day = date.getDay();
                        const diff = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
                        const monday = new Date(date);
                        monday.setDate(date.getDate() + (day === 1 ? 0 : diff - (day > 1 ? day - 1 : 0)));
                        // Simpler: just get the Monday of the week
                        const mondayOfWeek = new Date(date);
                        const dayOfWeek = date.getDay();
                        const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                        mondayOfWeek.setDate(date.getDate() + daysToMonday);
                        onStartDateChange(mondayOfWeek);
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Beräknat slutdatum (fredag)</Label>
              <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/50 flex items-center text-sm">
                {endDate ? format(endDate, "d MMM yyyy", { locale: sv }) : "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Moment</Label>
          <Button variant="outline" size="sm" onClick={handleAddPhase}>
            <Plus className="h-4 w-4 mr-1" />
            Lägg till
          </Button>
        </div>

        {editingPhases.map((phase, index) => (
          <Card key={index} className="group">
            <CardContent className="py-3 px-3 sm:px-4">
              {/* Mobile: stacked layout */}
              <div className="sm:hidden space-y-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full flex-shrink-0", colorClasses[phase.color])} />
                  <Input
                    value={phase.name}
                    onChange={(e) => handlePhaseChange(index, "name", e.target.value)}
                    className="flex-1 h-9"
                    placeholder="Momentnamn"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRemovePhase(index)}
                    disabled={editingPhases.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Start</Label>
                    <Input
                      type="number"
                      min={1}
                      value={phase.start_week}
                      onChange={(e) => handlePhaseChange(index, "start_week", parseInt(e.target.value) || 1)}
                      className="h-9 text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Längd</Label>
                    <Input
                      type="number"
                      min={1}
                      value={phase.duration_weeks}
                      onChange={(e) => handlePhaseChange(index, "duration_weeks", parseInt(e.target.value) || 1)}
                      className="h-9 text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Färg</Label>
                    <Select
                      value={phase.color}
                      onValueChange={(value) => handlePhaseChange(index, "color", value)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div className={cn("w-3 h-3 rounded-full", colorClasses[color.value])} />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Desktop: horizontal layout */}
              <div className="hidden sm:flex items-center gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
                
                {/* Color indicator */}
                <div className={cn("w-3 h-3 rounded-full flex-shrink-0", colorClasses[phase.color])} />

                {/* Name */}
                <Input
                  value={phase.name}
                  onChange={(e) => handlePhaseChange(index, "name", e.target.value)}
                  className="flex-1 h-8"
                  placeholder="Momentnamn"
                />

                {/* Start week */}
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Start</Label>
                  <Input
                    type="number"
                    min={1}
                    value={phase.start_week}
                    onChange={(e) => handlePhaseChange(index, "start_week", parseInt(e.target.value) || 1)}
                    className="w-16 h-8 text-center"
                  />
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Längd</Label>
                  <Input
                    type="number"
                    min={1}
                    value={phase.duration_weeks}
                    onChange={(e) => handlePhaseChange(index, "duration_weeks", parseInt(e.target.value) || 1)}
                    className="w-16 h-8 text-center"
                  />
                  <span className="text-xs text-muted-foreground">v</span>
                </div>

                {/* Color */}
                <Select
                  value={phase.color}
                  onValueChange={(value) => handlePhaseChange(index, "color", value)}
                >
                  <SelectTrigger className="w-24 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", colorClasses[color.value])} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => handleRemovePhase(index)}
                  disabled={editingPhases.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Voice prompt with Bo avatar */}
      <div 
        className="flex items-center gap-4 p-4 bg-primary/5 border border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
        onClick={() => {
          const voiceButton = document.querySelector('[data-voice-trigger]') as HTMLButtonElement;
          if (voiceButton) voiceButton.click();
        }}
      >
        <img 
          src={AI_AGENTS.planning.avatar}
          alt="Bo AI"
          className="w-16 h-16 rounded-full object-cover border-2 border-primary/30 shadow-md"
        />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary">
            <Mic className="h-5 w-5" />
            <span className="font-medium">Låt Bo AI hjälpa dig</span>
          </div>
          <span className="text-sm text-muted-foreground">Beskriv ändringar med rösten</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Tillbaka
        </Button>
        <Button onClick={onApprove} disabled={isLoading || editingPhases.length === 0}>
          {isLoading ? "Sparar..." : "Godkänn planering"}
        </Button>
      </div>

      <VoiceInputOverlay
        onTranscriptComplete={handleVoiceEdit}
        isProcessing={isApplyingVoice}
        agentName="Bo AI"
        agentAvatar={AI_AGENTS.planning.avatar}
      />
    </div>
  );
}
