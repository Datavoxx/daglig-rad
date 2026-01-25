import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Calculator, ExternalLink, Link2, Pencil, Save, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  estimate_id: string | null;
  start_date: string | null;
  budget: number | null;
  status: string | null;
  created_at: string;
}

interface Estimate {
  id: string;
  offer_number: string | null;
  manual_project_name: string | null;
  total_incl_vat: number | null;
  status: string;
}

interface ProjectOverviewTabProps {
  project: Project;
  onUpdate: () => void;
}

export default function ProjectOverviewTab({ project, onUpdate }: ProjectOverviewTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [linkedEstimate, setLinkedEstimate] = useState<Estimate | null>(null);
  const [formData, setFormData] = useState({
    estimate_id: project.estimate_id || "",
    start_date: project.start_date ? parseISO(project.start_date) : undefined as Date | undefined,
    budget: project.budget?.toString() || "",
    status: project.status || "planning",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEstimates();
  }, []);

  useEffect(() => {
    if (project.estimate_id && estimates.length > 0) {
      const linked = estimates.find(e => e.id === project.estimate_id);
      setLinkedEstimate(linked || null);
    }
  }, [project.estimate_id, estimates]);

  const fetchEstimates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("project_estimates")
      .select("id, offer_number, manual_project_name, total_incl_vat, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setEstimates(data);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from("projects")
      .update({
        estimate_id: formData.estimate_id && formData.estimate_id !== "none" ? formData.estimate_id : null,
        start_date: formData.start_date ? format(formData.start_date, "yyyy-MM-dd") : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: formData.status,
      })
      .eq("id", project.id);

    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Projekt uppdaterat" });
      setIsEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Project Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Projektinformation</CardTitle>
            <CardDescription>Grundläggande projektdata</CardDescription>
          </div>
          {!isEditing ? (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Linked Estimate */}
          <div className="space-y-2">
            <Label>Kopplad offert</Label>
            {isEditing ? (
              <Select
                value={formData.estimate_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, estimate_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj offert..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen koppling</SelectItem>
                  {estimates.map((est) => (
                    <SelectItem key={est.id} value={est.id}>
                      {est.offer_number || est.manual_project_name || "Offert"} - {formatCurrency(est.total_incl_vat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : linkedEstimate ? (
              <div 
                className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors group"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("estimateId", linkedEstimate.id);
                  if (linkedEstimate.offer_number) {
                    params.set("offerNumber", linkedEstimate.offer_number);
                  }
                  navigate(`/estimates?${params.toString()}`);
                }}
              >
                <Link2 className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                <span className="group-hover:underline">
                  {linkedEstimate.offer_number || linkedEstimate.manual_project_name}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Ingen offert kopplad</p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Startdatum</Label>
            {isEditing ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(formData.start_date, "PPP", { locale: sv }) : "Välj datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date}
                    onSelect={(date) => setFormData({ ...formData, start_date: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <p className="text-sm">
                {project.start_date 
                  ? format(parseISO(project.start_date), "PPP", { locale: sv })
                  : "-"
                }
              </p>
            )}
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label>Budget</Label>
            {isEditing ? (
              <Input
                type="number"
                placeholder="Ange budget..."
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            ) : (
              <p className="text-sm">{formatCurrency(project.budget)}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            {isEditing ? (
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planering</SelectItem>
                  <SelectItem value="active">Pågående</SelectItem>
                  <SelectItem value="completed">Avslutat</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm">
                {project.status === 'planning' ? 'Planering' : 
                 project.status === 'active' ? 'Pågående' : 
                 project.status === 'completed' ? 'Avslutat' : project.status || '-'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Ekonomisk översikt
          </CardTitle>
          <CardDescription>Budget och offertbelopp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Offertbelopp</span>
            <span className="font-medium">{formatCurrency(linkedEstimate?.total_incl_vat || null)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-sm text-muted-foreground">Budget</span>
            <span className="font-medium">{formatCurrency(project.budget)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">Differens</span>
            <span className={cn(
              "font-medium",
              project.budget && linkedEstimate?.total_incl_vat && project.budget < linkedEstimate.total_incl_vat
                ? "text-destructive"
                : "text-green-600"
            )}>
              {project.budget && linkedEstimate?.total_incl_vat
                ? formatCurrency(project.budget - linkedEstimate.total_incl_vat)
                : "-"
              }
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
