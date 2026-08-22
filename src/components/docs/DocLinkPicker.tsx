import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Option {
  id: string;
  name: string;
}

interface DocLinkPickerProps {
  projectId: string | null;
  customerId: string | null;
  onChange: (values: { project_id: string | null; customer_id: string | null }) => void;
}

const NONE = "__none__";

export function DocLinkPicker({ projectId, customerId, onChange }: DocLinkPickerProps) {
  const [projects, setProjects] = useState<Option[]>([]);
  const [customers, setCustomers] = useState<Option[]>([]);

  useEffect(() => {
    const load = async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("projects").select("id, name").order("created_at", { ascending: false }),
        supabase.from("customers").select("id, name").order("name"),
      ]);
      setProjects((p ?? []) as Option[]);
      setCustomers((c ?? []) as Option[]);
    };
    load();
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-[13px]">Projekt</Label>
        <Select
          value={projectId ?? NONE}
          onValueChange={(value) =>
            onChange({ project_id: value === NONE ? null : value, customer_id: customerId })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Inget projekt" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Inget projekt</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[13px]">Kund</Label>
        <Select
          value={customerId ?? NONE}
          onValueChange={(value) =>
            onChange({ project_id: projectId, customer_id: value === NONE ? null : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Ingen kund" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Ingen kund</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
