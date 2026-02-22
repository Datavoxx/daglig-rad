import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import {
  CalendarIcon, ExternalLink, Link2, Pencil, Save, X, FileDown, Loader2,
  Clock, Users, BookOpen, TrendingUp, FileEdit, Receipt,
} from "lucide-react";
import { format, parseISO, startOfWeek, subWeeks } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { generateCompleteProjectPdf } from "@/lib/generateCompleteProjectPdf";
import ProjectTimeSection from "@/components/projects/ProjectTimeSection";
import { EconomicOverviewCard } from "@/components/projects/EconomicOverviewCard";
import KpiCard from "@/components/dashboard/KpiCard";
import { GanttTimeline, type PlanPhase } from "@/components/planning/GanttTimeline";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  estimate_id: string | null;
  start_date: string | null;
  budget: number | null;
  status: string | null;
  created_at: string;
}

interface Estimate {
  id: string;
  offer_number: string | null;
  manual_project_name: string | null;
  total_incl_vat: number | null;
  status: string;
}

interface ProjectOverviewTabProps {
  project: Project;
  onUpdate: () => void;
}

export default function ProjectOverviewTab({ project, onUpdate }: ProjectOverviewTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [linkedEstimate, setLinkedEstimate] = useState<Estimate | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [formData, setFormData] = useState({
    estimate_id: project.estimate_id || "",
    start_date: project.start_date ? parseISO(project.start_date) : undefined as Date | undefined,
    budget: project.budget?.toString() || "",
    status: project.status || "planning",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<{
    timeEntries: any[];
    diaryReports: any[];
    atas: any[];
    vendorInvoices: any[];
    receipts: any[];
    plan: any | null;
  }>({ timeEntries: [], diaryReports: [], atas: [], vendorInvoices: [], receipts: [], plan: null });

  useEffect(() => {
    fetchEstimates();
    fetchDashboardData();
  }, [project.id]);

  useEffect(() => {
    if (project.estimate_id && estimates.length > 0) {
      const linked = estimates.find(e => e.id === project.estimate_id);
      setLinkedEstimate(linked || null);
    }
  }, [project.estimate_id, estimates]);

  const fetchEstimates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("project_estimates")
      .select("id, offer_number, manual_project_name, total_incl_vat, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setEstimates(data);
  };

  const fetchDashboardData = async () => {
    const [timeRes, reportsRes, ataRes, invoiceRes, planRes, receiptRes] = await Promise.all([
      supabase.from("time_entries").select("id, hours, user_id, date").eq("project_id", project.id),
      supabase.from("daily_reports").select("id, report_date").eq("project_id", project.id),
      supabase.from("project_ata").select("id, subtotal, status").eq("project_id", project.id),
      supabase.from("vendor_invoices").select("id, total_inc_vat").eq("project_id", project.id),
      supabase.from("project_plans").select("phases, total_weeks, start_date").eq("project_id", project.id).maybeSingle(),
      supabase.from("receipts" as any).select("id, total_inc_vat").eq("project_id", project.id),
    ]);
    setDashboardData({
      timeEntries: timeRes.data || [],
      diaryReports: reportsRes.data || [],
      atas: ataRes.data || [],
      vendorInvoices: invoiceRes.data || [],
      plan: planRes.data,
      receipts: (receiptRes.data || []) as any[],
    });
  };

  // KPI calculations
  const kpis = useMemo(() => {
    const { timeEntries, diaryReports, atas, vendorInvoices, receipts } = dashboardData;

    const totalHours = timeEntries.reduce((sum: number, e: any) => sum + (e.hours || 0), 0);
    const uniqueUsers = new Set(timeEntries.map((e: any) => e.user_id)).size;
    const reportCount = diaryReports.length;
    const ataCount = atas.length;
    const ataTotal = atas.reduce((sum: number, a: any) => sum + (a.subtotal || 0), 0);
    const vendorExpenses = vendorInvoices.reduce((sum: number, v: any) => sum + (v.total_inc_vat || 0), 0);
    const receiptsExpenses = receipts.reduce((sum: number, r: any) => sum + (r.total_inc_vat || 0), 0);
    const expensesTotal = vendorExpenses + receiptsExpenses;

    const quoteValue = linkedEstimate?.total_incl_vat || 0;
    const totalProjectValue = quoteValue + ataTotal;
    const marginPercent = totalProjectValue > 0
      ? Math.round(((totalProjectValue - expensesTotal) / totalProjectValue) * 100)
      : 0;

    // Sparklines: group by week (last 8 weeks)
    const now = new Date();
    const weekBuckets = Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 7 - i), { weekStartsOn: 1 });
      return weekStart.getTime();
    });

    const hoursPerWeek = weekBuckets.map((ws, i) => {
      const nextWs = i < 7 ? weekBuckets[i + 1] : now.getTime();
      return timeEntries
        .filter((e: any) => {
          const d = new Date(e.date).getTime();
          return d >= ws && d < nextWs;
        })
        .reduce((s: number, e: any) => s + (e.hours || 0), 0);
    });

    const reportsPerWeek = weekBuckets.map((ws, i) => {
      const nextWs = i < 7 ? weekBuckets[i + 1] : now.getTime();
      return diaryReports.filter((r: any) => {
        const d = new Date(r.report_date).getTime();
        return d >= ws && d < nextWs;
      }).length;
    });

    return {
      totalHours, uniqueUsers, reportCount,
      ataCount, ataTotal, expensesTotal,
      marginPercent, totalProjectValue,
      hoursPerWeek, reportsPerWeek,
    };
  }, [dashboardData, linkedEstimate]);

  const handleSave = async () => {
    setSaving(true);
    const previousStatus = project.status;
    const newStatus = formData.status;
    
    const { error } = await supabase
      .from("projects")
      .update({
        estimate_id: formData.estimate_id && formData.estimate_id !== "none" ? formData.estimate_id : null,
        start_date: formData.start_date ? format(formData.start_date, "yyyy-MM-dd") : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: formData.status,
      })
      .eq("id", project.id);

    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Projekt uppdaterat" });
      setIsEditing(false);
      onUpdate();
      if (previousStatus !== "completed" && newStatus === "completed") {
        setShowCompletionDialog(true);
      }
    }
    setSaving(false);
  };

  const handleGenerateCompletePdf = async () => {
    setGeneratingPdf(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id || "";
      const [estimateItemsRes, ataItemsRes, planRes, diaryRes, timeEntriesRes, workOrdersRes, filesRes, vendorInvoicesRes, companyRes] = await Promise.all([
        project.estimate_id
          ? supabase.from("estimate_items").select("*").eq("estimate_id", project.estimate_id).order("sort_order")
          : Promise.resolve({ data: [] }),
        supabase.from("project_ata").select("*").eq("project_id", project.id).order("sort_order"),
        supabase.from("project_plans").select("*").eq("project_id", project.id).maybeSingle(),
        supabase.from("daily_reports").select("*").eq("project_id", project.id).order("report_date", { ascending: false }),
        supabase.from("time_entries")
          .select(`*, billing_types(name), salary_types(name), profiles(full_name)`)
          .eq("project_id", project.id)
          .order("date"),
        supabase.from("project_work_orders").select("*").eq("project_id", project.id).order("created_at"),
        supabase.from("project_files").select("id, file_name, category, created_at, storage_path").eq("project_id", project.id).order("created_at"),
        supabase.from("vendor_invoices").select("id, supplier_name, invoice_number, invoice_date, total_inc_vat, status").eq("project_id", project.id).order("invoice_date"),
        supabase.from("company_settings").select("*").eq("user_id", userId).maybeSingle(),
      ]);
      const timeEntries = (timeEntriesRes.data || []).map((entry: any) => ({
        id: entry.id, date: entry.date, hours: entry.hours, description: entry.description,
        billing_type_name: entry.billing_types?.name || null,
        salary_type_name: entry.salary_types?.name || null,
        user_name: entry.profiles?.full_name || null,
      }));
      await generateCompleteProjectPdf({
        project: project as any, estimate: linkedEstimate as any,
        estimateItems: (estimateItemsRes.data || []) as any[], ataItems: (ataItemsRes.data || []) as any[],
        plan: planRes.data as any, diaryReports: (diaryRes.data || []) as any[],
        timeEntries, workOrders: (workOrdersRes.data || []) as any[],
        projectFiles: (filesRes.data || []) as any[], vendorInvoices: (vendorInvoicesRes.data || []) as any[],
        companySettings: companyRes.data as any,
      });
      toast({ title: "Projektrapport nedladdad" });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({ title: "Kunde inte generera PDF", variant: "destructive" });
    }
    setGeneratingPdf(false);
    setShowCompletionDialog(false);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(amount);
  };

  const formatCompact = (amount: number) => {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} mkr`;
    if (amount >= 1_000) return `${Math.round(amount / 1_000)} tkr`;
    return `${amount} kr`;
  };

  return (
    <>
      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard
          title="Totala timmar"
          value={kpis.totalHours.toFixed(1)}
          icon={Clock}
          accentColor="blue"
          subtitle="rapporterat"
          sparklineData={kpis.hoursPerWeek}
          delay={0}
        />
        <KpiCard
          title="Medarbetare"
          value={kpis.uniqueUsers}
          icon={Users}
          accentColor="violet"
          subtitle="personer"
          delay={50}
        />
        <KpiCard
          title="Dagrapporter"
          value={kpis.reportCount}
          icon={BookOpen}
          accentColor="primary"
          subtitle="rapporter"
          sparklineData={kpis.reportsPerWeek}
          delay={100}
        />
        <KpiCard
          title="Marginal"
          value={`${kpis.marginPercent}%`}
          icon={TrendingUp}
          accentColor={kpis.marginPercent >= 0 ? "emerald" : "red"}
          subtitle="av projektvärde"
          delay={150}
        />
        <KpiCard
          title="ÄTA-arbeten"
          value={kpis.ataCount}
          icon={FileEdit}
          accentColor="amber"
          subtitle={formatCompact(kpis.ataTotal)}
          delay={200}
        />
        <KpiCard
          title="Utgifter"
          value={formatCompact(kpis.expensesTotal)}
          icon={Receipt}
          accentColor="red"
          subtitle="totalt"
          delay={250}
        />
      </div>

      {/* Economic Overview + Project Info side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        <EconomicOverviewCard projectId={project.id} quoteTotal={linkedEstimate?.total_incl_vat || null} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg">Projektinformation</CardTitle>
              <CardDescription>Grundläggande projektdata</CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="icon" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {/* Linked Estimate - edit */}
                <div className="space-y-2">
                  <Label>Kopplad offert</Label>
                  <Select
                    value={formData.estimate_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, estimate_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj offert..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ingen koppling</SelectItem>
                      {estimates.map((est) => (
                        <SelectItem key={est.id} value={est.id}>
                          {est.offer_number || est.manual_project_name || "Offert"} - {formatCurrency(est.total_incl_vat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Start Date - edit */}
                <div className="space-y-2">
                  <Label>Startdatum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !formData.start_date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.start_date ? format(formData.start_date, "PPP", { locale: sv }) : "Välj datum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.start_date}
                        onSelect={(date) => setFormData({ ...formData, start_date: date })}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                {/* Budget - edit */}
                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Input
                    type="number"
                    placeholder="Ange budget..."
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                {/* Status - edit */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planering</SelectItem>
                      <SelectItem value="active">Pågående</SelectItem>
                      <SelectItem value="closing">Slutskede</SelectItem>
                      <SelectItem value="completed">Avslutat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Linked Estimate row */}
                <div className="flex items-center gap-3 py-3">
                  <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Kopplad offert</span>
                  {linkedEstimate ? (
                    <span
                      className="text-sm font-medium cursor-pointer hover:text-primary transition-colors flex items-center gap-1 group"
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("estimateId", linkedEstimate.id);
                        if (linkedEstimate.offer_number) params.set("offerNumber", linkedEstimate.offer_number);
                        navigate(`/estimates?${params.toString()}`);
                      }}
                    >
                      {linkedEstimate.offer_number || linkedEstimate.manual_project_name}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground/60">–</span>
                  )}
                </div>
                {/* Start Date row */}
                <div className="flex items-center gap-3 py-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Startdatum</span>
                  <span className="text-sm font-medium">
                    {project.start_date ? format(parseISO(project.start_date), "d MMM yyyy", { locale: sv }) : "–"}
                  </span>
                </div>
                {/* Budget row */}
                <div className="flex items-center gap-3 py-3">
                  <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground w-28 shrink-0">Budget</span>
                  <span className="text-sm font-medium">{formatCurrency(project.budget)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Planning / Gantt Section */}
      {dashboardData.plan && dashboardData.plan.phases && (dashboardData.plan.phases as PlanPhase[]).length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Planering</CardTitle>
              <Badge variant="secondary">{project.status === "planning" ? "Planering" : project.status === "active" ? "Pågående" : project.status === "closing" ? "Slutskede" : project.status === "completed" ? "Avslutat" : project.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <GanttTimeline
              phases={dashboardData.plan.phases as PlanPhase[]}
              totalDays={(dashboardData.plan as any).total_days || (dashboardData.plan.total_weeks ? dashboardData.plan.total_weeks * 5 : 40)}
              totalWeeks={dashboardData.plan.total_weeks || 8}
              startDate={dashboardData.plan.start_date ? new Date(dashboardData.plan.start_date) : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-3">Ingen planering skapad ännu</p>
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${project.id}?tab=planning`)}
            >
              Skapa planering
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Time Reporting Section */}
      <ProjectTimeSection projectId={project.id} projectName={project.name} />

      {/* Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary" />
              Projekt avslutat!
            </DialogTitle>
            <DialogDescription>
              Vill du ladda ner en komplett projektrapport som PDF?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">PDF:en innehåller:</p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>Offert med alla poster</li>
              <li>ÄTA-arbeten</li>
              <li>Projektplanering</li>
              <li>Alla dagrapporter</li>
              <li>Tidsrapporter</li>
              <li>Arbetsorder</li>
              <li>Projektfiler & bilagor</li>
              <li>Leverantörsfakturor</li>
              <li>Ekonomisk sammanfattning</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>Hoppa över</Button>
            <Button onClick={handleGenerateCompletePdf} disabled={generatingPdf}>
              {generatingPdf ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Genererar...</>
              ) : (
                <><FileDown className="h-4 w-4 mr-2" />Ladda ner PDF</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
