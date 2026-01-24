import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddressAutocomplete, AddressData } from "@/components/shared/AddressAutocomplete";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { ArrowLeft, ArrowRight, Plus, User, FileText, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
}

interface EstimateWizardProps {
  onComplete: (data: {
    customerId?: string;
    customerName: string;
    projectName: string;
    address: string;
    postalCode?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  onCancel: () => void;
}

export function EstimateWizard({ onComplete, onCancel }: EstimateWizardProps) {
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [address, setAddress] = useState("");
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("customers")
      .select("id, name, address, city, postal_code")
      .eq("user_id", user.id)
      .order("name");

    if (!error && data) {
      setCustomers(data);
    }
    setIsLoading(false);
  }

  function handleCustomerSelect(customerId: string) {
    if (customerId === "new") {
      setShowCustomerDialog(true);
    } else {
      setSelectedCustomerId(customerId);
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setCustomerName(customer.name);
        if (customer.address) {
          setAddress(customer.address);
          setAddressData({
            formatted: customer.address,
            postalCode: customer.postal_code,
            city: customer.city,
          });
        }
      }
    }
  }

  async function handleCustomerCreated() {
    await fetchCustomers();
    // Select the most recently created customer
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from("customers")
      .select("id, name, address, city, postal_code")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (data?.[0]) {
      setSelectedCustomerId(data[0].id);
      setCustomerName(data[0].name);
      if (data[0].address) {
        setAddress(data[0].address);
        setAddressData({
          formatted: data[0].address,
          postalCode: data[0].postal_code,
          city: data[0].city,
        });
      }
    }
    setShowCustomerDialog(false);
  }

  function handleAddressChange(newAddress: string) {
    setAddress(newAddress);
  }

  function handleStructuredAddressChange(data: AddressData) {
    setAddressData(data);
    setAddress(data.formatted);
  }

  function canProceed() {
    switch (step) {
      case 1:
        return selectedCustomerId;
      case 2:
        return projectName.trim();
      case 3:
        return address.trim();
      default:
        return false;
    }
  }

  function handleNext() {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel();
    }
  }

  function handleComplete() {
    onComplete({
      customerId: selectedCustomerId,
      customerName: customers.find(c => c.id === selectedCustomerId)?.name || "",
      projectName,
      address: addressData?.formatted || address,
      postalCode: addressData?.postalCode,
      city: addressData?.city,
      latitude: addressData?.latitude,
      longitude: addressData?.longitude,
    });
  }

  const stepIndicators = [
    { num: 1, label: "Kund", icon: User },
    { num: 2, label: "Offertnamn", icon: FileText },
    { num: 3, label: "Adress", icon: MapPin },
  ];

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Ny offert</CardTitle>
        <div className="flex items-center gap-2 mt-4">
          {stepIndicators.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  step >= s.num
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <s.icon className="h-4 w-4" />
              </div>
              {i < stepIndicators.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-1 transition-colors ${
                    step > s.num ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <Label>Välj kund</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select
                value={selectedCustomerId}
                onValueChange={handleCustomerSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj befintlig kund..." />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="new">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Ny kund
                    </span>
                  </SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <CustomerFormDialog
          open={showCustomerDialog}
          onOpenChange={setShowCustomerDialog}
          customer={null}
          onSuccess={handleCustomerCreated}
        />

        {step === 2 && (
          <div className="space-y-4">
            <Label htmlFor="projectName">Offertnamn / Projektreferens</Label>
            <Input
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="T.ex. Badrumsrenovering, Tillbyggnad..."
            />
            <p className="text-sm text-muted-foreground">
              Detta blir namnet som visas på offerten
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label htmlFor="address">Projektadress</Label>
            <AddressAutocomplete
              id="address"
              value={address}
              onChange={handleAddressChange}
              onStructuredChange={handleStructuredAddressChange}
              placeholder="Sök adress..."
            />
            <p className="text-sm text-muted-foreground">
              Adressen där arbetet ska utföras
            </p>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 1 ? "Avbryt" : "Tillbaka"}
          </Button>
          <Button onClick={handleNext} disabled={!canProceed()}>
            {step === 3 ? "Skapa offert" : "Nästa"}
            {step < 3 && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
