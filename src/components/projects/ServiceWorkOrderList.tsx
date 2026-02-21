import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ServiceWorkOrderCreateDialog from "./ServiceWorkOrderCreateDialog";
import ServiceWorkOrderView from "./ServiceWorkOrderView";

interface ServiceWorkOrder {
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
  work_order_type: string | null;
  invoice_id: string | null;
}

interface Props {
  projectId: string;
  projectName: string;
  clientName?: string | null;
  address?: string | null;
  estimateId?: string | null;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  planned: { label: "Planerad", variant: "secondary" },
  in_progress: { label: "Pågående", variant: "default" },
  waiting: { label: "Väntar", variant: "outline" },
  completed: { label: "Klar", variant: "default" },
  invoiced: { label: "Fakturerad", variant: "secondary" },
};

export default function ServiceWorkOrderList({ projectId, projectName, clientName, address, estimateId }: Props) {
  const [orders, setOrders] = useState<ServiceWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [estimateScope, setEstimateScope] = useState("");

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("project_work_orders")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Kunde inte hämta arbetsorder");
    } else {
      setOrders((data || []) as ServiceWorkOrder[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [projectId]);

  // Fetch customer phone and estimate scope when dialog opens
  useEffect(() => {
    if (!createOpen) return;

    const fetchExtra = async () => {
      // Fetch customer phone
      if (clientName) {
        const { data: cust } = await supabase
          .from("customers")
          .select("phone, mobile")
          .ilike("name", clientName)
          .limit(1);
        if (cust && cust.length > 0) {
          setCustomerPhone(cust[0].phone || cust[0].mobile || "");
        }
      }

      // Fetch estimate scope
      if (estimateId) {
        const { data: est } = await supabase
          .from("project_estimates")
          .select("scope")
          .eq("id", estimateId)
          .maybeSingle();
        if (est?.scope) {
          setEstimateScope(est.scope);
        }
      }
    };

    fetchExtra();
  }, [createOpen, clientName, estimateId]);

  const selectedOrder = orders.find(o => o.id === selectedId);

  if (selectedOrder) {
    return (
      <ServiceWorkOrderView
        workOrder={selectedOrder}
        projectId={projectId}
        projectName={projectName}
        onBack={() => setSelectedId(null)}
        onRefresh={fetchOrders}
      />
    );
  }

  const defaultData = {
    projectName: projectName || "",
    clientName: clientName || "",
    clientPhone: customerPhone,
    address: address || "",
    description: estimateScope,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Servicejobb</h3>
          <p className="text-sm text-muted-foreground">Arbetsorder för kundjobb</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nytt jobb
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4"><div className="h-4 bg-muted rounded w-1/3 mb-2" /><div className="h-3 bg-muted rounded w-2/3" /></CardContent>
            </Card>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-medium">Inga servicejobb</h3>
          <p className="text-sm text-muted-foreground mt-1">Skapa ditt första servicejobb</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const st = statusMap[order.status] || { label: order.status, variant: "secondary" as const };
            return (
              <Card
                key={order.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setSelectedId(order.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <p className="font-medium truncate">{order.title}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {order.customer_name && (
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{order.customer_name}</span>
                        )}
                        {order.customer_phone && (
                          <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 text-primary" onClick={e => e.stopPropagation()}>
                            <Phone className="h-3 w-3" />{order.customer_phone}
                          </a>
                        )}
                        {order.assigned_to && <span>Tekniker: {order.assigned_to}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ServiceWorkOrderCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        onCreated={fetchOrders}
        defaultData={defaultData}
      />
    </div>
  );
}
