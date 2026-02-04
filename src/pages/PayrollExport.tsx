import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { sv } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  FileText,
  Loader2,
  Clock,
  Users,
  FileSpreadsheet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AttestationView } from "@/components/time-reporting/AttestationView";
import { PeriodLockView } from "@/components/time-reporting/PeriodLockView";
import { validatePayrollExport, type ValidationResult, type TimeEntryForExport } from "@/lib/validatePayrollExport";
import { generateTluFile, downloadTluFile, generateTluFilename } from "@/lib/generateTluFile";
import { downloadPayrollPdf } from "@/lib/generatePayrollPdf";

export default function PayrollExport() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [activeTab, setActiveTab] = useState("export");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validatedEntries, setValidatedEntries] = useState<TimeEntryForExport[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const periodStart = startOfMonth(selectedMonth);
  const periodEnd = endOfMonth(selectedMonth);

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return startOfMonth(date);
  });

  // Fetch period status
  const { data: period } = useQuery({
    queryKey: ["payroll-period", format(periodStart, "yyyy-MM")],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data } = await supabase
        .from("payroll_periods")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("period_start", format(periodStart, "yyyy-MM-dd"))
        .maybeSingle();

      return data;
    },
  });

  // Fetch company settings
  const { data: companySettings } = useQuery({
    queryKey: ["company-settings-export"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data } = await supabase
        .from("company_settings")
        .select("company_name, organization_name")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      return data;
    },
  });

  // Fetch export history
  const { data: exports = [] } = useQuery({
    queryKey: ["payroll-exports", format(periodStart, "yyyy-MM")],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return [];

      const { data } = await supabase
        .from("payroll_exports")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("exported_at", { ascending: false })
        .limit(10);

      return data || [];
    },
  });

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const { result, entries } = await validatePayrollExport(
        periodStart,
        periodEnd,
        period?.status || "open"
      );
      setValidationResult(result);
      setValidatedEntries(entries);
    } catch (error: any) {
      toast.error("Valideringsfel", { description: error.message });
    } finally {
      setIsValidating(false);
    }
  };

  // Export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!validationResult?.valid || validatedEntries.length === 0) {
        throw new Error("Validering krävs före export");
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Ej inloggad");

      // Generate export ID
      const exportId = crypto.randomUUID();
      const filename = generateTluFilename(periodStart, periodEnd);

      // Generate and download TLU file
      const tluBlob = generateTluFile({
        entries: validatedEntries,
        periodStart,
        periodEnd,
        exportId,
      });
      downloadTluFile(tluBlob, filename);

      // Generate and download PDF
      await downloadPayrollPdf({
        entries: validatedEntries,
        validation: validationResult,
        periodStart,
        periodEnd,
        exportId,
        companyName: companySettings?.company_name || companySettings?.organization_name,
      });

      // Record export in database
      const { error: exportError } = await supabase
        .from("payroll_exports")
        .insert({
          user_id: userData.user.id,
          period_id: period?.id,
          file_name: filename,
          entry_count: validationResult.summary.totalEntries,
          total_hours: validationResult.summary.totalHours,
          employee_count: validationResult.summary.employeeCount,
        });

      if (exportError) throw exportError;

      // Update period status to exported
      if (period) {
        await supabase
          .from("payroll_periods")
          .update({ status: "exported" })
          .eq("id", period.id);
      }

      // Mark entries as exported
      const entryIds = validatedEntries.map((e) => e.id);
      await supabase
        .from("time_entries")
        .update({ export_id: exportId })
        .in("id", entryIds);

      return { exportId, filename };
    },
    onSuccess: ({ filename }) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-exports"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-period"] });
      toast.success("Export klar!", {
        description: `${filename} och PDF-underlag har laddats ner`,
      });
    },
    onError: (error: Error) => {
      toast.error("Exportfel", { description: error.message });
    },
  });

  const isLocked = period?.status === "locked" || period?.status === "exported";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Löneexport
        </h1>
        <p className="text-muted-foreground">
          Exportera tidsunderlag till Visma Lön 300
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="attestation">Attestering</TabsTrigger>
          <TabsTrigger value="periods">Perioder</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6 mt-6">
          {/* Period selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Välj period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
                <Select
                  value={format(selectedMonth, "yyyy-MM")}
                  onValueChange={(val) => {
                    setSelectedMonth(new Date(val + "-01"));
                    setValidationResult(null);
                  }}
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

                <Badge variant={isLocked ? "success" : "secondary"}>
                  {period?.status === "exported"
                    ? "Exporterad"
                    : isLocked
                    ? "Låst"
                    : "Öppen"}
                </Badge>

                <Button onClick={handleValidate} disabled={isValidating} variant="outline">
                  {isValidating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Validera
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Validation result */}
          {validationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {validationResult.valid ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Validering OK
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      Valideringsfel
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {format(periodStart, "d MMMM", { locale: sv })} -{" "}
                  {format(periodEnd, "d MMMM yyyy", { locale: sv })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xl font-bold">{validationResult.summary.totalEntries}</div>
                      <div className="text-xs text-muted-foreground">Tidposter</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xl font-bold">
                        {validationResult.summary.totalHours.toFixed(1)}h
                      </div>
                      <div className="text-xs text-muted-foreground">Totalt</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xl font-bold">
                        {validationResult.summary.employeeCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Anställda</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xl font-bold">
                        {Object.keys(validationResult.summary.entriesByTimeType).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Tidtyper</div>
                    </div>
                  </div>
                </div>

                {/* Errors */}
                {validationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Fel ({validationResult.errors.length})
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {validationResult.errors.map((error, i) => (
                        <div
                          key={i}
                          className="text-sm p-2 bg-destructive/10 text-destructive rounded"
                        >
                          {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Varningar ({validationResult.warnings.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {validationResult.warnings.map((warning, i) => (
                        <div
                          key={i}
                          className="text-sm p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded"
                        >
                          {warning.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export button */}
                <div className="flex justify-end">
                  <Button
                    size="lg"
                    onClick={() => exportMutation.mutate()}
                    disabled={!validationResult.valid || exportMutation.isPending}
                  >
                    {exportMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Ladda ner .TLU + PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export history */}
          {exports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Exporthistorik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {exports.map((exp: any) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <div className="font-medium text-sm">{exp.file_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(exp.exported_at), "d MMM yyyy HH:mm", { locale: sv })}
                          {" • "}
                          {exp.entry_count} poster, {exp.total_hours?.toFixed(1)}h
                        </div>
                      </div>
                      <Badge variant="outline">{exp.employee_count} anställda</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="attestation" className="mt-6">
          <AttestationView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </TabsContent>

        <TabsContent value="periods" className="mt-6">
          <PeriodLockView
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
