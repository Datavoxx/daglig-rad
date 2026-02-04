import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { sv } from "date-fns/locale";
import { Lock, Unlock, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface PeriodLockViewProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function PeriodLockView({ selectedMonth, onMonthChange }: PeriodLockViewProps) {
  const queryClient = useQueryClient();
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);

  const periodStart = startOfMonth(selectedMonth);
  const periodEnd = endOfMonth(selectedMonth);

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return startOfMonth(date);
  });

  // Fetch period status
  const { data: period, isLoading: periodLoading } = useQuery({
    queryKey: ["payroll-period", format(periodStart, "yyyy-MM")],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from("payroll_periods")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("period_start", format(periodStart, "yyyy-MM-dd"))
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch time entry stats for period
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["period-stats", format(periodStart, "yyyy-MM")],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data: entries, error } = await supabase
        .from("time_entries")
        .select("id, hours, status, user_id")
        .eq("employer_id", userData.user.id)
        .gte("date", format(periodStart, "yyyy-MM-dd"))
        .lte("date", format(periodEnd, "yyyy-MM-dd"));

      if (error) throw error;

      const total = entries?.length || 0;
      const attested = entries?.filter((e) => e.status === "attesterad").length || 0;
      const totalHours = entries?.reduce((sum, e) => sum + Number(e.hours), 0) || 0;
      const uniqueEmployees = new Set(entries?.map((e) => e.user_id)).size;

      return { total, attested, totalHours, uniqueEmployees };
    },
  });

  // Lock period mutation
  const lockMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Ej inloggad");

      // Check if all entries are attested
      if (stats && stats.attested < stats.total) {
        throw new Error("Alla tidposter måste vara attesterade innan perioden kan låsas");
      }

      // Upsert period
      const { error } = await supabase
        .from("payroll_periods")
        .upsert({
          user_id: userData.user.id,
          period_start: format(periodStart, "yyyy-MM-dd"),
          period_end: format(periodEnd, "yyyy-MM-dd"),
          status: "locked",
          locked_at: new Date().toISOString(),
          locked_by: userData.user.id,
        }, {
          onConflict: "user_id,period_start,period_end",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-period"] });
      toast.success("Period låst");
    },
    onError: (error: Error) => {
      toast.error("Kunde inte låsa period", { description: error.message });
    },
  });

  // Unlock period mutation
  const unlockMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Ej inloggad");

      const { error } = await supabase
        .from("payroll_periods")
        .update({
          status: "open",
          locked_at: null,
          locked_by: null,
        })
        .eq("user_id", userData.user.id)
        .eq("period_start", format(periodStart, "yyyy-MM-dd"));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-period"] });
      setUnlockDialogOpen(false);
      toast.success("Period upplåst");
    },
    onError: (error: Error) => {
      toast.error("Kunde inte låsa upp period", { description: error.message });
    },
  });

  const isLoading = periodLoading || statsLoading;
  const isLocked = period?.status === "locked" || period?.status === "exported";
  const isExported = period?.status === "exported";
  const canLock = stats && stats.attested === stats.total && stats.total > 0;

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Select
          value={format(selectedMonth, "yyyy-MM")}
          onValueChange={(val) => onMonthChange(new Date(val + "-01"))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((date) => (
              <SelectItem key={date.toISOString()} value={format(date, "yyyy-MM")}>
                {format(date, "MMMM yyyy", { locale: sv })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {format(periodStart, "MMMM yyyy", { locale: sv })}
                </CardTitle>
                <CardDescription>
                  {format(periodStart, "d MMM", { locale: sv })} - {format(periodEnd, "d MMM yyyy", { locale: sv })}
                </CardDescription>
              </div>
              <Badge
                variant={isExported ? "default" : isLocked ? "success" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {isExported ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Exporterad
                  </>
                ) : isLocked ? (
                  <>
                    <Lock className="h-4 w-4 mr-1" />
                    Låst
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-1" />
                    Öppen
                  </>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <div className="text-xs text-muted-foreground">Tidposter</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{stats?.attested || 0}</div>
                <div className="text-xs text-muted-foreground">Attesterade</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{stats?.totalHours?.toFixed(1) || 0}h</div>
                <div className="text-xs text-muted-foreground">Totalt timmar</div>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold">{stats?.uniqueEmployees || 0}</div>
                <div className="text-xs text-muted-foreground">Anställda</div>
              </div>
            </div>

            {/* Status message */}
            {!isLocked && stats && stats.attested < stats.total && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Inte alla poster är attesterade
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {stats.total - stats.attested} av {stats.total} poster saknar attestering.
                    Alla poster måste attesteras innan perioden kan låsas.
                  </p>
                </div>
              </div>
            )}

            {isLocked && period?.locked_at && (
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                <Lock className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Perioden är låst
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Låst {format(new Date(period.locked_at), "d MMMM yyyy 'kl' HH:mm", { locale: sv })}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              {isLocked && !isExported ? (
                <Button
                  variant="outline"
                  onClick={() => setUnlockDialogOpen(true)}
                  disabled={unlockMutation.isPending}
                >
                  {unlockMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Unlock className="h-4 w-4 mr-2" />
                  )}
                  Lås upp period
                </Button>
              ) : !isLocked ? (
                <Button
                  onClick={() => lockMutation.mutate()}
                  disabled={!canLock || lockMutation.isPending}
                >
                  {lockMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  Lås period
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unlock confirmation dialog */}
      <AlertDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lås upp perioden?</AlertDialogTitle>
            <AlertDialogDescription>
              Om du låser upp perioden kan tidposter ändras och attesteringar upphävas.
              Du kommer behöva låsa perioden igen innan export.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() => unlockMutation.mutate()}>
              Lås upp
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
