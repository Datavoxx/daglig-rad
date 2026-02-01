import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressAutocomplete, AddressData } from "@/components/shared/AddressAutocomplete";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  customer_type: string;
  customer_number: string | null;
  org_number: string | null;
  visit_address: string | null;
  invoice_address: string | null;
  notes: string | null;
  mobile: string | null;
  phone: string | null;
  website: string | null;
  postal_code: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSuccess: () => void;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerFormDialogProps) {
  const [saving, setSaving] = useState(false);
  const [showMoreFields, setShowMoreFields] = useState(false);

  // Basic fields
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formAddressData, setFormAddressData] = useState<AddressData | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formType, setFormType] = useState("business");

  // Extended fields
  const [formCustomerNumber, setFormCustomerNumber] = useState("");
  const [formOrgNumber, setFormOrgNumber] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formWebsite, setFormWebsite] = useState("");
  const [formVisitAddress, setFormVisitAddress] = useState("");
  const [formInvoiceAddress, setFormInvoiceAddress] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Populate form when customer changes
  useEffect(() => {
    if (customer) {
      setFormName(customer.name);
      setFormAddress(customer.address || "");
      setFormEmail(customer.email || "");
      setFormType(customer.customer_type);
      setFormCustomerNumber(customer.customer_number || "");
      setFormOrgNumber(customer.org_number || "");
      setFormMobile(customer.mobile || "");
      setFormPhone(customer.phone || "");
      setFormWebsite(customer.website || "");
      setFormVisitAddress(customer.visit_address || "");
      setFormInvoiceAddress(customer.invoice_address || "");
      setFormNotes(customer.notes || "");
      
      // Auto-expand if customer has extended fields
      const hasExtendedFields = customer.customer_number || customer.org_number || 
        customer.mobile || customer.phone || customer.website || 
        customer.visit_address || customer.invoice_address || customer.notes;
      setShowMoreFields(!!hasExtendedFields);
    } else {
      resetForm();
    }
  }, [customer, open]);

  function resetForm() {
    setFormName("");
    setFormAddress("");
    setFormAddressData(null);
    setFormEmail("");
    setFormType("business");
    setFormCustomerNumber("");
    setFormOrgNumber("");
    setFormMobile("");
    setFormPhone("");
    setFormWebsite("");
    setFormVisitAddress("");
    setFormInvoiceAddress("");
    setFormNotes("");
    setShowMoreFields(false);
  }

  function handleClose(open: boolean) {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
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
        customer_number: formCustomerNumber.trim() || null,
        org_number: formOrgNumber.trim() || null,
        mobile: formMobile.trim() || null,
        phone: formPhone.trim() || null,
        website: formWebsite.trim() || null,
        visit_address: formVisitAddress.trim() || null,
        invoice_address: formInvoiceAddress.trim() || null,
        notes: formNotes.trim() || null,
      };

      if (customer) {
        const { error } = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", customer.id);

        if (error) throw error;
        toast.success("Kund uppdaterad");
      } else {
        const { error } = await supabase
          .from("customers")
          .insert({ ...customerData, user_id: user.id });

        if (error) throw error;
        toast.success("Kund skapad");
      }

      handleClose(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("Kunde inte spara kund");
    } finally {
      setSaving(false);
    }
  }

  const isEditing = !!customer;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Redigera kund" : "Lägg till kund"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Uppdatera kundens uppgifter"
              : "Fyll i uppgifter för den nya kunden"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="space-y-4 py-4">
            {/* Basic fields */}
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

            {/* Expandable fields section */}
            <Collapsible open={showMoreFields} onOpenChange={setShowMoreFields}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="w-full justify-between text-muted-foreground hover:text-foreground"
                >
                  {showMoreFields ? "Färre fält" : "Fler fält"}
                  {showMoreFields ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerNumber">Kundnummer</Label>
                    <Input
                      id="customerNumber"
                      placeholder="t.ex. C1066"
                      value={formCustomerNumber}
                      onChange={(e) => setFormCustomerNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgNumber">Org.nr/Pers.nr</Label>
                    <Input
                      id="orgNumber"
                      placeholder="556123-4567"
                      value={formOrgNumber}
                      onChange={(e) => setFormOrgNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobilnummer</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      placeholder="070-123 45 67"
                      value={formMobile}
                      onChange={(e) => setFormMobile(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="08-123 45 67"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Hemsida</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="www.example.se"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visitAddress">Besöksadress</Label>
                  <Input
                    id="visitAddress"
                    placeholder="Storgatan 12"
                    value={formVisitAddress}
                    onChange={(e) => setFormVisitAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceAddress">Fakturaadress</Label>
                  <Input
                    id="invoiceAddress"
                    placeholder="Fakturavägen 1"
                    value={formInvoiceAddress}
                    onChange={(e) => setFormInvoiceAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Anteckningar</Label>
                  <Textarea
                    id="notes"
                    placeholder="Övriga anteckningar om kunden..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEditing ? "Spara" : "Lägg till"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
