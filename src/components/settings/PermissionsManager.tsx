import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MODULES: { key: string; label: string }[] = [
  { key: "dashboard", label: "Översikt" },
  { key: "projects", label: "Projekt" },
  { key: "estimates", label: "Offerter" },
  { key: "customers", label: "Kunder" },
  { key: "invoices", label: "Fakturor" },
  { key: "accounting", label: "Bokföring" },
  { key: "receipts", label: "Kvitton" },
  { key: "time-reporting", label: "Tidrapportering" },
  { key: "attendance", label: "Personalliggare" },
  { key: "daily-reports", label: "Dagbok" },
  { key: "payroll-export", label: "Löneexport" },
  { key: "inspections", label: "Egenkontroller" },
  { key: "docs", label: "Docs" },
  { key: "guide", label: "Guide" },
  { key: "settings", label: "Inställningar" },
];

interface PermissionRow {
  id: string;
  user_id: string;
  email: string | null;
  modules: string[];
}

export function PermissionsManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<PermissionRow[]>([]);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("user_permissions")
      .select("id, user_id, email, modules")
      .order("email", { ascending: true });

    if (error) {
      toast({ title: "Kunde inte hämta behörigheter", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data ?? []).map((r) => ({ ...r, modules: r.modules ?? [] })) as PermissionRow[]);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id: string, moduleKey: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              modules: r.modules.includes(moduleKey)
                ? r.modules.filter((m) => m !== moduleKey)
                : [...r.modules, moduleKey],
            }
          : r
      )
    );
  };

  const save = async (row: PermissionRow) => {
    setSavingId(row.id);
    const { error } = await supabase
      .from("user_permissions")
      .update({ modules: row.modules })
      .eq("id", row.id);
    setSavingId(null);

    if (error) {
      toast({ title: "Kunde inte spara", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Behörigheter sparade", description: row.email ?? row.user_id });
  };

  const filtered = rows.filter((r) =>
    (r.email ?? r.user_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Behörigheter</h2>
        <p className="text-sm text-muted-foreground">
          Styr exakt vilka moduler varje konto ser i menyn.
        </p>
      </div>

      <Input
        placeholder="Sök e-postadress..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="space-y-4">
        {filtered.map((row) => (
          <Card key={row.id}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{row.email ?? "(ingen e-post)"}</CardTitle>
                  <CardDescription className="font-mono text-xs">{row.user_id}</CardDescription>
                </div>
                <Button size="sm" onClick={() => save(row)} disabled={savingId === row.id}>
                  <Save className="mr-2 h-4 w-4" />
                  Spara
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {MODULES.map((m) => (
                  <label
                    key={m.key}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={row.modules.includes(m.key)}
                      onCheckedChange={() => toggle(row.id, m.key)}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">Inga konton matchar sökningen.</p>
        )}
      </div>
    </div>
  );
}
