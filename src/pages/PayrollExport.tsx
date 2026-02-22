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
  Lock,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AttestationView } from "@/components/time-reporting/AttestationView";
import { PeriodLockView } from "@/components/time-reporting/PeriodLockView";
import { validatePayrollExport, type ValidationResult, type TimeEntryForExport, type PayrollProvider } from "@/lib/validatePayrollExport";
import { generateTluFile, downloadTluFile, generateTluFilename } from "@/lib/generateTluFile";
import { generatePaXmlFile, downloadPaXmlFile, generatePaXmlFilename } from "@/lib/generatePaXmlFile";
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
        .select("company_name, organization_name, org_number, payroll_provider")
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

  // Quick status check (without full validation)
  const { data: statusCheck } = useQuery({
    queryKey: ["payroll-status-check", format(periodStart, "yyyy-MM")],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const startStr = format(periodStart, "yyyy-MM-dd");
      const endStr = format(periodEnd, "yyyy-MM-dd");

      const { data: entries } = await supabase
        .from("time_entries")
        .select("id, status, salary_type_id")
        .eq("employer_id", userData.user.id)
        .gte("date", startStr)
        .lte("date", endStr);

      if (!entries) return { total: 0, attested: 0, withSalaryType: 0 };

      return {
        total: entries.length,
        attested: entries.filter(e => e.status === "attesterad").length,
        withSalaryType: entries.filter(e => e.salary_type_id).length,
      };
    },
  });

  const handleValidateAndExport = async (provider: PayrollProvider) => {
    setIsValidating(true);
    setValidationResult(null);

    try {
      const { result, entries } = await validatePayrollExport(
        periodStart,
        periodEnd,
        period?.status || "open",
        provider
      );
      setValidationResult(result);
      setValidatedEntries(entries);

      if (result.valid) {
        await doExport(provider, result, entries);
      }
    } catch (error: any) {
      toast.error("Valideringsfel", { description: error.message });
    } finally {
      setIsValidating(false);
    }
  };

  const doExport = async (provider: PayrollProvider, validation: ValidationResult, entries: TimeEntryForExport[]) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Ej inloggad");

    const exportId = crypto.randomUUID();
    const orgNumber = companySettings?.org_number || undefined;

    // Lock period if not already locked
    if (period && period.status === "open") {
      await supabase
        .from("payroll_periods")
        .update({ status: "locked", locked_at: new Date().toISOString(), locked_by: userData.user.id })
        .eq("id", period.id);
    }

    let filename: string;

    if (provider === "fortnox") {
      filename = generatePaXmlFilename(periodStart, orgNumber);
      const blob = generatePaXmlFile({
        entries,
        periodStart,
        periodEnd,
        exportId,
        orgNumber,
        companyName: companySettings?.company_name || companySettings?.organization_name,
      });
      downloadPaXmlFile(blob, filename);
    } else {
      filename = generateTluFilename(periodStart, periodEnd, orgNumber);
      const blob = generateTluFile({ entries, periodStart, periodEnd, exportId });
      downloadTluFile(blob, filename);
    }

    // Download PDF
    await downloadPayrollPdf({
      entries,
      validation,
      periodStart,
      periodEnd,
      exportId,
      companyName: companySettings?.company_name || companySettings?.organization_name,
      provider,
    });

    // Record export
    await supabase
      .from("payroll_exports")
      .insert({
        user_id: userData.user.id,
        period_id: period?.id,
        file_name: filename,
        entry_count: validation.summary.totalEntries,
        total_hours: validation.summary.totalHours,
        employee_count: validation.summary.employeeCount,
        provider,
        export_format: provider === "fortnox" ? "paxml" : "tlu",
      });

    // Update period status
    if (period) {
      await supabase
        .from("payroll_periods")
        .update({ status: "exported" })
        .eq("id", period.id);
    }

    // Mark entries
    const entryIds = entries.map((e) => e.id);
    await supabase
      .from("time_entries")
      .update({ export_id: exportId })
      .in("id", entryIds);

    queryClient.invalidateQueries({ queryKey: ["payroll-exports"] });
    queryClient.invalidateQueries({ queryKey: ["payroll-period"] });
    queryClient.invalidateQueries({ queryKey: ["payroll-status-check"] });

    toast.success("Export klar!", {
      description: `${filename} och PDF-underlag har laddats ner`,
    });
  };

  const isLocked = period?.status === "locked" || period?.status === "exported";
  const payrollProvider = (companySettings as any)?.payroll_provider || "visma";
  const showVisma = payrollProvider === "visma" || payrollProvider === "both" || !payrollProvider;
  const showFortnox = payrollProvider === "fortnox" || payrollProvider === "both";

  // Status checklist
  const totalEntries = statusCheck?.total || 0;
  const attestedEntries = statusCheck?.attested || 0;
  const withMapping = statusCheck?.withSalaryType || 0;
  const allAttested = totalEntries > 0 && attestedEntries === totalEntries;
  const allMapped = totalEntries > 0 && withMapping === totalEntries;

  return (
    <div className="page-transition space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6" />
          Löneexport
        </h1>
        <p className="text-muted-foreground">
          Exportera tidsunderlag till {showVisma && "Visma Lön"}{showVisma && showFortnox && " & "}{showFortnox && "Fortnox Lön"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="attestation">Attestering</TabsTrigger>
          <TabsTrigger value="periods">Perioder</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6 mt-6">
          {/* Period selector + Status Dashboard */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="text-base">
                  Period: {format(selectedMonth, "MMMM yyyy", { locale: sv })}
                </CardTitle>
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
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Checklist */}
              <div className="space-y-2">
                <StatusRow
                  ok={totalEntries > 0}
                  label={totalEntries > 0 ? `${totalEntries} tidposter` : "Inga tidposter"}
                />
                <StatusRow
                  ok={allAttested}
                  label={allAttested ? `Alla attesterade (${attestedEntries}/${totalEntries})` : `${attestedEntries}/${totalEntries} attesterade`}
                  actionLabel={!allAttested && totalEntries > 0 ? "Gå till attestering" : undefined}
                  onAction={() => setActiveTab("attestation")}
                />
                <StatusRow
                  ok={allMapped}
                  label={allMapped ? "Alla har mappade lönekoder" : `${withMapping}/${totalEntries} har lönekod`}
                  actionLabel={!allMapped && totalEntries > 0 ? "Konfigurera lönetyper" : undefined}
                  onAction={() => window.location.href = "/settings?tab=lonetyper"}
                />
                <StatusRow
                  ok={isLocked}
                  label={isLocked ? (period?.status === "exported" ? "Period exporterad" : "Period låst") : "Period öppen"}
                  actionLabel={!isLocked ? "Lås period" : undefined}
                  onAction={() => setActiveTab("periods")}
                  icon={isLocked ? <Lock className="h-4 w-4" /> : undefined}
                />
              </div>

              {/* Export buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                {showVisma && (
                  <Button
                    size="lg"
                    onClick={() => handleValidateAndExport("visma")}
                    disabled={isValidating || totalEntries === 0}
                    className="gap-2"
                  >
                    {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Exportera till Visma (.TLU + PDF)
                  </Button>
                )}
                {showFortnox && (
                  <Button
                    size="lg"
                    variant={showVisma ? "outline" : "default"}
                    onClick={() => handleValidateAndExport("fortnox")}
                    disabled={isValidating || totalEntries === 0}
                    className="gap-2"
                  >
                    {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Exportera till Fortnox (.PAXml + PDF)
                  </Button>
                )}
              </div>

              {!showVisma && !showFortnox && (
                <p className="text-sm text-muted-foreground">
                  Inget lönesystem valt. Gå till{" "}
                  <a href="/settings?tab=foretag" className="text-primary underline">Inställningar → Företag</a>{" "}
                  och välj lönesystem.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Validation errors/warnings (shown when export blocked) */}
          {validationResult && !validationResult.valid && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  Export blockerad
                </CardTitle>
                <CardDescription>
                  Åtgärda följande innan export
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      <div className="text-xl font-bold">{validationResult.summary.totalHours.toFixed(1)}h</div>
                      <div className="text-xs text-muted-foreground">Totalt</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xl font-bold">{validationResult.summary.employeeCount}</div>
                      <div className="text-xs text-muted-foreground">Anställda</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-xl font-bold">{Object.keys(validationResult.summary.entriesByTimeType).length}</div>
                      <div className="text-xs text-muted-foreground">Tidtyper</div>
                    </div>
                  </div>
                </div>

                {validationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-destructive flex items-center gap-2">
                      <XCircle className="h-4 w-4" />
                      Fel ({validationResult.errors.length})
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {validationResult.errors.map((error, i) => (
                        <div key={i} className="text-sm p-2 bg-destructive/10 text-destructive rounded">
                          {error.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {validationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-amber-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Varningar ({validationResult.warnings.length})
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {validationResult.warnings.map((warning, i) => (
                        <div key={i} className="text-sm p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 rounded">
                          {warning.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    <div key={exp.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium text-sm flex items-center gap-2">
                          {exp.file_name}
                          {exp.provider && (
                            <Badge variant="outline" className="text-xs">
                              {exp.provider === "fortnox" ? "Fortnox" : "Visma"}
                            </Badge>
                          )}
                        </div>
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
          <AttestationView selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        </TabsContent>

        <TabsContent value="periods" className="mt-6">
          <PeriodLockView selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Status checklist row component
function StatusRow({ ok, label, actionLabel, onAction, icon }: {
  ok: boolean;
  label: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-sm">
        {ok ? (
          icon || <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        )}
        <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      </div>
      {actionLabel && onAction && (
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
