import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressAutocomplete, AddressData } from "@/components/shared/AddressAutocomplete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerImportDialog } from "@/components/customers/CustomerImportDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Users,
  Plus,
  Search,
  MapPin,
  Mail,
  MoreVertical,
  Pencil,
  Trash2,
  Building2,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  customer_type: string;
  created_at: string;
  updated_at: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formAddressData, setFormAddressData] = useState<AddressData | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formType, setFormType] = useState("business");

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setCustomers([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Kunde inte hämta kunder");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormAddress("");
    setFormAddressData(null);
    setFormEmail("");
    setFormType("business");
    setEditingCustomer(null);
  }

  function openEditDialog(customer: Customer) {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormAddress(customer.address || "");
    setFormEmail(customer.email || "");
    setFormType(customer.customer_type);
    setDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    if (!open) {
      resetForm();
    }
    setDialogOpen(open);
  }

  async function handleSave() {
    if (!formName.trim()) {
      toast.error("Namn är obligatoriskt");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Ej inloggad");

      const customerData = {
        name: formName.trim(),
        address: formAddress.trim() || null,
        postal_code: formAddressData?.postalCode || null,
        city: formAddressData?.city || null,
        latitude: formAddressData?.latitude || null,
        longitude: formAddressData?.longitude || null,
        email: formEmail.trim() || null,
        customer_type: formType,
      };

      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", editingCustomer.id);

        if (error) throw error;
        toast.success("Kund uppdaterad");
      } else {
        const { error } = await supabase
          .from("customers")
          .insert({ ...customerData, user_id: user.id });

        if (error) throw error;
        toast.success("Kund skapad");
      }

      setDialogOpen(false);
      resetForm();
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Kunde inte spara kund");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer: Customer) {
    if (!confirm(`Vill du verkligen ta bort ${customer.name}?`)) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id);

      if (error) throw error;
      toast.success("Kund borttagen");
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("Kunde inte ta bort kund");
    }
  }

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kunder</h1>
          <p className="text-muted-foreground">
            Hantera dina kunduppgifter
          </p>
        </div>
        <div className="flex gap-2">
          <CustomerImportDialog onImportComplete={fetchCustomers} />
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Ny kund
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Redigera kund" : "Lägg till kund"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer
                  ? "Uppdatera kundens uppgifter"
                  : "Fyll i uppgifter för den nya kunden"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Namn *</Label>
                <Input
                  id="name"
                  placeholder="Kundens namn"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adress</Label>
                <AddressAutocomplete
                  id="address"
                  placeholder="Sök adress..."
                  value={formAddress}
                  onChange={setFormAddress}
                  onStructuredChange={setFormAddressData}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="kund@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label>Kundtyp</Label>
                <RadioGroup
                  value={formType}
                  onValueChange={setFormType}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="business" id="business" />
                    <Label htmlFor="business" className="flex items-center gap-2 cursor-pointer font-normal">
                      <Building2 className="h-4 w-4" />
                      Företag
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="private" id="private" />
                    <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer font-normal">
                      <User className="h-4 w-4" />
                      Privat
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogClose(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingCustomer ? "Spara" : "Lägg till"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Sök kunder..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">
            {searchQuery ? "Inga kunder matchade sökningen" : "Inga kunder ännu"}
          </h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            {searchQuery
              ? "Prova att söka på något annat"
              : "Lägg till din första kund för att komma igång"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Lägg till kund
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    {customer.name}
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className={
                      customer.customer_type === "business"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                    }
                  >
                    {customer.customer_type === "business" ? (
                      <><Building2 className="h-3 w-3 mr-1" />Företag</>
                    ) : (
                      <><User className="h-3 w-3 mr-1" />Privat</>
                    )}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(customer)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Redigera
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(customer)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Ta bort
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {customer.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{customer.address}</span>
                  </div>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 shrink-0" />
                    <a
                      href={`mailto:${customer.email}`}
                      className="hover:text-foreground transition-colors hover:underline"
                    >
                      {customer.email}
                    </a>
                  </div>
                )}
                {!customer.address && !customer.email && (
                  <p className="text-muted-foreground/60 italic">
                    Inga kontaktuppgifter
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
