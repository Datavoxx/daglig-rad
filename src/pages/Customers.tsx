import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerImportDialog } from "@/components/customers/CustomerImportDialog";
import { CustomerDetailSheet } from "@/components/customers/CustomerDetailSheet";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import {
  Users,
  Plus,
  Search,
  MapPin,
  Mail,
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

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Sheet states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

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

  function handleCustomerClick(customer: Customer) {
    setSelectedCustomer(customer);
    setDetailSheetOpen(true);
  }

  function handleEditCustomer(customer: Customer) {
    setEditingCustomer(customer);
    setFormDialogOpen(true);
  }

  function handleNewCustomer() {
    setEditingCustomer(null);
    setFormDialogOpen(true);
  }

  async function handleDeleteCustomer(customer: Customer) {
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
    customer.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.customer_number?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <Button onClick={handleNewCustomer} className="gap-2">
            <Plus className="h-4 w-4" />
            Ny kund
          </Button>
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
            <Button onClick={handleNewCustomer} className="gap-2">
              <Plus className="h-4 w-4" />
              Lägg till kund
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="group hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleCustomerClick(customer)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold">
                    {customer.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
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
                    {customer.customer_number && (
                      <span className="text-xs text-muted-foreground">
                        {customer.customer_number}
                      </span>
                    )}
                  </div>
                </div>
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
                    <span className="truncate">{customer.email}</span>
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

      {/* Customer Detail Sheet */}
      <CustomerDetailSheet
        customer={selectedCustomer}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
      />

      {/* Customer Form Dialog */}
      <CustomerFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        customer={editingCustomer}
        onSuccess={fetchCustomers}
      />
    </div>
  );
}
