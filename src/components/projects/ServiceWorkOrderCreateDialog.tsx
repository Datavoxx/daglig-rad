import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DefaultData {
  projectName: string;
  clientName: string;
  clientPhone: string;
  address: string;
  description: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onCreated: () => void;
  defaultData?: DefaultData;
}

const emptyForm = {
  title: "",
  description: "",
  customer_name: "",
  customer_phone: "",
  customer_address: "",
  assigned_to: "",
};

function buildFormFromDefault(d: DefaultData) {
  return {
    title: d.projectName,
    description: d.description,
    customer_name: d.clientName,
    customer_phone: d.clientPhone,
    customer_address: d.address,
    assigned_to: "",
  };
}

export default function ServiceWorkOrderCreateDialog({ open, onOpenChange, projectId, onCreated, defaultData }: Props) {
  const hasDefault = defaultData && (defaultData.clientName || defaultData.projectName);
  const [saving, setSaving] = useState(false);
  const [useProjectData, setUseProjectData] = useState(true);
  const [form, setForm] = useState(emptyForm);

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      if (hasDefault && useProjectData) {
        setForm(buildFormFromDefault(defaultData!));
      } else {
        setForm(emptyForm);
      }
    }
  }, [open]);

  // Update form when defaultData changes (e.g. async phone/scope loaded)
  useEffect(() => {
    if (open && hasDefault && useProjectData && defaultData) {
      setForm(prev => ({
        ...prev,
        customer_phone: defaultData.clientPhone || prev.customer_phone,
        description: defaultData.description || prev.description,
      }));
    }
  }, [defaultData?.clientPhone, defaultData?.description]);

  const handleToggle = (checked: boolean) => {
    setUseProjectData(checked);
    if (checked && defaultData) {
      setForm(buildFormFromDefault(defaultData));
    } else {
      setForm({ ...emptyForm, assigned_to: form.assigned_to });
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Jobbtitel krävs");
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("project_work_orders")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    const orderNumber = `SJ-${year}-${String((count || 0) + 1).padStart(3, "0")}`;

    const { error } = await supabase.from("project_work_orders").insert({
      project_id: projectId,
      user_id: user.id,
      order_number: orderNumber,
      title: form.title,
      description: form.description || null,
      customer_name: form.customer_name || null,
      customer_phone: form.customer_phone || null,
      customer_address: form.customer_address || null,
      assigned_to: form.assigned_to || null,
      work_order_type: "service",
      status: "planned",
    });

    if (error) {
      toast.error("Kunde inte skapa arbetsorder");
    } else {
      toast.success("Arbetsorder skapad");
      setForm(emptyForm);
      setUseProjectData(true);
      onCreated();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nytt servicejobb</DialogTitle>
        </DialogHeader>

        {hasDefault && (
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <Label htmlFor="use-project-data" className="text-sm cursor-pointer">
              Hämta från projekt
            </Label>
            <Switch
              id="use-project-data"
              checked={useProjectData}
              onCheckedChange={handleToggle}
            />
          </div>
        )}

        <div className="grid gap-3 py-2">
          <div className="space-y-1">
            <Label>Jobbtitel *</Label>
            <Input placeholder="T.ex. Byta värmepump" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Kundnamn</Label>
            <Input placeholder="Namn" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Telefon</Label>
              <Input placeholder="07X-XXX XX XX" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Tilldelad</Label>
              <Input placeholder="Tekniker" value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Adress</Label>
            <Input placeholder="Kundadress" value={form.customer_address} onChange={e => setForm({ ...form, customer_address: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Beskrivning</Label>
            <Textarea placeholder="Vad ska göras?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? "Sparar..." : "Skapa"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
