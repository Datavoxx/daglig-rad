import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CustomerInvoiceDialog } from "@/components/invoices/CustomerInvoiceDialog";
import type { InvoiceRow } from "@/components/invoices/InvoiceRowEditor";
import ProjectFilesTab from "@/components/projects/ProjectFilesTab";
import ProjectAtaTab from "@/components/projects/ProjectAtaTab";
import JobActionBar from "./JobActionBar";
import {
  ArrowLeft, Phone, MapPin, Clock, Package, StickyNote, FileText,
  Plus, Trash2, ChevronDown, Zap, Camera, Image, Wrench,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  status: string | null;
  estimate_id: string | null;
}

interface WorkOrder {
  id: string;
  order_number: string | null;
  title: string;
  description: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  assigned_to: string | null;
  status: string;
  created_at: string;
  invoice_id: string | null;
}

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  billing_type: string;
  description: string | null;
  is_billable: boolean;
}

interface Material {
  id: string;
  article_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  category: string | null;
  is_billable: boolean;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

interface Article {
  id: string;
  name: string;
  unit: string | null;
  default_price: number | null;
  customer_price: number | null;
}

interface Props {
  project: Project;
}

const statusFlow = [
  { value: "planned", label: "Planerad" },
  { value: "in_progress", label: "Pågående" },
  { value: "waiting", label: "Väntar" },
  { value: "completed", label: "Klar" },
  { value: "invoiced", label: "Fakturerad" },
];

export default function JobDetailView({ project }: Props) {
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [status, setStatus] = useState("planned");
  const [articles, setArticles] = useState<Article[]>([]);
  const [hourlyRate, setHourlyRate] = useState(500);

  // Time form
  const [timeForm, setTimeForm] = useState({ hours: "", date: format(new Date(), "yyyy-MM-dd"), billing_type: "service", description: "", is_billable: true });
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  // Material form
  const [matForm, setMatForm] = useState({ article_name: "", quantity: "1", unit: "st", unit_price: "", category: "", is_billable: true });
  // Note form
  const [noteText, setNoteText] = useState("");
  // Invoice dialog
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>([]);

  // Section refs for action bar scrolling
  const timeRef = useRef<HTMLDivElement>(null);
  const materialRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrCreateWorkOrder();
    fetchArticlesAndPricing();
  }, [project.id]);

  const fetchOrCreateWorkOrder = async () => {
    // Try to find existing service work order
    const { data: orders } = await supabase
      .from("project_work_orders")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (orders && orders.length > 0) {
      const wo = orders[0] as unknown as WorkOrder;
      setWorkOrder(wo);
      setStatus(wo.status);
      fetchWorkOrderData(wo.id);
    } else {
      // Auto-create a work order for this job
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: newWo, error } = await supabase.from("project_work_orders").insert({
        project_id: project.id,
        user_id: user.id,
        title: project.name,
        customer_name: project.client_name || null,
        customer_address: project.address || null,
        status: "planned",
        work_order_type: "service",
      }).select().single();

      if (error) {
        toast.error("Kunde inte skapa jobbkort");
        setLoading(false);
        return;
      }
      const wo = newWo as unknown as WorkOrder;
      setWorkOrder(wo);
      setStatus(wo.status);
      fetchWorkOrderData(wo.id);
    }
    setLoading(false);
  };

  const fetchWorkOrderData = async (woId: string) => {
    const [{ data: t }, { data: m }, { data: n }] = await Promise.all([
      supabase.from("work_order_time_entries").select("*").eq("work_order_id", woId).order("date", { ascending: false }),
      supabase.from("work_order_materials").select("*").eq("work_order_id", woId).order("sort_order"),
      supabase.from("work_order_notes").select("*").eq("work_order_id", woId).order("created_at", { ascending: false }),
    ]);
    setTimeEntries((t || []) as TimeEntry[]);
    setMaterials((m || []) as Material[]);
    setNotes((n || []) as Note[]);
  };

  const fetchArticlesAndPricing = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data: arts }, { data: pricing }] = await Promise.all([
      supabase.from("articles").select("id, name, unit, default_price, customer_price").eq("user_id", user.id).eq("is_active", true).order("sort_order").limit(20),
      supabase.from("user_pricing_settings").select("hourly_rate_general").eq("user_id", user.id).maybeSingle(),
    ]);
    setArticles((arts || []) as Article[]);
    if (pricing) setHourlyRate(Number(pricing.hourly_rate_general) || 500);
  };

  const getCustomerPrice = (article: Article) => {
    if (article.customer_price != null) return Number(article.customer_price);
    if (article.default_price != null) return Number(article.default_price);
    return 0;
  };

  const addFavoriteMaterial = async (article: Article) => {
    if (!workOrder) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const price = getCustomerPrice(article);
    const { error } = await supabase.from("work_order_materials").insert({
      work_order_id: workOrder.id,
      user_id: user.id,
      article_name: article.name,
      quantity: 1,
      unit: article.unit || "st",
      unit_price: price,
      is_billable: true,
      sort_order: materials.length,
    });
    if (error) { toast.error("Kunde inte lägga till"); return; }
    toast.success(`${article.name} tillagt`);
    fetchWorkOrderData(workOrder.id);
  };

  const updateStatus = async (newStatus: string) => {
    if (!workOrder) return;
    const { error } = await supabase.from("project_work_orders").update({ status: newStatus }).eq("id", workOrder.id);
    if (error) { toast.error("Kunde inte uppdatera status"); return; }
    setStatus(newStatus);
    toast.success(`Status ändrad till ${statusFlow.find(s => s.value === newStatus)?.label}`);
  };

  const addTime = async () => {
    if (!workOrder || !timeForm.hours || Number(timeForm.hours) <= 0) { toast.error("Ange timmar"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("work_order_time_entries").insert({
      work_order_id: workOrder.id,
      user_id: user.id,
      hours: Number(timeForm.hours),
      date: timeForm.date,
      billing_type: timeForm.billing_type,
      description: timeForm.description || null,
      is_billable: timeForm.is_billable,
    });
    if (error) { toast.error("Kunde inte spara tid"); return; }
    toast.success("Tid registrerad");
    setTimeForm({ hours: "", date: format(new Date(), "yyyy-MM-dd"), billing_type: "service", description: "", is_billable: true });
    fetchWorkOrderData(workOrder.id);
  };

  const deleteTime = async (id: string) => {
    await supabase.from("work_order_time_entries").delete().eq("id", id);
    if (workOrder) fetchWorkOrderData(workOrder.id);
  };

  const addMaterial = async () => {
    if (!workOrder || !matForm.article_name.trim()) { toast.error("Ange artikelnamn"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("work_order_materials").insert({
      work_order_id: workOrder.id,
      user_id: user.id,
      article_name: matForm.article_name,
      quantity: Number(matForm.quantity) || 1,
      unit: matForm.unit,
      unit_price: Number(matForm.unit_price) || 0,
      category: matForm.category || null,
      is_billable: matForm.is_billable,
      sort_order: materials.length,
    });
    if (error) { toast.error("Kunde inte spara material"); return; }
    toast.success("Material tillagt");
    setMatForm({ article_name: "", quantity: "1", unit: "st", unit_price: "", category: "", is_billable: true });
    fetchWorkOrderData(workOrder.id);
  };

  const deleteMaterial = async (id: string) => {
    await supabase.from("work_order_materials").delete().eq("id", id);
    if (workOrder) fetchWorkOrderData(workOrder.id);
  };

  const addNote = async () => {
    if (!workOrder || !noteText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("work_order_notes").insert({
      work_order_id: workOrder.id,
      user_id: user.id,
      content: noteText,
    });
    setNoteText("");
    fetchWorkOrderData(workOrder.id);
  };

  const openInvoice = () => {
    if (!workOrder) return;
    const rows: InvoiceRow[] = [];
    timeEntries.filter(e => e.is_billable).forEach(e => {
      rows.push({
        id: crypto.randomUUID(),
        description: `${e.billing_type.charAt(0).toUpperCase() + e.billing_type.slice(1)}${e.description ? ` — ${e.description}` : ""} (${e.date})`,
        quantity: Number(e.hours),
        unit: "h",
        unit_price: hourlyRate,
        vat_rate: 25,
        subtotal: Number(e.hours) * hourlyRate,
      });
    });
    materials.filter(m => m.is_billable).forEach(m => {
      rows.push({
        id: crypto.randomUUID(),
        description: m.article_name,
        quantity: Number(m.quantity),
        unit: m.unit,
        unit_price: Number(m.unit_price),
        vat_rate: 25,
        subtotal: Number(m.quantity) * Number(m.unit_price),
      });
    });
    if (rows.length === 0) {
      rows.push({ id: crypto.randomUUID(), description: "", quantity: 1, unit: "st", unit_price: 0, vat_rate: 25, subtotal: 0 });
    }
    setInvoiceRows(rows);
    setInvoiceOpen(true);
  };

  // Calculations
  const billableHours = timeEntries.filter(e => e.is_billable).reduce((s, e) => s + Number(e.hours), 0);
  const billableMaterialCost = materials.filter(m => m.is_billable).reduce((s, m) => s + Number(m.quantity) * Number(m.unit_price), 0);
  const timeCost = Math.round(billableHours * hourlyRate);
  const totalCost = timeCost + billableMaterialCost;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-20 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")} className="mt-0.5 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{workOrder?.order_number}</span>
            <Badge variant={status === "completed" ? "default" : status === "invoiced" ? "secondary" : "outline"}>
              {statusFlow.find(s => s.value === status)?.label || status}
            </Badge>
          </div>
          <h1 className="text-xl font-semibold truncate">{project.name}</h1>
          {workOrder?.description && <p className="text-sm text-muted-foreground mt-0.5">{workOrder.description}</p>}
        </div>
      </div>

      {/* Customer info */}
      {(project.client_name || project.address || workOrder?.customer_phone) && (
        <Card>
          <CardContent className="p-3 space-y-1">
            {project.client_name && <p className="font-medium text-sm">{project.client_name}</p>}
            {project.address && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(project.address)}`} target="_blank" rel="noreferrer" className="text-sm text-primary flex items-center gap-1">
                <MapPin className="h-3 w-3" />{project.address}
              </a>
            )}
            {workOrder?.customer_phone && (
              <a href={`tel:${workOrder.customer_phone}`} className="text-sm text-primary flex items-center gap-1">
                <Phone className="h-3 w-3" />{workOrder.customer_phone}
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status flow */}
      <div className="flex gap-1 flex-wrap">
        {statusFlow.filter(s => s.value !== "invoiced").map(s => (
          <Button
            key={s.value}
            size="sm"
            variant={status === s.value ? "default" : "outline"}
            onClick={() => updateStatus(s.value)}
            className="text-xs"
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* Money summary */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Tid</p>
            <p className="text-lg font-bold">{timeCost.toLocaleString("sv-SE")} kr</p>
            <p className="text-xs text-muted-foreground">{billableHours}h × {hourlyRate} kr</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Material</p>
            <p className="text-lg font-bold">{billableMaterialCost.toLocaleString("sv-SE")} kr</p>
          </CardContent>
        </Card>
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-3 text-center">
            <p className="text-xs font-medium text-primary">TOTALT</p>
            <p className="text-xl font-black text-primary">{totalCost.toLocaleString("sv-SE")} kr</p>
          </CardContent>
        </Card>
      </div>

      {/* Accordion sections */}
      <Accordion type="multiple" defaultValue={["time", "material"]} className="space-y-2">
        {/* TIME */}
        <div ref={timeRef}>
          <AccordionItem value="time" className="border rounded-lg px-4">
            <AccordionTrigger className="py-3">
              <span className="flex items-center gap-2"><Clock className="h-4 w-4" />Tid ({timeEntries.length})</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.5"
                  placeholder="Timmar"
                  value={timeForm.hours}
                  onChange={e => setTimeForm({ ...timeForm, hours: e.target.value })}
                  className="flex-1 text-lg h-11"
                  onKeyDown={e => e.key === "Enter" && addTime()}
                />
                <Button onClick={addTime} className="h-11 px-4">
                  <Plus className="h-4 w-4 mr-1" />Lägg tid
                </Button>
              </div>

              <Collapsible open={showTimeOptions} onOpenChange={setShowTimeOptions}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground w-full">
                    <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${showTimeOptions ? "rotate-180" : ""}`} />
                    Fler val
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Datum</Label>
                      <Input type="date" value={timeForm.date} onChange={e => setTimeForm({ ...timeForm, date: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Typ</Label>
                      <Select value={timeForm.billing_type} onValueChange={v => setTimeForm({ ...timeForm, billing_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="installation">Installation</SelectItem>
                          <SelectItem value="jour">Jour</SelectItem>
                          <SelectItem value="resa">Resa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={timeForm.is_billable} onCheckedChange={c => setTimeForm({ ...timeForm, is_billable: !!c })} />
                      Debiterbar
                    </label>
                  </div>
                  <Input placeholder="Anteckning (valfritt)" value={timeForm.description} onChange={e => setTimeForm({ ...timeForm, description: e.target.value })} />
                </CollapsibleContent>
              </Collapsible>

              {timeEntries.length > 0 && (
                <div className="space-y-1 mt-2">
                  {timeEntries.map(e => (
                    <div key={e.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <div>
                        <span className="font-medium">{e.hours}h</span>
                        <span className="text-muted-foreground ml-2">{e.billing_type} · {e.date}</span>
                        {e.description && <span className="text-muted-foreground ml-2">— {e.description}</span>}
                        {!e.is_billable && <Badge variant="outline" className="ml-2 text-xs">Ej deb.</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteTime(e.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* MATERIAL */}
        <div ref={materialRef}>
          <AccordionItem value="material" className="border rounded-lg px-4">
            <AccordionTrigger className="py-3">
              <span className="flex items-center gap-2"><Package className="h-4 w-4" />Material ({materials.length})</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              {articles.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Zap className="h-3 w-3" />Snabbval</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {articles.map(a => (
                      <Button
                        key={a.id}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 rounded-full"
                        onClick={() => addFavoriteMaterial(a)}
                      >
                        <Plus className="h-3 w-3 mr-0.5" />{a.name}
                        <span className="text-muted-foreground ml-1">{getCustomerPrice(a)} kr</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Artikel *</Label>
                <Input placeholder="T.ex. Kabel 3G2.5" value={matForm.article_name} onChange={e => setMatForm({ ...matForm, article_name: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Antal</Label>
                  <Input type="number" value={matForm.quantity} onChange={e => setMatForm({ ...matForm, quantity: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Enhet</Label>
                  <Input value={matForm.unit} onChange={e => setMatForm({ ...matForm, unit: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">À-pris</Label>
                  <Input type="number" placeholder="0" value={matForm.unit_price} onChange={e => setMatForm({ ...matForm, unit_price: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={matForm.is_billable} onCheckedChange={c => setMatForm({ ...matForm, is_billable: !!c })} />
                  Debiterbar
                </label>
              </div>
              <Button size="sm" onClick={addMaterial} className="w-full"><Plus className="h-4 w-4 mr-1" />Lägg material</Button>

              {materials.length > 0 && (
                <div className="space-y-1 mt-2">
                  {materials.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                      <div>
                        <span className="font-medium">{m.article_name}</span>
                        <span className="text-muted-foreground ml-2">{m.quantity} {m.unit} × {Number(m.unit_price).toLocaleString("sv-SE")} kr</span>
                        <span className="ml-2 font-medium">= {(Number(m.quantity) * Number(m.unit_price)).toLocaleString("sv-SE")} kr</span>
                        {!m.is_billable && <Badge variant="outline" className="ml-2 text-xs">Ej deb.</Badge>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteMaterial(m.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* NOTES */}
        <AccordionItem value="notes" className="border rounded-lg px-4">
          <AccordionTrigger className="py-3">
            <span className="flex items-center gap-2"><StickyNote className="h-4 w-4" />Anteckningar ({notes.length})</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Skriv anteckning..." value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()} className="flex-1" />
              <Button size="sm" onClick={addNote}><Plus className="h-4 w-4" /></Button>
            </div>
            {notes.map(n => (
              <div key={n.id} className="text-sm p-2 rounded bg-muted/50">
                <p>{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "d MMM HH:mm", { locale: sv })}</p>
              </div>
            ))}
          </AccordionContent>
        </AccordionItem>

        {/* FILES / IMAGES */}
        <div ref={filesRef}>
          <AccordionItem value="files" className="border rounded-lg px-4">
            <AccordionTrigger className="py-3">
              <span className="flex items-center gap-2"><Image className="h-4 w-4" />Bilder & dokument</span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <ProjectFilesTab projectId={project.id} />
            </AccordionContent>
          </AccordionItem>
        </div>

        {/* EXTRA WORK (ÄTA) */}
        <AccordionItem value="extra" className="border rounded-lg px-4">
          <AccordionTrigger className="py-3">
            <span className="flex items-center gap-2"><Wrench className="h-4 w-4" />Extraarbete</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <ProjectAtaTab
              projectId={project.id}
              projectName={project.name}
              clientName={project.client_name || undefined}
              projectAddress={project.address || undefined}
              projectPostalCode={project.postal_code || undefined}
              projectCity={project.city || undefined}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Create invoice button */}
      {status === "completed" && (
        <Button className="w-full" size="lg" onClick={openInvoice}>
          <FileText className="h-4 w-4 mr-2" />
          Skapa faktura
        </Button>
      )}

      {/* Sticky action bar (mobile) */}
      <JobActionBar
        onAddTime={() => timeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        onAddMaterial={() => materialRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        onAddImage={() => filesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        onCreateInvoice={openInvoice}
        showInvoice={status === "completed"}
      />

      {workOrder && (
        <CustomerInvoiceDialog
          open={invoiceOpen}
          onOpenChange={setInvoiceOpen}
          initialProjectId={project.id}
          initialRows={invoiceRows}
          onSaved={async (invoiceId) => {
            await supabase.from("project_work_orders").update({ status: "invoiced", invoice_id: invoiceId }).eq("id", workOrder.id);
            setStatus("invoiced");
          }}
        />
      )}
    </div>
  );
}
