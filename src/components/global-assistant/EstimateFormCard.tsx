import { useState } from "react";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { VoiceFormSection } from "./VoiceFormSection";

interface Customer {
  id: string;
  name: string;
}

interface EstimateFormData {
  customerId: string;
  title: string;
  address: string;
}

interface EstimateFormCardProps {
  customers: Customer[];
  onSubmit: (data: EstimateFormData) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function EstimateFormCard({
  customers,
  onSubmit,
  onCancel,
  disabled,
}: EstimateFormCardProps) {
  const [customerId, setCustomerId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const handleVoiceData = (data: Record<string, unknown>) => {
    if (typeof data.title === "string") setTitle(data.title);
    if (typeof data.address === "string") setAddress(data.address);
  };

  const handleSubmit = () => {
    if (!customerId || !title) return;
    
    onSubmit({
      customerId,
      title,
      address,
    });
  };

  const isValid = customerId && title.trim();

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-border/60 bg-card p-4 shadow-sm",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">Skapa offert</h3>
      </div>

      {/* Voice Form Section */}
      <div className="mb-4">
        <VoiceFormSection
          formType="estimate"
          onDataExtracted={handleVoiceData}
          disabled={disabled}
          requiredSelection="customer"
          selectionMade={!!customerId}
        />
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Customer selector */}
        <div className="space-y-1.5">
          <Label htmlFor="customer" className="text-xs text-muted-foreground">
            Kund
          </Label>
          <Select value={customerId} onValueChange={setCustomerId} disabled={disabled}>
            <SelectTrigger id="customer" className="w-full">
              <SelectValue placeholder="Välj kund..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs text-muted-foreground">
            Projektnamn / Titel
          </Label>
          <Input
            id="title"
            placeholder="T.ex. Badrumsrenovering"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-xs text-muted-foreground">
            Adress (valfritt)
          </Label>
          <Input
            id="address"
            placeholder="Projektadress..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={disabled}
          className="text-muted-foreground"
        >
          <X className="mr-1.5 h-3.5 w-3.5" />
          Avbryt
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={disabled || !isValid}
          className="gap-1.5"
        >
          <FileText className="h-3.5 w-3.5" />
          Skapa offert
        </Button>
      </div>
    </div>
  );
}
