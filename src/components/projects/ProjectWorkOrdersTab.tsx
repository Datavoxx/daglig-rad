import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, MoreHorizontal, Pencil, Trash2, Download, CalendarIcon } from "lucide-react";
import { VoicePromptButton } from "@/components/shared/VoicePromptButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { generateWorkOrderPdf } from "@/lib/generateWorkOrderPdf";

interface WorkOrder {
  id: string;
  order_number: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
  created_at: string;
  estimate_id: string | null;
}

interface ProjectWorkOrdersTabProps {
  projectId: string;
  projectName: string;
  estimateId?: string | null;
}

export default function ProjectWorkOrdersTab({ projectId, projectName, estimateId }: ProjectWorkOrdersTabProps) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: undefined as Date | undefined,
    status: "pending",
  });
  const [isApplyingVoice, setIsApplyingVoice] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();


  useEffect(() => {
    fetchWorkOrders();
  }, [projectId]);

  const fetchWorkOrders = async () => {
    const { data, error } = await supabase
      .from("project_work_orders")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Kunde inte hämta arbetsorder", description: error.message, variant: "destructive" });
    } else {
      setWorkOrders(data || []);
    }
    setLoading(false);
  };

  const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const count = workOrders.length + 1;
    return `AO-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({ title: "Titel krävs", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Du måste vara inloggad", variant: "destructive" });
      setSaving(false);
      return;
    }

    const payload = {
      project_id: projectId,
      user_id: user.id,
      order_number: editingOrder?.order_number || generateOrderNumber(),
      title: formData.title,
      description: formData.description || null,
      assigned_to: formData.assigned_to || null,
      due_date: formData.due_date ? format(formData.due_date, "yyyy-MM-dd") : null,
      status: formData.status,
      estimate_id: estimateId || null,
    };

    if (editingOrder) {
      const { error } = await supabase
        .from("project_work_orders")
        .update(payload)
        .eq("id", editingOrder.id);

      if (error) {
        toast({ title: "Kunde inte uppdatera", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Arbetsorder uppdaterad" });
        fetchWorkOrders();
        closeDialog();
      }
    } else {
      const { error } = await supabase.from("project_work_orders").insert(payload);

      if (error) {
        toast({ title: "Kunde inte skapa", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Arbetsorder skapad" });
        fetchWorkOrders();
        closeDialog();
      }
    }

    setSaving(false);
  };

  const handleDelete = async (order: WorkOrder) => {
    const { error } = await supabase.from("project_work_orders").delete().eq("id", order.id);
    if (error) {
      toast({ title: "Kunde inte ta bort", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Arbetsorder borttagen" });
      fetchWorkOrders();
    }
  };

  const handleDownloadPdf = async (order: WorkOrder) => {
    try {
      // Fetch project details
      const { data: projectData } = await supabase
        .from("projects")
        .select("client_name, address, postal_code, city, start_date, estimate_id")
        .eq("id", projectId)
        .maybeSingle();

      // Fetch estimate items if there's a linked estimate
      let estimateItems: Array<{ quantity: number | null; unit: string | null; article: string | null; moment: string }> = [];
      const linkedEstimateId = order.estimate_id || projectData?.estimate_id;
      
      if (linkedEstimateId) {
        const { data: items } = await supabase
          .from("estimate_items")
          .select("quantity, unit, article, moment")
          .eq("estimate_id", linkedEstimateId)
          .order("sort_order");
        
        if (items) {
          estimateItems = items;
        }
      }

      await generateWorkOrderPdf({
        orderNumber: order.order_number || "AO",
        projectName,
        title: order.title,
        description: order.description || "",
        assignedTo: order.assigned_to || "",
        dueDate: order.due_date || null,
        status: order.status,
        clientName: projectData?.client_name || undefined,
        address: projectData?.address || undefined,
        postalCode: projectData?.postal_code || undefined,
        city: projectData?.city || undefined,
        startDate: projectData?.start_date || undefined,
        estimateItems,
      });
      toast({ title: "PDF genererad" });
    } catch (error) {
      toast({ title: "Kunde inte generera PDF", variant: "destructive" });
    }
  };

  const openEdit = (order: WorkOrder) => {
    setEditingOrder(order);
    setFormData({
      title: order.title,
      description: order.description || "",
      assigned_to: order.assigned_to || "",
      due_date: order.due_date ? parseISO(order.due_date) : undefined,
      status: order.status,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingOrder(null);
    setFormData({ title: "", description: "", assigned_to: "", due_date: undefined, status: "pending" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge variant="info">Pågående</Badge>;
      case "completed":
        return <Badge variant="success">Klar</Badge>;
      default:
        return <Badge variant="secondary">Väntande</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Arbetsorder</h3>
          <p className="text-sm text-muted-foreground">Hantera och skriv ut arbetsorder</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={(open) => open ? setDialogOpen(true) : closeDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ny arbetsorder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOrder ? "Redigera arbetsorder" : "Ny arbetsorder"}</DialogTitle>
              <DialogDescription>
                {editingOrder ? "Uppdatera arbetsordern" : "Skapa en ny arbetsorder för projektet"}
              </DialogDescription>
            </DialogHeader>
            {!editingOrder && (
              <VoicePromptButton
                variant="compact"
                agentName="Byggio AI"
                isProcessing={isApplyingVoice}
                onTranscriptComplete={async (transcript) => {
                  setIsApplyingVoice(true);
                  try {
                    const { data, error } = await supabase.functions.invoke("apply-voice-edits", {
                      body: { transcript, documentType: "work_order" },
                    });
                    if (error) throw error;
                    if (data) {
                      setFormData(prev => ({
                        ...prev,
                        title: data.title || prev.title,
                        description: data.description || prev.description,
                        assigned_to: data.assigned_to || prev.assigned_to,
                      }));
                      toast({ title: "Röstdata applicerad" });
                    }
                  } catch (err) {
                    toast({ title: "Kunde inte tolka röstkommandot", variant: "destructive" });
                  } finally {
                    setIsApplyingVoice(false);
                  }
                }}
              />
            )}
            <div className="grid gap-4 py-4">
              
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  placeholder="Vad ska göras?"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea
                  id="description"
                  placeholder="Detaljerad beskrivning..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assigned">Tilldelad</Label>
                <Input
                  id="assigned"
                  placeholder="Namn på ansvarig"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Förfallodatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? format(formData.due_date, "PPP", { locale: sv }) : "Välj datum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.due_date}
                      onSelect={(date) => setFormData({ ...formData, due_date: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="pending">Väntande</SelectItem>
                    <SelectItem value="in_progress">Pågående</SelectItem>
                    <SelectItem value="completed">Klar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Avbryt</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Sparar..." : editingOrder ? "Spara ändringar" : "Skapa arbetsorder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : workOrders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium">Inga arbetsorder</h3>
          <p className="text-sm text-muted-foreground mt-1">Skapa arbetsorder för att organisera arbetet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {workOrders.map((order) => (
            <Card key={order.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{order.order_number}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="font-medium">{order.title}</p>
                    {order.description && <p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>}
                    <div className="flex gap-4 text-sm text-muted-foreground pt-1">
                      {order.assigned_to && <span>Tilldelad: {order.assigned_to}</span>}
                      {order.due_date && <span>Förfaller: {format(parseISO(order.due_date), "d MMM yyyy", { locale: sv })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDownloadPdf(order)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-background border shadow-lg z-50">
                        <DropdownMenuItem onClick={() => openEdit(order)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Redigera
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPdf(order)}>
                          <Download className="mr-2 h-4 w-4" />
                          Ladda ner PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(order)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Ta bort
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
