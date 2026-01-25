import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileWarning, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AtaItemFromDiary {
  reason: string;
  consequence: string;
  estimated_hours: number | null;
}

interface AtaFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  ataItems: AtaItemFromDiary[];
  onComplete: () => void;
}

const articleCategories = [
  "Arbete",
  "Bygg",
  "Deponi",
  "El",
  "Maskin",
  "Material",
  "Målning",
  "Plattsättning",
  "VVS",
  "Övrigt",
];

const unitOptions = ["tim", "st", "m", "m²", "m³", "lpm", "kg", "klump"];

interface FormData {
  article: string;
  description: string;
  reason: string;
  unit: string;
  quantity: string;
  unit_price: string;
  rot_eligible: boolean;
}

export function AtaFollowUpDialog({
  open,
  onOpenChange,
  projectId,
  ataItems,
  onComplete,
}: AtaFollowUpDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(ataItems[0]));
  const { toast } = useToast();

  function getInitialFormData(item: AtaItemFromDiary | undefined): FormData {
    return {
      article: "Arbete",
      description: item?.consequence || "",
      reason: item?.reason || "",
      unit: "tim",
      quantity: item?.estimated_hours?.toString() || "",
      unit_price: "",
      rot_eligible: false,
    };
  }

  const currentItem = ataItems[currentIndex];
  const totalItems = ataItems.length;
  const isLast = currentIndex === totalItems - 1;

  const generateAtaNumber = async () => {
    const { count } = await supabase
      .from("project_ata")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);
    
    const year = new Date().getFullYear();
    const num = (count || 0) + 1;
    return `ÄTA-${year}-${String(num).padStart(3, "0")}`;
  };

  const handleSaveAndNext = async () => {
    if (!formData.description.trim()) {
      toast({ title: "Beskrivning krävs", variant: "destructive" });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Du måste vara inloggad", variant: "destructive" });
        setSaving(false);
        return;
      }

      const ataNumber = await generateAtaNumber();
      const quantity = formData.quantity ? parseFloat(formData.quantity) : 1;
      const unitPrice = formData.unit_price ? parseFloat(formData.unit_price) : 0;
      const subtotal = quantity * unitPrice;

      const payload = {
        project_id: projectId,
        user_id: user.id,
        ata_number: ataNumber,
        article: formData.article,
        description: formData.description,
        reason: formData.reason || null,
        unit: formData.unit,
        quantity,
        unit_price: unitPrice,
        subtotal,
        rot_eligible: formData.rot_eligible,
        status: "pending",
        estimated_hours: formData.unit === "tim" ? quantity : null,
        estimated_cost: subtotal > 0 ? subtotal : null,
      };

      const { error } = await supabase.from("project_ata").insert(payload);

      if (error) throw error;

      toast({ title: `ÄTA ${currentIndex + 1} av ${totalItems} skapad` });

      if (isLast) {
        onComplete();
        onOpenChange(false);
      } else {
        const nextItem = ataItems[currentIndex + 1];
        setFormData(getInitialFormData(nextItem));
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: "Kunde inte skapa ÄTA",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (isLast) {
      onComplete();
      onOpenChange(false);
    } else {
      const nextItem = ataItems[currentIndex + 1];
      setFormData(getInitialFormData(nextItem));
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (!currentItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-info" />
            <DialogTitle>ÄTA från arbetsdagbok</DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="secondary">
              {currentIndex + 1} av {totalItems}
            </Badge>
            Fyll i detaljer för fakturering
          </DialogDescription>
        </DialogHeader>

        {/* Original info from diary */}
        <div className="rounded-lg border border-info/20 bg-info/5 p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Från dagboken:
          </p>
          <p className="text-sm">{currentItem.reason}</p>
          {currentItem.consequence && (
            <p className="text-sm text-muted-foreground">{currentItem.consequence}</p>
          )}
        </div>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Artikel</Label>
              <Select
                value={formData.article}
                onValueChange={(value) => setFormData({ ...formData, article: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {articleCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Enhet</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Beskrivning *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Beskriv arbetet..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Anledning</Label>
            <Input
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Varför behövs detta?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Antal</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label>À-pris (valfritt)</Label>
              <Input
                type="number"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="rot"
              checked={formData.rot_eligible}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, rot_eligible: checked === true })
              }
            />
            <Label htmlFor="rot" className="cursor-pointer">
              ROT-avdrag
            </Label>
          </div>

          {formData.quantity && formData.unit_price && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-sm text-muted-foreground">Beräknad summa:</span>
              <span className="font-semibold tabular-nums">
                {new Intl.NumberFormat("sv-SE", {
                  style: "currency",
                  currency: "SEK",
                  maximumFractionDigits: 0,
                }).format(parseFloat(formData.quantity) * parseFloat(formData.unit_price))}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip}>
            Hoppa över
          </Button>
          <Button onClick={handleSaveAndNext} disabled={saving}>
            {saving ? "Sparar..." : isLast ? "Spara & Slutför" : "Spara & Nästa"}
            {!isLast && <ChevronRight className="ml-1 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
