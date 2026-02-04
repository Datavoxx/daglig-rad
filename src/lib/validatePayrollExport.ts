import { supabase } from "@/integrations/supabase/client";

export interface ValidationError {
  type: "error" | "warning";
  message: string;
  field?: string;
  entryId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalEntries: number;
    totalHours: number;
    employeeCount: number;
    entriesByTimeType: Record<string, { count: number; hours: number }>;
  };
}

export interface TimeEntryForExport {
  id: string;
  user_id: string;
  date: string;
  hours: number;
  status: string;
  salary_type_id: string | null;
  description: string | null;
  employee?: {
    id: string;
    name: string;
    employment_number: string | null;
    personal_number: string | null;
  };
  salary_type?: {
    id: string;
    name: string;
    abbreviation: string;
    visma_wage_code: string | null;
    visma_salary_type: string | null;
    time_type: string | null;
  };
}

export async function validatePayrollExport(
  periodStart: Date,
  periodEnd: Date,
  periodStatus: string
): Promise<{ result: ValidationResult; entries: TimeEntryForExport[] }> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // 1. Check period is locked
  if (periodStatus !== "locked" && periodStatus !== "exported") {
    errors.push({
      type: "error",
      message: "Perioden måste vara låst före export",
      field: "period_status",
    });
  }

  // 2. Fetch time entries for the period
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    errors.push({ type: "error", message: "Ej inloggad" });
    return {
      result: {
        valid: false,
        errors,
        warnings,
        summary: { totalEntries: 0, totalHours: 0, employeeCount: 0, entriesByTimeType: {} },
      },
      entries: [],
    };
  }

  const startStr = periodStart.toISOString().split("T")[0];
  const endStr = periodEnd.toISOString().split("T")[0];

  const { data: entries, error } = await supabase
    .from("time_entries")
    .select(`
      id,
      user_id,
      date,
      hours,
      status,
      salary_type_id,
      description
    `)
    .eq("employer_id", userData.user.id)
    .gte("date", startStr)
    .lte("date", endStr);

  if (error) {
    errors.push({ type: "error", message: `Kunde inte hämta tidposter: ${error.message}` });
    return {
      result: {
        valid: false,
        errors,
        warnings,
        summary: { totalEntries: 0, totalHours: 0, employeeCount: 0, entriesByTimeType: {} },
      },
      entries: [],
    };
  }

  if (!entries || entries.length === 0) {
    errors.push({ type: "error", message: "Inga tidposter finns för denna period" });
    return {
      result: {
        valid: false,
        errors,
        warnings,
        summary: { totalEntries: 0, totalHours: 0, employeeCount: 0, entriesByTimeType: {} },
      },
      entries: [],
    };
  }

  // 3. Fetch employees
  const uniqueUserIds = [...new Set(entries.map((e) => e.user_id))];
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, employment_number, personal_number, linked_user_id")
    .eq("user_id", userData.user.id);

  const employeeByUserId = new Map<string, any>();
  employees?.forEach((emp) => {
    if (emp.linked_user_id) {
      employeeByUserId.set(emp.linked_user_id, emp);
    }
  });

  // Check if owner is registering time for themselves
  const ownerProfile = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userData.user.id)
    .single();

  // 4. Fetch salary types
  const { data: salaryTypes } = await supabase
    .from("salary_types")
    .select("id, name, abbreviation, visma_wage_code, visma_salary_type, time_type")
    .eq("user_id", userData.user.id);

  const salaryTypeById = new Map<string, any>();
  salaryTypes?.forEach((st) => salaryTypeById.set(st.id, st));

  // 5. Validate each entry
  const enrichedEntries: TimeEntryForExport[] = [];
  const entriesByTimeType: Record<string, { count: number; hours: number }> = {};
  let totalHours = 0;

  for (const entry of entries) {
    const enrichedEntry: TimeEntryForExport = {
      ...entry,
      hours: Number(entry.hours),
    };

    // Check attestation status
    if (entry.status !== "attesterad") {
      errors.push({
        type: "error",
        message: `Tidpost ${entry.date} är inte attesterad (status: ${entry.status || "skapad"})`,
        entryId: entry.id,
      });
    }

    // Check date
    if (!entry.date) {
      errors.push({
        type: "error",
        message: "Tidpost saknar datum",
        entryId: entry.id,
      });
    }

    // Check hours
    if (!entry.hours || Number(entry.hours) <= 0) {
      errors.push({
        type: "error",
        message: `Tidpost ${entry.date} har ogiltigt antal timmar`,
        entryId: entry.id,
      });
    }

    // Check employee identification
    const isOwner = entry.user_id === userData.user.id;
    const employee = employeeByUserId.get(entry.user_id);

    if (isOwner) {
      // Owner needs to be set up with Visma ID - this is a warning for now
      warnings.push({
        type: "warning",
        message: "Ägarkonto saknar Visma-identifiering - lägg till anställningsnummer i inställningar",
        entryId: entry.id,
      });
      enrichedEntry.employee = {
        id: userData.user.id,
        name: ownerProfile.data?.full_name || "Ägare",
        employment_number: null,
        personal_number: null,
      };
    } else if (employee) {
      if (!employee.employment_number && !employee.personal_number) {
        errors.push({
          type: "error",
          message: `Anställd "${employee.name}" saknar anställningsnummer och personnummer`,
          entryId: entry.id,
        });
      }
      enrichedEntry.employee = {
        id: employee.id,
        name: employee.name,
        employment_number: employee.employment_number,
        personal_number: employee.personal_number,
      };
    } else {
      errors.push({
        type: "error",
        message: `Kunde inte hitta anställd för tidpost ${entry.date}`,
        entryId: entry.id,
      });
    }

    // Check salary type and Visma mapping
    if (!entry.salary_type_id) {
      errors.push({
        type: "error",
        message: `Tidpost ${entry.date} saknar lönetyp`,
        entryId: entry.id,
      });
    } else {
      const salaryType = salaryTypeById.get(entry.salary_type_id);
      if (!salaryType) {
        errors.push({
          type: "error",
          message: `Lönetyp hittades inte för tidpost ${entry.date}`,
          entryId: entry.id,
        });
      } else {
        if (!salaryType.visma_wage_code) {
          errors.push({
            type: "error",
            message: `Lönetyp "${salaryType.name}" saknar Visma-tidkod`,
            entryId: entry.id,
          });
        }
        enrichedEntry.salary_type = salaryType;

        // Track by time type
        const timeType = salaryType.time_type || "WORK";
        if (!entriesByTimeType[timeType]) {
          entriesByTimeType[timeType] = { count: 0, hours: 0 };
        }
        entriesByTimeType[timeType].count++;
        entriesByTimeType[timeType].hours += Number(entry.hours);
      }
    }

    totalHours += Number(entry.hours);
    enrichedEntries.push(enrichedEntry);
  }

  const employeeCount = new Set(entries.map((e) => e.user_id)).size;

  return {
    result: {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalEntries: entries.length,
        totalHours,
        employeeCount,
        entriesByTimeType,
      },
    },
    entries: enrichedEntries,
  };
}
