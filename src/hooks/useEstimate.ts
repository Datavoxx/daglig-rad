import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EstimateItem } from "@/components/estimates/EstimateTable";

export interface EstimateAddon {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_selected: boolean;
  sort_order: number;
}

export interface EstimateState {
  projectId: string;
  templateId: string | null;
  scope: string;
  introductionText: string;
  closingText: string;
  assumptions: string[];
  uncertainties: string[];
  items: EstimateItem[];
  addons: EstimateAddon[];
  markupPercent: number;
  rotEnabled: boolean;
  rotPercent: number;
  transcript: string;
  status: "draft" | "completed";
  // Manual mode fields
  manualProjectName: string;
  manualClientName: string;
  manualAddress: string;
}

export interface ManualEstimateData {
  projectName: string;
  clientName: string;
  address: string;
}

const initialState: EstimateState = {
  projectId: "",
  templateId: null,
  scope: "",
  introductionText: "",
  closingText: "",
  assumptions: [],
  uncertainties: [],
  items: [],
  addons: [],
  markupPercent: 0,
  rotEnabled: false,
  rotPercent: 30,
  transcript: "",
  status: "draft",
  manualProjectName: "",
  manualClientName: "",
  manualAddress: "",
};

export function useEstimate(projectId: string | null, manualData?: ManualEstimateData) {
  const queryClient = useQueryClient();
  const isManualMode = !projectId && !!manualData;
  
  const [state, setState] = useState<EstimateState>(() => ({
    ...initialState,
    projectId: projectId || "",
    manualProjectName: manualData?.projectName || "",
    manualClientName: manualData?.clientName || "",
    manualAddress: manualData?.address || "",
  }));

  // Fetch existing estimate
  const { data: existingEstimate, isLoading } = useQuery({
    queryKey: ["project-estimate", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data: estimate, error } = await supabase
        .from("project_estimates")
        .select("*")
        .eq("project_id", projectId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (!estimate) return null;

      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from("estimate_items")
        .select("*")
        .eq("estimate_id", estimate.id)
        .order("sort_order", { ascending: true });
      
      if (itemsError) throw itemsError;

      // Fetch addons
      const { data: addons, error: addonsError } = await supabase
        .from("estimate_addons")
        .select("*")
        .eq("estimate_id", estimate.id)
        .order("sort_order", { ascending: true });
      
      if (addonsError) throw addonsError;

      return { ...estimate, items: items || [], addons: addons || [] };
    },
    enabled: !!projectId,
  });

  // Load existing estimate into state
  useEffect(() => {
    if (existingEstimate) {
      setState((prev) => ({
        ...prev,
        projectId: projectId || "",
        templateId: existingEstimate.template_id || null,
        scope: existingEstimate.scope || "",
        introductionText: (existingEstimate as any).introduction_text || "",
        closingText: (existingEstimate as any).closing_text || "",
        assumptions: (existingEstimate.assumptions as string[]) || [],
        uncertainties: (existingEstimate.uncertainties as string[]) || [],
        items: existingEstimate.items.map((item: any) => ({
          id: item.id,
          article: item.article || "",
          description: item.description || item.moment || "",
          show_only_total: item.show_only_total || false,
          moment: item.moment,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          hours: item.hours,
          unit_price: Number(item.unit_price) || 0,
          subtotal: Number(item.subtotal) || 0,
          comment: item.comment || "",
          uncertainty: item.uncertainty || "medium",
          sort_order: item.sort_order,
          rot_eligible: item.rot_eligible ?? false,
        })),
        addons: existingEstimate.addons.map((addon: any) => ({
          id: addon.id,
          name: addon.name,
          description: addon.description,
          price: Number(addon.price) || 0,
          is_selected: addon.is_selected || false,
          sort_order: addon.sort_order || 0,
        })),
        markupPercent: Number(existingEstimate.markup_percent) || 15,
        rotEnabled: existingEstimate.rot_enabled || false,
        rotPercent: Number(existingEstimate.rot_percent) || 30,
        transcript: existingEstimate.original_transcript || "",
        status: (existingEstimate.status as "draft" | "completed") || "draft",
        // Preserve manual fields from existing estimate if available
        manualProjectName: (existingEstimate as any).manual_project_name || prev.manualProjectName || "",
        manualClientName: (existingEstimate as any).manual_client_name || prev.manualClientName || "",
        manualAddress: (existingEstimate as any).manual_address || prev.manualAddress || "",
      }));
    } else if (projectId) {
      setState((prev) => ({ ...initialState, projectId, manualProjectName: prev.manualProjectName, manualClientName: prev.manualClientName, manualAddress: prev.manualAddress }));
    } else if (isManualMode) {
      // Manual mode without existing estimate - keep manual data
      setState((prev) => ({
        ...initialState,
        projectId: "",
        manualProjectName: manualData?.projectName || "",
        manualClientName: manualData?.clientName || "",
        manualAddress: manualData?.address || "",
      }));
    }
  }, [existingEstimate, projectId, isManualMode, manualData]);

  // Calculate totals
  const calculateTotals = useCallback(() => {
    const laborCost = state.items
      .filter((item) => item.type === "labor")
      .reduce((sum, item) => sum + (item.subtotal || 0), 0);
    
    // ROT-eligible labor cost (only items marked as rot_eligible)
    const rotEligibleLaborCost = state.items
      .filter((item) => item.type === "labor" && item.rot_eligible)
      .reduce((sum, item) => sum + (item.subtotal || 0), 0);
    
    const materialCost = state.items
      .filter((item) => item.type === "material")
      .reduce((sum, item) => sum + (item.subtotal || 0), 0);
    
    const subcontractorCost = state.items
      .filter((item) => item.type === "subcontractor")
      .reduce((sum, item) => sum + (item.subtotal || 0), 0);

    const addonsCost = state.addons
      .filter((addon) => addon.is_selected)
      .reduce((sum, addon) => sum + addon.price, 0);

    const subtotal = laborCost + materialCost + subcontractorCost + addonsCost;
    const markup = subtotal * (state.markupPercent / 100);
    const totalExclVat = subtotal + markup;
    const vat = totalExclVat * 0.25;
    const totalInclVat = totalExclVat + vat;

    // ROT on ROT-eligible labor with VAT
    const rotEligibleLaborWithVat = rotEligibleLaborCost * 1.25;
    const rotAmount = state.rotEnabled ? rotEligibleLaborWithVat * (state.rotPercent / 100) : 0;
    const amountToPay = totalInclVat - rotAmount;

    return {
      laborCost,
      rotEligibleLaborCost,
      materialCost,
      subcontractorCost,
      addonsCost,
      subtotal,
      markup,
      totalExclVat,
      vat,
      totalInclVat,
      rotAmount,
      amountToPay,
    };

    return {
      laborCost,
      materialCost,
      subcontractorCost,
      addonsCost,
      subtotal,
      markup,
      totalExclVat,
      vat,
      totalInclVat,
      rotAmount,
      amountToPay,
    };
  }, [state.items, state.addons, state.markupPercent, state.rotEnabled, state.rotPercent]);

  // Update functions
  const updateScope = useCallback((scope: string) => {
    setState((prev) => ({ ...prev, scope }));
  }, []);

  const updateIntroduction = useCallback((introductionText: string) => {
    setState((prev) => ({ ...prev, introductionText }));
  }, []);

  const updateClosing = useCallback((closingText: string) => {
    setState((prev) => ({ ...prev, closingText }));
  }, []);

  const updateAssumptions = useCallback((assumptions: string[]) => {
    setState((prev) => ({ ...prev, assumptions }));
  }, []);

  const updateItems = useCallback((items: EstimateItem[]) => {
    setState((prev) => ({ ...prev, items }));
  }, []);

  const updateAddons = useCallback((addons: EstimateAddon[]) => {
    setState((prev) => ({ ...prev, addons }));
  }, []);

  const toggleAddon = useCallback((addonId: string) => {
    setState((prev) => ({
      ...prev,
      addons: prev.addons.map((addon) =>
        addon.id === addonId ? { ...addon, is_selected: !addon.is_selected } : addon
      ),
    }));
  }, []);

  const addAddon = useCallback((name: string, price: number, description?: string) => {
    const newAddon: EstimateAddon = {
      id: crypto.randomUUID(),
      name,
      description,
      price,
      is_selected: false,
      sort_order: state.addons.length,
    };
    setState((prev) => ({ ...prev, addons: [...prev.addons, newAddon] }));
  }, [state.addons.length]);

  const removeAddon = useCallback((addonId: string) => {
    setState((prev) => ({
      ...prev,
      addons: prev.addons.filter((addon) => addon.id !== addonId),
    }));
  }, []);

  const updateMarkup = useCallback((markupPercent: number) => {
    setState((prev) => ({ ...prev, markupPercent }));
  }, []);

  const updateRot = useCallback((enabled: boolean, percent?: number) => {
    setState((prev) => ({
      ...prev,
      rotEnabled: enabled,
      rotPercent: percent ?? prev.rotPercent,
    }));
  }, []);

  const updateTemplateId = useCallback((templateId: string | null) => {
    setState((prev) => ({ ...prev, templateId }));
  }, []);

  const updateManualProjectName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, manualProjectName: name }));
  }, []);

  const updateManualClientName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, manualClientName: name }));
  }, []);

  const updateManualAddress = useCallback((address: string) => {
    setState((prev) => ({ ...prev, manualAddress: address }));
  }, []);

  const updateStatus = useCallback((status: "draft" | "completed") => {
    setState((prev) => ({ ...prev, status }));
  }, []);

  const reset = useCallback(() => {
    setState({
      ...initialState,
      projectId: projectId || "",
      manualProjectName: manualData?.projectName || "",
      manualClientName: manualData?.clientName || "",
      manualAddress: manualData?.address || "",
    });
  }, [projectId, manualData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // For manual mode, we need to find by manual_project_name instead of project_id
      let existing: { id: string; version: number } | null = null;
      
      if (projectId) {
        const { data } = await supabase
          .from("project_estimates")
          .select("id, version")
          .eq("project_id", projectId)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();
        existing = data;
      }

      const totals = calculateTotals();

      const estimateData = {
        project_id: projectId || null,
        template_id: state.templateId,
        scope: state.scope,
        introduction_text: state.introductionText,
        closing_text: state.closingText,
        assumptions: JSON.parse(JSON.stringify(state.assumptions)),
        uncertainties: JSON.parse(JSON.stringify(state.uncertainties)),
        labor_cost: totals.laborCost,
        material_cost: totals.materialCost,
        subcontractor_cost: totals.subcontractorCost,
        markup_percent: state.markupPercent,
        total_excl_vat: totals.totalExclVat,
        total_incl_vat: totals.totalInclVat,
        original_transcript: state.transcript,
        rot_enabled: state.rotEnabled,
        rot_percent: state.rotPercent,
        version: existing ? (existing.version || 1) : 1,
        status: state.status,
        // Manual mode fields
        manual_project_name: isManualMode ? state.manualProjectName : null,
        manual_client_name: isManualMode ? state.manualClientName : null,
        manual_address: isManualMode ? state.manualAddress : null,
      };

      let estimateId: string;

      if (existing) {
        const { error } = await supabase
          .from("project_estimates")
          .update(estimateData)
          .eq("id", existing.id);
        if (error) throw error;
        estimateId = existing.id;

        // Delete old items and addons
        await Promise.all([
          supabase.from("estimate_items").delete().eq("estimate_id", existing.id),
          supabase.from("estimate_addons").delete().eq("estimate_id", existing.id),
        ]);
      } else {
        const { data: newEstimate, error } = await supabase
          .from("project_estimates")
          .insert(estimateData)
          .select("id")
          .single();
        if (error) throw error;
        estimateId = newEstimate.id;
      }

      // Insert items
      if (state.items.length > 0) {
        const itemsToInsert = state.items.map((item, index) => ({
          estimate_id: estimateId,
          article: item.article || null,
          description: item.description || null,
          show_only_total: item.show_only_total || false,
          moment: item.moment || item.description,
          type: item.type,
          quantity: item.quantity,
          unit: item.unit,
          hours: item.hours,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          comment: item.comment,
          uncertainty: item.uncertainty,
          sort_order: index,
          rot_eligible: item.rot_eligible ?? false,
        }));
        const { error } = await supabase.from("estimate_items").insert(itemsToInsert);
        if (error) throw error;
      }

      // Insert addons
      if (state.addons.length > 0) {
        const addonsToInsert = state.addons.map((addon, index) => ({
          estimate_id: estimateId,
          name: addon.name,
          description: addon.description,
          price: addon.price,
          is_selected: addon.is_selected,
          sort_order: index,
        }));
        const { error } = await supabase.from("estimate_addons").insert(addonsToInsert);
        if (error) throw error;
      }

      return estimateId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-estimate", projectId] });
      toast.success("Offerten har sparats");
    },
    onError: (error) => {
      console.error("Failed to save estimate:", error);
      toast.error("Kunde inte spara offerten");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("project_estimates")
        .delete()
        .eq("project_id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-estimate", projectId] });
      reset();
      toast.success("Offerten har raderats");
    },
    onError: (error) => {
      console.error("Failed to delete estimate:", error);
      toast.error("Kunde inte radera offerten");
    },
  });

  return {
    state,
    isLoading,
    hasExistingEstimate: !!existingEstimate,
    totals: calculateTotals(),
    
    // Update functions
    updateScope,
    updateIntroduction,
    updateClosing,
    updateAssumptions,
    updateItems,
    updateAddons,
    toggleAddon,
    addAddon,
    removeAddon,
    updateMarkup,
    updateRot,
    updateTemplateId,
    updateManualProjectName,
    updateManualClientName,
    updateManualAddress,
    updateStatus,
    reset,
    setState,
    
    // Mutations
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
