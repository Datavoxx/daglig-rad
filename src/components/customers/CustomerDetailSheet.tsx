import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  User,
  Mail,
  Phone,
  Smartphone,
  Globe,
  MapPin,
  FileText,
  Hash,
  Briefcase,
  Pencil,
  Trash2,
} from "lucide-react";

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

interface CustomerDetailSheetProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

function DetailItem({
  icon: Icon,
  label,
  value,
  isLink,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null;
  isLink?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        {isLink ? (
          <a
            href={value.startsWith("http") ? value : `https://${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // Check if any children have content
  const hasContent = Array.isArray(children)
    ? children.some((child) => child !== null)
    : children !== null;

  if (!hasContent) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function CustomerDetailSheet({
  customer,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: CustomerDetailSheetProps) {
  if (!customer) return null;

  const hasContactInfo = customer.email || customer.mobile || customer.phone || customer.website;
  const hasAddresses = customer.address || customer.visit_address || customer.invoice_address;
  const hasCompanyInfo = customer.org_number || customer.customer_number;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              {customer.customer_type === "business" ? (
                <Building2 className="h-6 w-6 text-primary" />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="space-y-1 min-w-0">
              <SheetTitle className="text-left break-words">
                {customer.name}
              </SheetTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={
                    customer.customer_type === "business"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                      : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                  }
                >
                  {customer.customer_type === "business" ? "Företag" : "Privat"}
                </Badge>
                {customer.customer_number && (
                  <span className="text-xs text-muted-foreground">
                    {customer.customer_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pb-20">
          {hasContactInfo && (
            <DetailSection title="Kontaktuppgifter">
              <DetailItem icon={Mail} label="E-post" value={customer.email} />
              <DetailItem icon={Smartphone} label="Mobil" value={customer.mobile} />
              <DetailItem icon={Phone} label="Telefon" value={customer.phone} />
              <DetailItem
                icon={Globe}
                label="Hemsida"
                value={customer.website}
                isLink
              />
            </DetailSection>
          )}

          {hasAddresses && (
            <DetailSection title="Adresser">
              <DetailItem
                icon={MapPin}
                label="Postadress"
                value={
                  customer.address
                    ? customer.postal_code && customer.city
                      ? `${customer.address}, ${customer.postal_code} ${customer.city}`
                      : customer.address
                    : null
                }
              />
              <DetailItem
                icon={MapPin}
                label="Besöksadress"
                value={customer.visit_address}
              />
              <DetailItem
                icon={FileText}
                label="Fakturaadress"
                value={customer.invoice_address}
              />
            </DetailSection>
          )}

          {hasCompanyInfo && (
            <DetailSection title="Företagsinfo">
              <DetailItem
                icon={Briefcase}
                label="Org.nummer"
                value={customer.org_number}
              />
              <DetailItem
                icon={Hash}
                label="Kundnummer"
                value={customer.customer_number}
              />
            </DetailSection>
          )}

          {customer.notes && (
            <DetailSection title="Anteckningar">
              <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                {customer.notes}
              </div>
            </DetailSection>
          )}

          {!hasContactInfo && !hasAddresses && !hasCompanyInfo && !customer.notes && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Inga ytterligare uppgifter</p>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
          <Separator className="mb-4" />
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onEdit(customer);
                onOpenChange(false);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Redigera
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(customer);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
