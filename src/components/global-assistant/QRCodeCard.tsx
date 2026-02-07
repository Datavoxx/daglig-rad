import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface QRCodeCardProps {
  content: string;
  token: string;
  url: string;
  projectId?: string;
}

export function QRCodeCard({ content, token, url }: QRCodeCardProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Länk kopierad!");
    } catch {
      toast.error("Kunde inte kopiera länken");
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-kod-${token.slice(0, 8)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast.success("QR-kod nedladdad!");
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleOpenLink = () => {
    window.open(url, "_blank");
  };

  return (
    <Card className="p-4 space-y-4">
      {content && (
        <p className="text-sm text-muted-foreground">{content}</p>
      )}
      
      <div className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG
            id="qr-code-svg"
            value={url}
            size={200}
            level="H"
            includeMargin
          />
        </div>
        
        <p className="text-xs text-muted-foreground text-center break-all max-w-[250px]">
          {url}
        </p>
        
        <div className="flex gap-2 flex-wrap justify-center">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" />
            Kopiera länk
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Ladda ner
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenLink}>
            <ExternalLink className="h-4 w-4 mr-1" />
            Öppna
          </Button>
        </div>
      </div>
    </Card>
  );
}
