import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  mobile: string | null;
}

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateJobDialog({ open, onOpenChange, onCreated }: CreateJobDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const fetchCustomers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("customers")
      .select("id, name, address, postal_code, city, phone, mobile")
      .eq("user_id", user.id)
      .order("name");
    setCustomers(data || []);
  };

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setAddress(customer.address || "");
      setPostalCode(customer.postal_code || "");
      setCity(customer.city || "");
      setPhone(customer.mobile || customer.phone || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Ange en jobbtitel", variant: "destructive" });
      return;
    }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Du måste vara inloggad", variant: "destructive" });
      setSaving(false);
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);

    // Create project (backend model)
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: title,
        client_name: customer?.name || null,
        address: address || null,
        postal_code: postalCode || null,
        city: city || null,
        user_id: user.id,
        status: "active",
      })
      .select("id")
      .single();

    if (projectError || !project) {
      toast({ title: "Kunde inte skapa jobb", description: projectError?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    // Create service work order automatically
    const { error: woError } = await supabase
      .from("project_work_orders")
      .insert({
        project_id: project.id,
        user_id: user.id,
        title: title,
        description: description || null,
        customer_name: customer?.name || null,
        customer_phone: phone || null,
        customer_address: address ? `${address}${postalCode ? `, ${postalCode}` : ""}${city ? ` ${city}` : ""}` : null,
        work_order_type: "service",
        status: plannedDate ? "pending" : "in_progress",
        due_date: plannedDate || null,
      });

    if (woError) {
      console.error("Work order creation error:", woError);
    }

    toast({ title: "Jobb skapat!" });
    resetForm();
    onOpenChange(false);
    onCreated();
    setSaving(false);
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setTitle("");
    setDescription("");
    setAddress("");
    setPostalCode("");
    setCity("");
    setPhone("");
    setPlannedDate("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nytt jobb</DialogTitle>
            <DialogDescription>Skapa ett nytt servicejobb snabbt.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Customer */}
            <div className="space-y-1.5">
              <Label>Kund</Label>
              <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj kund..." />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>Jobbtitel *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="T.ex. Elinstallation kök"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Beskrivning</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Kort beskrivning av jobbet..."
                rows={2}
              />
            </div>

            {/* Address row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Adress</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Gatuadress" />
              </div>
              <div className="space-y-1.5">
                <Label>Postnummer</Label>
                <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="123 45" />
              </div>
              <div className="space-y-1.5">
                <Label>Ort</Label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Stad" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label>Telefon</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="070-123 45 67" />
            </div>

            {/* Planned date */}
            <div className="space-y-1.5">
              <Label>Planerat datum (valfritt)</Label>
              <Input type="date" value={plannedDate} onChange={e => setPlannedDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? "Skapar..." : "Skapa jobb"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
