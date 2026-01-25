import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark } from "lucide-react";

export default function Economy() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Ekonomi</h1>
        <p className="page-subtitle">Anslut ditt ekonomisystem</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Landmark className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Integrationer</CardTitle>
              <CardDescription>Koppla ihop Byggio med ditt bokföringssystem</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Anslut din ekonomi för att synkronisera fakturor, kunder och projekt 
            automatiskt mellan Byggio och ditt bokföringsprogram.
          </p>

          {/* Fortnox */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-16 items-center justify-center rounded bg-[#00A76F]/10 px-2">
                <span className="font-bold text-[#00A76F] text-sm">Fortnox</span>
              </div>
              <div>
                <p className="font-medium">Fortnox</p>
                <p className="text-sm text-muted-foreground">Ej ansluten</p>
              </div>
            </div>
            <Button variant="outline" disabled>
              Kommer snart
            </Button>
          </div>

          {/* Visma */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-16 items-center justify-center rounded bg-[#E6007E]/10 px-2">
                <span className="font-bold text-[#E6007E] text-sm">Visma</span>
              </div>
              <div>
                <p className="font-medium">Visma</p>
                <p className="text-sm text-muted-foreground">Ej ansluten</p>
              </div>
            </div>
            <Button variant="outline" disabled>
              Kommer snart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
