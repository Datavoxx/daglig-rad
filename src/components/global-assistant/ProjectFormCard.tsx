import { useState } from "react";
import { FolderKanban, X } from "lucide-react";
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

interface Customer {
  id: string;
  name: string;
}

interface ProjectFormData {
  name: string;
  customerId: string;
  address: string;
}

interface ProjectFormCardProps {
  customers: Customer[];
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function ProjectFormCard({
  customers,
  onSubmit,
  onCancel,
  disabled,
}: ProjectFormCardProps) {
  const [name, setName] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [address, setAddress] = useState<string>("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      customerId: customerId === "none" ? "" : customerId,
      address: address.trim(),
    });
  };

  const isValid = name.trim().length > 0;

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
          <FolderKanban className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">Skapa projekt</h3>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Project name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs text-muted-foreground">
            Projektnamn <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="T.ex. Köksrenovering Andersson"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Customer selector */}
        <div className="space-y-1.5">
          <Label htmlFor="customer" className="text-xs text-muted-foreground">
            Kund (valfritt)
          </Label>
          <Select value={customerId} onValueChange={setCustomerId} disabled={disabled}>
            <SelectTrigger id="customer" className="w-full">
              <SelectValue placeholder="Välj kund..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ingen kund</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <FolderKanban className="h-3.5 w-3.5" />
          Skapa projekt
        </Button>
      </div>
    </div>
  );
}
