import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { sv } from "date-fns/locale";
import { Check, CheckCircle2, Circle, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AttestationViewProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function AttestationView({ selectedMonth, onMonthChange }: AttestationViewProps) {
  const queryClient = useQueryClient();
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  const periodStart = startOfMonth(selectedMonth);
  const periodEnd = endOfMonth(selectedMonth);

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return startOfMonth(date);
  });

  // Fetch time entries for the period
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["attestation-entries", format(periodStart, "yyyy-MM")],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          id,
          user_id,
          date,
          hours,
          status,
          description,
          salary_types:salary_type_id(name, abbreviation),
          projects:project_id(name)
        `)
        .eq("employer_id", userData.user.id)
        .gte("date", format(periodStart, "yyyy-MM-dd"))
        .lte("date", format(periodEnd, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch employees for mapping
  const { data: employees = [] } = useQuery({
    queryKey: ["employees-for-attestation"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data, error } = await supabase
        .from("employees")
        .select("id, name, linked_user_id")
        .eq("user_id", userData.user.id);

      if (error) throw error;
      return data || [];
    },
  });

  // Attest mutation
  const attestMutation = useMutation({
    mutationFn: async (entryIds: string[]) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Ej inloggad");

      const { error } = await supabase
        .from("time_entries")
        .update({
          status: "attesterad",
          attested_by: userData.user.id,
          attested_at: new Date().toISOString(),
        })
        .in("id", entryIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attestation-entries"] });
      setSelectedEntries(new Set());
      toast.success("Tidposter attesterade");
    },
    onError: (error: Error) => {
      toast.error("Kunde inte attestera", { description: error.message });
    },
  });

  // Group entries by employee
  const entriesByEmployee = new Map<string, any[]>();
  const employeeByUserId = new Map<string, any>();
  
  employees.forEach((emp: any) => {
    if (emp.linked_user_id) {
      employeeByUserId.set(emp.linked_user_id, emp);
    }
  });

  entries.forEach((entry: any) => {
    const employee = employeeByUserId.get(entry.user_id);
    const key = employee?.name || "Mig själv";
    if (!entriesByEmployee.has(key)) {
      entriesByEmployee.set(key, []);
    }
    entriesByEmployee.get(key)!.push(entry);
  });

  const toggleEntry = (id: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEntries(newSelected);
  };

  const toggleAll = () => {
    const unattested = entries.filter((e: any) => e.status !== "attesterad");
    if (selectedEntries.size === unattested.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(unattested.map((e: any) => e.id)));
    }
  };

  const attestSelected = () => {
    if (selectedEntries.size === 0) return;
    attestMutation.mutate(Array.from(selectedEntries));
  };

  const unattestedCount = entries.filter((e: any) => e.status !== "attesterad").length;
  const attestedCount = entries.filter((e: any) => e.status === "attesterad").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "attesterad":
        return <Badge variant="success" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Attesterad</Badge>;
      case "skickad":
        return <Badge variant="warning" className="text-xs">Skickad</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs"><Circle className="h-3 w-3 mr-1" />Skapad</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
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
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{entries.length} poster</Badge>
            <Badge variant="success">{attestedCount} attesterade</Badge>
            {unattestedCount > 0 && (
              <Badge variant="secondary">{unattestedCount} oattesterade</Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unattestedCount > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={toggleAll}>
                {selectedEntries.size === unattestedCount ? "Avmarkera alla" : "Markera alla"}
              </Button>
              <Button
                size="sm"
                onClick={attestSelected}
                disabled={selectedEntries.size === 0 || attestMutation.isPending}
              >
                {attestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Attestera valda ({selectedEntries.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Entries grouped by employee */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Inga tidposter för denna period
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(entriesByEmployee).map(([employeeName, employeeEntries]) => {
            const empTotalHours = employeeEntries.reduce((sum: number, e: any) => sum + Number(e.hours), 0);
            const empAttested = employeeEntries.filter((e: any) => e.status === "attesterad").length;

            return (
              <Card key={employeeName}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {employeeName}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {empTotalHours.toFixed(1)}h totalt
                      </span>
                      <Badge variant={empAttested === employeeEntries.length ? "success" : "secondary"}>
                        {empAttested}/{employeeEntries.length} attesterade
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {employeeEntries.map((entry: any) => {
                      const isAttested = entry.status === "attesterad";
                      const isSelected = selectedEntries.has(entry.id);

                      return (
                        <div
                          key={entry.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            isAttested ? "bg-muted/30" : isSelected ? "bg-primary/5 border-primary/30" : "hover:bg-muted/30"
                          }`}
                        >
                          {!isAttested && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleEntry(entry.id)}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {format(new Date(entry.date), "d MMM", { locale: sv })}
                              </span>
                              <span className="text-muted-foreground text-sm">
                                {entry.projects?.name || "Okänt projekt"}
                              </span>
                              {entry.salary_types?.abbreviation && (
                                <Badge variant="outline" className="text-xs">
                                  {entry.salary_types.abbreviation}
                                </Badge>
                              )}
                            </div>
                            {entry.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {entry.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-sm">
                              {Number(entry.hours).toFixed(1)}h
                            </span>
                            {getStatusBadge(entry.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
