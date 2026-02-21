import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomerInvoiceDialog } from "@/components/invoices/CustomerInvoiceDialog";
import type { InvoiceRow } from "@/components/invoices/InvoiceRowEditor";
import { ArrowLeft, Phone, MapPin, Clock, Package, StickyNote, FileText, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

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

interface Props {
  workOrder: WorkOrder;
  projectId: string;
  projectName: string;
  onBack: () => void;
  onRefresh: () => void;
}

const statusFlow = [
  { value: "planned", label: "Planerad" },
  { value: "in_progress", label: "Pågående" },
  { value: "waiting", label: "Väntar" },
  { value: "completed", label: "Klar" },
  { value: "invoiced", label: "Fakturerad" },
];

export default function ServiceWorkOrderView({ workOrder, projectId, projectName, onBack, onRefresh }: Props) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [status, setStatus] = useState(workOrder.status);

  // Time form
  const [timeForm, setTimeForm] = useState({ hours: "", date: format(new Date(), "yyyy-MM-dd"), billing_type: "service", description: "", is_billable: true });
  // Material form
  const [matForm, setMatForm] = useState({ article_name: "", quantity: "1", unit: "st", unit_price: "", category: "", is_billable: true });
  // Note form
  const [noteText, setNoteText] = useState("");
  // Invoice dialog
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>([]);

  useEffect(() => {
    fetchAll();
  }, [workOrder.id]);

  const fetchAll = async () => {
    const [{ data: t }, { data: m }, { data: n }] = await Promise.all([
      supabase.from("work_order_time_entries").select("*").eq("work_order_id", workOrder.id).order("date", { ascending: false }),
      supabase.from("work_order_materials").select("*").eq("work_order_id", workOrder.id).order("sort_order"),
      supabase.from("work_order_notes").select("*").eq("work_order_id", workOrder.id).order("created_at", { ascending: false }),
    ]);
    setTimeEntries((t || []) as TimeEntry[]);
    setMaterials((m || []) as Material[]);
    setNotes((n || []) as Note[]);
  };

  const updateStatus = async (newStatus: string) => {
    const { error } = await supabase.from("project_work_orders").update({ status: newStatus }).eq("id", workOrder.id);
    if (error) { toast.error("Kunde inte uppdatera status"); return; }
    setStatus(newStatus);
    onRefresh();
    toast.success(`Status ändrad till ${statusFlow.find(s => s.value === newStatus)?.label}`);
  };

  const addTime = async () => {
    if (!timeForm.hours || Number(timeForm.hours) <= 0) { toast.error("Ange timmar"); return; }
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
    fetchAll();
  };

  const deleteTime = async (id: string) => {
    await supabase.from("work_order_time_entries").delete().eq("id", id);
    fetchAll();
  };

  const addMaterial = async () => {
    if (!matForm.article_name.trim()) { toast.error("Ange artikelnamn"); return; }
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
    fetchAll();
  };

  const deleteMaterial = async (id: string) => {
    await supabase.from("work_order_materials").delete().eq("id", id);
    fetchAll();
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("work_order_notes").insert({
      work_order_id: workOrder.id,
      user_id: user.id,
      content: noteText,
    });
    setNoteText("");
    fetchAll();
  };

  const totalHours = timeEntries.reduce((s, e) => s + Number(e.hours), 0);
  const billableHours = timeEntries.filter(e => e.is_billable).reduce((s, e) => s + Number(e.hours), 0);
  const totalMaterialCost = materials.reduce((s, m) => s + Number(m.quantity) * Number(m.unit_price), 0);
  const billableMaterialCost = materials.filter(m => m.is_billable).reduce((s, m) => s + Number(m.quantity) * Number(m.unit_price), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="mt-0.5 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{workOrder.order_number}</span>
            <Badge variant={status === "completed" ? "default" : status === "invoiced" ? "secondary" : "outline"}>
              {statusFlow.find(s => s.value === status)?.label || status}
            </Badge>
          </div>
          <h2 className="text-xl font-semibold truncate">{workOrder.title}</h2>
          {workOrder.description && <p className="text-sm text-muted-foreground mt-1">{workOrder.description}</p>}
        </div>
      </div>

      {/* Customer info card */}
      {(workOrder.customer_name || workOrder.customer_phone || workOrder.customer_address) && (
        <Card>
          <CardContent className="p-4 space-y-1">
            {workOrder.customer_name && <p className="font-medium">{workOrder.customer_name}</p>}
            {workOrder.customer_address && (
              <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{workOrder.customer_address}</p>
            )}
            {workOrder.customer_phone && (
              <a href={`tel:${workOrder.customer_phone}`} className="text-sm text-primary flex items-center gap-1">
                <Phone className="h-3 w-3" />{workOrder.customer_phone}
              </a>
            )}
            {workOrder.assigned_to && <p className="text-sm text-muted-foreground">Tekniker: {workOrder.assigned_to}</p>}
          </CardContent>
        </Card>
      )}

      {/* Status flow */}
      <Card>
        <CardContent className="p-3">
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
        </CardContent>
      </Card>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total tid</p><p className="text-lg font-semibold">{totalHours}h</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Debiterbar tid</p><p className="text-lg font-semibold">{billableHours}h</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Material</p><p className="text-lg font-semibold">{totalMaterialCost.toLocaleString("sv-SE")} kr</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Debiterbart mat.</p><p className="text-lg font-semibold">{billableMaterialCost.toLocaleString("sv-SE")} kr</p></CardContent></Card>
      </div>

      {/* Accordion sections */}
      <Accordion type="multiple" defaultValue={["time", "material"]} className="space-y-2">
        {/* TIME */}
        <AccordionItem value="time" className="border rounded-lg px-4">
          <AccordionTrigger className="py-3">
            <span className="flex items-center gap-2"><Clock className="h-4 w-4" />Tid ({timeEntries.length})</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Timmar *</Label>
                <Input type="number" step="0.5" placeholder="0" value={timeForm.hours} onChange={e => setTimeForm({ ...timeForm, hours: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Datum</Label>
                <Input type="date" value={timeForm.date} onChange={e => setTimeForm({ ...timeForm, date: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={timeForm.is_billable} onCheckedChange={c => setTimeForm({ ...timeForm, is_billable: !!c })} />
                  Debiterbar
                </label>
              </div>
            </div>
            <Input placeholder="Anteckning (valfritt)" value={timeForm.description} onChange={e => setTimeForm({ ...timeForm, description: e.target.value })} />
            <Button size="sm" onClick={addTime} className="w-full"><Plus className="h-4 w-4 mr-1" />Lägg tid</Button>

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

        {/* MATERIAL */}
        <AccordionItem value="material" className="border rounded-lg px-4">
          <AccordionTrigger className="py-3">
            <span className="flex items-center gap-2"><Package className="h-4 w-4" />Material ({materials.length})</span>
          </AccordionTrigger>
          <AccordionContent className="pb-4 space-y-3">
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
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Kategori</Label>
                <Input placeholder="T.ex. kabel" value={matForm.category} onChange={e => setMatForm({ ...matForm, category: e.target.value })} />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={matForm.is_billable} onCheckedChange={c => setMatForm({ ...matForm, is_billable: !!c })} />
                  Debiterbar
                </label>
              </div>
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
      </Accordion>

      {/* Create invoice button */}
      {status === "completed" && (
        <Button className="w-full" size="lg" onClick={() => {
          const rows: InvoiceRow[] = [];
          // Add billable time entries
          timeEntries.filter(e => e.is_billable).forEach(e => {
            rows.push({
              id: crypto.randomUUID(),
              description: `${e.billing_type.charAt(0).toUpperCase() + e.billing_type.slice(1)}${e.description ? ` — ${e.description}` : ""} (${e.date})`,
              quantity: Number(e.hours),
              unit: "h",
              unit_price: 0, // User sets hourly rate in invoice
              vat_rate: 25,
              subtotal: 0,
            });
          });
          // Add billable materials
          materials.filter(m => m.is_billable).forEach(m => {
            const sub = Number(m.quantity) * Number(m.unit_price);
            rows.push({
              id: crypto.randomUUID(),
              description: m.article_name,
              quantity: Number(m.quantity),
              unit: m.unit,
              unit_price: Number(m.unit_price),
              vat_rate: 25,
              subtotal: sub,
            });
          });
          if (rows.length === 0) {
            rows.push({ id: crypto.randomUUID(), description: "", quantity: 1, unit: "st", unit_price: 0, vat_rate: 25, subtotal: 0 });
          }
          setInvoiceRows(rows);
          setInvoiceOpen(true);
        }}>
          <FileText className="h-4 w-4 mr-2" />
          Skapa faktura
        </Button>
      )}

      <CustomerInvoiceDialog
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        initialProjectId={projectId}
        initialRows={invoiceRows}
        onSaved={async (invoiceId) => {
          await supabase.from("project_work_orders").update({ status: "invoiced", invoice_id: invoiceId }).eq("id", workOrder.id);
          setStatus("invoiced");
          onRefresh();
        }}
      />
    </div>
  );
}
