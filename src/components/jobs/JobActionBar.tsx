import { Button } from "@/components/ui/button";
import { Clock, Package, Image, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  onAddTime: () => void;
  onAddMaterial: () => void;
  onAddImage: () => void;
  onCreateInvoice: () => void;
  showInvoice: boolean;
}

export default function JobActionBar({ onAddTime, onAddMaterial, onAddImage, onCreateInvoice, showInvoice }: Props) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t px-3 py-2 flex gap-2 justify-around">
      <Button variant="ghost" size="sm" className="flex-col gap-0.5 h-auto py-1.5 text-xs" onClick={onAddTime}>
        <Clock className="h-4 w-4" />
        Tid
      </Button>
      <Button variant="ghost" size="sm" className="flex-col gap-0.5 h-auto py-1.5 text-xs" onClick={onAddMaterial}>
        <Package className="h-4 w-4" />
        Material
      </Button>
      <Button variant="ghost" size="sm" className="flex-col gap-0.5 h-auto py-1.5 text-xs" onClick={onAddImage}>
        <Image className="h-4 w-4" />
        Bild
      </Button>
      {showInvoice && (
        <Button variant="ghost" size="sm" className="flex-col gap-0.5 h-auto py-1.5 text-xs text-primary" onClick={onCreateInvoice}>
          <FileText className="h-4 w-4" />
          Faktura
        </Button>
      )}
    </div>
  );
}
