import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Briefcase, Search, Phone, Clock, Package, FileText, MapPin, Building2, ChevronRight, MoreHorizontal, Trash2, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreateJobDialog } from "./CreateJobDialog";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  status: string | null;
  created_at: string;
  hasTime: boolean;
  hasMaterial: boolean;
  isInvoiced: boolean;
  workOrderId: string | null;
  workOrderStatus: string | null;
  customerPhone: string | null;
}

const STATUS_FILTERS = [
  { label: "Alla", value: null },
  { label: "Pågående", value: "in_progress" },
  { label: "Planerade", value: "pending" },
  { label: "Väntar", value: "waiting" },
  { label: "Klara", value: "completed" },
  { label: "Fakturerade", value: "invoiced" },
];

const getStatusLabel = (status: string | null) => {
  switch (status) {
    case "in_progress": return "Pågående";
    case "pending": return "Planerad";
    case "planned": return "Planerad";
    case "waiting": return "Väntar";
    case "completed": return "Klar";
    case "invoiced": return "Fakturerad";
    default: return "Pågående";
  }
};

const getStatusColor = (status: string | null) => {
  switch (status) {
    case "in_progress": return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "pending": case "planned": return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "waiting": return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
    case "completed": return "bg-green-500/10 text-green-700 dark:text-green-400";
    case "invoiced": return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    default: return "bg-muted text-muted-foreground";
  }
};

export function JobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, client_name, address, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!projects) { setLoading(false); return; }

    const projectIds = projects.map(p => p.id);

    const { data: workOrders } = await supabase
      .from("project_work_orders")
      .select("id, project_id, status, customer_phone, invoice_id")
      .in("project_id", projectIds.length > 0 ? projectIds : ["__none__"]);

    const woIds = (workOrders || []).map(w => w.id);
    const { data: timeEntries } = await supabase
      .from("work_order_time_entries")
      .select("work_order_id")
      .in("work_order_id", woIds.length > 0 ? woIds : ["__none__"]);

    const { data: materials } = await supabase
      .from("work_order_materials")
      .select("work_order_id")
      .in("work_order_id", woIds.length > 0 ? woIds : ["__none__"]);

    const timeByWo = new Set((timeEntries || []).map(t => t.work_order_id));
    const materialByWo = new Set((materials || []).map(m => m.work_order_id));

    const jobList: Job[] = projects.map(p => {
      const wo = (workOrders || []).find(w => w.project_id === p.id);
      return {
        id: p.id,
        name: p.name,
        client_name: p.client_name,
        address: p.address,
        status: p.status,
        created_at: p.created_at,
        hasTime: wo ? timeByWo.has(wo.id) : false,
        hasMaterial: wo ? materialByWo.has(wo.id) : false,
        isInvoiced: wo?.status === "invoiced" || !!wo?.invoice_id,
        workOrderId: wo?.id || null,
        workOrderStatus: wo?.status || null,
        customerPhone: wo?.customer_phone || null,
      };
    });

    setJobs(jobList);
    setLoading(false);
  };

  const handleDelete = async (job: Job) => {
    const { error } = await supabase.from("projects").delete().eq("id", job.id);
    if (error) {
      toast({ title: "Kunde inte ta bort jobb", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Jobb borttaget" });
      fetchJobs();
    }
  };

  const handleStatusChange = async (job: Job, newStatus: string) => {
    // Update work order status
    if (job.workOrderId) {
      await supabase.from("project_work_orders").update({ status: newStatus }).eq("id", job.workOrderId);
    }
    // Update project status
    await supabase.from("projects").update({ status: newStatus === "planned" ? "pending" : newStatus }).eq("id", job.id);
    toast({ title: `Jobb markerat som ${getStatusLabel(newStatus)}` });
    fetchJobs();
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchQuery ||
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.address?.toLowerCase().includes(searchQuery.toLowerCase());
    const effectiveStatus = job.workOrderStatus || job.status;
    const matchesStatus = !statusFilter || effectiveStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Jobb</h1>
          <p className="page-subtitle">Dina servicejobb</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nytt jobb
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Sök jobb, kunder..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              statusFilter === f.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Job list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Briefcase className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-base font-medium">
            {jobs.length === 0 ? "Inga jobb ännu" : "Inga jobb hittades"}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">
            {jobs.length === 0 ? "Skapa ditt första servicejobb för att komma igång" : "Prova att ändra din sökning"}
          </p>
          {jobs.length === 0 && (
            <Button className="mt-6" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Skapa jobb
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredJobs.map((job) => {
            const effectiveStatus = job.workOrderStatus || job.status;
            const canStart = effectiveStatus === "pending" || effectiveStatus === "planned";
            const canComplete = effectiveStatus === "in_progress";
            return (
              <Card
                key={job.id}
                className="group cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-150 overflow-hidden"
                onClick={() => navigate(`/projects/${job.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{job.name}</span>
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", getStatusColor(effectiveStatus))}>
                          {getStatusLabel(effectiveStatus)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {job.client_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {job.client_name}
                          </span>
                        )}
                        {job.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[160px]">{job.address}</span>
                          </span>
                        )}
                      </div>
                      {/* Quick indicators */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {job.hasTime && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Clock className="h-3 w-3" /> Tid
                          </span>
                        )}
                        {job.hasMaterial && (
                          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <Package className="h-3 w-3" /> Material
                          </span>
                        )}
                        {job.isInvoiced && (
                          <span className="flex items-center gap-0.5 text-[10px] text-primary">
                            <FileText className="h-3 w-3" /> Fakturerad
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Quick status actions */}
                      {canStart && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          title="Starta jobb"
                          onClick={() => handleStatusChange(job, "in_progress")}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {canComplete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600"
                          title="Markera klar"
                          onClick={() => handleStatusChange(job, "completed")}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Quick call */}
                      {job.customerPhone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${job.customerPhone}`;
                          }}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-50 bg-background border shadow-lg">
                          {canStart && (
                            <DropdownMenuItem onClick={() => handleStatusChange(job, "in_progress")}>
                              <Play className="mr-2 h-4 w-4" />
                              Starta jobb
                            </DropdownMenuItem>
                          )}
                          {canComplete && (
                            <DropdownMenuItem onClick={() => handleStatusChange(job, "completed")}>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Markera klar
                            </DropdownMenuItem>
                          )}
                          {effectiveStatus === "completed" && (
                            <DropdownMenuItem onClick={() => navigate(`/projects/${job.id}`)}>
                              <FileText className="mr-2 h-4 w-4" />
                              Skapa faktura
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(job)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Ta bort
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateJobDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={fetchJobs}
      />
    </div>
  );
}
