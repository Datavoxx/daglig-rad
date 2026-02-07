import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

interface CustomerFormCardProps {
  onSubmit: (data: CustomerFormData) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function CustomerFormCard({
  onSubmit,
  onCancel,
  disabled,
}: CustomerFormCardProps) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
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
          <UserPlus className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">Ny kund</h3>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs text-muted-foreground">
            Namn <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Kundens namn..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* Email and Phone row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs text-muted-foreground">
              E-post
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exempel.se"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs text-muted-foreground">
              Telefon
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="070-123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Address and City row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs text-muted-foreground">
              Adress
            </Label>
            <Input
              id="address"
              placeholder="Gatuadress..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city" className="text-xs text-muted-foreground">
              Stad
            </Label>
            <Input
              id="city"
              placeholder="Stad..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={disabled}
            />
          </div>
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
          <UserPlus className="h-3.5 w-3.5" />
          Skapa kund
        </Button>
      </div>
    </div>
  );
}
