import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserIndustry() {
  const [industry, setIndustry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from("profiles")
        .select("industry")
        .eq("id", user.id)
        .maybeSingle();

      setIndustry(data?.industry ?? null);
      setLoading(false);
    };
    fetch();
  }, []);

  const isServiceIndustry = industry === "vvs" || industry === "elektriker";

  return { industry, isServiceIndustry, loading };
}
