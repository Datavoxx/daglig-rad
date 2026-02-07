import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

// Tool definitions for function calling
const tools = [
  // === SEARCH TOOLS ===
  {
    type: "function",
    function: {
      name: "search_customers",
      description: "Search for customers by name, city, or email",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (name, city, or email)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_projects",
      description: "Search for projects by name, client, or status. Use status alone to list all projects with that status.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (optional - omit to list all)" },
          status: { type: "string", description: "Filter by status: planning, active, closing, completed" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_estimates",
      description: "Search for estimates/quotes",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_daily_reports",
      description: "Search daily reports by project or date range",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID to filter by" },
          date_from: { type: "string", description: "Start date (YYYY-MM-DD)" },
          date_to: { type: "string", description: "End date (YYYY-MM-DD)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_customer_invoices",
      description: "Search customer invoices by customer name or status",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (customer name)" },
          status: { type: "string", description: "Filter by status (draft, sent, paid, overdue)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_vendor_invoices",
      description: "Search vendor/supplier invoices",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (vendor name)" },
          status: { type: "string", description: "Filter by status" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_inspections",
      description: "Search inspections/quality checks",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID to filter by" },
          status: { type: "string", description: "Filter by status (draft, completed)" },
        },
        required: [],
      },
    },
  },
  // === CREATE TOOLS ===
  {
    type: "function",
    function: {
      name: "create_estimate",
      description: "Create a new estimate for a customer. Requires customer verification first.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Customer ID" },
          title: { type: "string", description: "Estimate title/description" },
          address: { type: "string", description: "Project address" },
        },
        required: ["customer_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_project",
      description: "Create a new project. Requires customer verification first.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name" },
          customer_id: { type: "string", description: "Customer ID" },
          address: { type: "string", description: "Project address" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "register_time",
      description: "Register time on a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          hours: { type: "number", description: "Number of hours" },
          date: { type: "string", description: "Date (YYYY-MM-DD), defaults to today" },
          description: { type: "string", description: "Work description" },
        },
        required: ["project_id", "hours"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_time_summary",
      description: "Get time summary for a period",
      parameters: {
        type: "object",
        properties: {
          start_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
          end_date: { type: "string", description: "End date (YYYY-MM-DD)" },
          project_id: { type: "string", description: "Optional project ID to filter by" },
        },
        required: ["start_date", "end_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_daily_report",
      description: "Create a daily work report for a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          work_items: { type: "array", items: { type: "string" }, description: "List of work performed" },
          headcount: { type: "number", description: "Number of workers" },
          total_hours: { type: "number", description: "Total hours worked" },
          notes: { type: "string", description: "Additional notes" },
        },
        required: ["project_id", "work_items", "headcount", "total_hours"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_customer_invoice",
      description: "Create a customer invoice for a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          customer_id: { type: "string", description: "Customer ID" },
        },
        required: ["project_id", "customer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_inspection",
      description: "Create a new inspection/quality check for a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          template_id: { type: "string", description: "Inspection template ID" },
          inspector_name: { type: "string", description: "Name of inspector" },
        },
        required: ["project_id", "template_id"],
      },
    },
  },
  // === PLANNING ===
  {
    type: "function",
    function: {
      name: "get_project_plan",
      description: "Get project planning/Gantt chart data",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
        },
        required: ["project_id"],
      },
    },
  },
  // === ATTENDANCE ===
  {
    type: "function",
    function: {
      name: "check_in",
      description: "Check in to a project (start attendance)",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_out",
      description: "Check out from a project (end attendance)",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_active_attendance",
      description: "Get list of people currently checked in to a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
        },
        required: ["project_id"],
      },
    },
  },
  // === TIME REGISTRATION FORM ===
  {
    type: "function",
    function: {
      name: "get_active_projects_for_time",
      description: "Get list of active projects to show in time registration form. Use this when user wants to register time without specifying a project.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  // === ESTIMATE FORM ===
  {
    type: "function",
    function: {
      name: "get_customers_for_estimate",
      description: "Get list of customers for estimate form. Use this when user wants to create an estimate without specifying a customer.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  // === DAILY REPORT FORM ===
  {
    type: "function",
    function: {
      name: "get_projects_for_daily_report",
      description: "Get list of active projects for daily report form. Use this when user wants to create a daily report without specifying a project.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  // === CUSTOMER SEARCH ===
  {
    type: "function",
    function: {
      name: "get_all_customers",
      description: "Get all customers for search/browse card. Use this when user wants to search for a customer.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  // === CUSTOMER FORM ===
  {
    type: "function",
    function: {
      name: "get_customer_form",
      description: "Show empty customer creation form. Use this when user wants to create a new customer.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  // === PROJECT FORM ===
  {
    type: "function",
    function: {
      name: "get_project_form",
      description: "Get customers for project creation form. Use this when user wants to create a new project without specifying details.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  // === CREATE CUSTOMER ===
  {
    type: "function",
    function: {
      name: "create_customer",
      description: "Create a new customer",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Customer name (required)" },
          email: { type: "string", description: "Email address" },
          phone: { type: "string", description: "Phone number" },
          address: { type: "string", description: "Street address" },
          city: { type: "string", description: "City" },
        },
        required: ["name"],
      },
    },
  },
  // === GET (READ-ONLY) TOOLS ===
  {
    type: "function",
    function: {
      name: "get_estimate",
      description: "Hämta och visa fullständig information om en offert (används för 'visa', 'hämta', 'öppna' offert)",
      parameters: {
        type: "object",
        properties: {
          estimate_id: { type: "string", description: "Offertens ID" },
        },
        required: ["estimate_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project",
      description: "Hämta och visa fullständig information om ett projekt (används för 'visa', 'hämta', 'öppna' projekt)",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Projektets ID" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer",
      description: "Hämta och visa fullständig information om en kund (används för 'visa', 'hämta', 'öppna' kund)",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Kundens ID" },
        },
        required: ["customer_id"],
      },
    },
  },
  // === UPDATE TOOLS ===
  {
    type: "function",
    function: {
      name: "update_customer",
      description: "Update customer information",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Customer ID" },
          name: { type: "string", description: "New name" },
          email: { type: "string", description: "New email" },
          phone: { type: "string", description: "New phone number" },
          address: { type: "string", description: "New address" },
          city: { type: "string", description: "New city" },
        },
        required: ["customer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_project",
      description: "Update project information",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          name: { type: "string", description: "New name" },
          status: { type: "string", description: "New status (active, completed, on_hold)" },
          address: { type: "string", description: "New address" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_estimate",
      description: "Update estimate information",
      parameters: {
        type: "object",
        properties: {
          estimate_id: { type: "string", description: "Estimate ID" },
          manual_project_name: { type: "string", description: "New project name" },
          status: { type: "string", description: "New status (draft, sent, accepted, rejected)" },
        },
        required: ["estimate_id"],
      },
    },
  },
  // === DELETE TOOLS ===
  {
    type: "function",
    function: {
      name: "delete_customer",
      description: "Delete a customer. WARNING: This is permanent!",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "Customer ID to delete" },
        },
        required: ["customer_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_project",
      description: "Delete a project. WARNING: This is permanent!",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID to delete" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_estimate",
      description: "Delete an estimate. WARNING: This is permanent!",
      parameters: {
        type: "object",
        properties: {
          estimate_id: { type: "string", description: "Estimate ID to delete" },
        },
        required: ["estimate_id"],
      },
    },
  },
];

// Execute tool calls against the database
async function executeTool(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  console.log(`Executing tool: ${toolName}`, args);

  switch (toolName) {
    // === SEARCH ===
    case "search_customers": {
      const query = args.query as string;
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, city, email, phone, address")
        .eq("user_id", userId)
        .or(`name.ilike.%${query}%,city.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);
      
      if (error) throw error;
      return data;
    }

    case "search_projects": {
      const query = args.query as string | undefined;
      const status = args.status as string | undefined;
      
      let q = supabase
        .from("projects")
        .select("id, name, client_name, address, city, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      // Only add search filter if query is provided
      if (query && query.trim()) {
        q = q.or(`name.ilike.%${query}%,client_name.ilike.%${query}%`);
      }
      
      if (status) {
        q = q.eq("status", status);
      }
      
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "search_estimates": {
      const query = args.query as string;
      const { data, error } = await supabase
        .from("project_estimates")
        .select("id, manual_project_name, manual_client_name, status, total_incl_vat, offer_number")
        .eq("user_id", userId)
        .or(`manual_project_name.ilike.%${query}%,manual_client_name.ilike.%${query}%`)
        .limit(5);
      
      if (error) throw error;
      return data;
    }

    case "search_daily_reports": {
      const projectId = args.project_id as string | undefined;
      const dateFrom = args.date_from as string | undefined;
      const dateTo = args.date_to as string | undefined;
      
      let q = supabase
        .from("daily_reports")
        .select("id, project_id, report_date, work_items, headcount, total_hours, projects(name)")
        .eq("user_id", userId)
        .order("report_date", { ascending: false })
        .limit(10);
      
      if (projectId) q = q.eq("project_id", projectId);
      if (dateFrom) q = q.gte("report_date", dateFrom);
      if (dateTo) q = q.lte("report_date", dateTo);
      
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "search_customer_invoices": {
      const query = args.query as string | undefined;
      const status = args.status as string | undefined;
      
      let q = supabase
        .from("customer_invoices")
        .select("id, invoice_number, invoice_date, due_date, total_inc_vat, status, customers(name)")
        .eq("user_id", userId)
        .order("invoice_date", { ascending: false })
        .limit(10);
      
      if (status) q = q.eq("status", status);
      
      const { data, error } = await q;
      if (error) throw error;
      
      // Filter by customer name if query provided
      if (query && data) {
        return data.filter((inv: any) => 
          inv.customers?.name?.toLowerCase().includes(query.toLowerCase())
        );
      }
      return data;
    }

    case "search_vendor_invoices": {
      const query = args.query as string | undefined;
      const status = args.status as string | undefined;
      
      let q = supabase
        .from("vendor_invoices")
        .select("id, vendor_name, invoice_number, invoice_date, due_date, total_amount, status")
        .eq("user_id", userId)
        .order("invoice_date", { ascending: false })
        .limit(10);
      
      if (status) q = q.eq("status", status);
      if (query) q = q.ilike("vendor_name", `%${query}%`);
      
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "search_inspections": {
      const projectId = args.project_id as string | undefined;
      const status = args.status as string | undefined;
      
      let q = supabase
        .from("inspections")
        .select("id, template_name, template_category, inspection_date, status, inspector_name, projects(name)")
        .eq("user_id", userId)
        .order("inspection_date", { ascending: false })
        .limit(10);
      
      if (projectId) q = q.eq("project_id", projectId);
      if (status) q = q.eq("status", status);
      
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    // === CREATE ===
    case "create_estimate": {
      const { customer_id, title, address } = args as {
        customer_id: string;
        title: string;
        address?: string;
      };

      const { data: customer } = await supabase
        .from("customers")
        .select("name, address, city")
        .eq("id", customer_id)
        .single();

      const { data, error } = await supabase
        .from("project_estimates")
        .insert({
          user_id: userId,
          manual_client_name: customer?.name || "",
          manual_project_name: title,
          manual_address: address || customer?.address || "",
          manual_city: customer?.city || "",
          status: "draft",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    case "create_project": {
      const { name, customer_id, address } = args as {
        name: string;
        customer_id?: string;
        address?: string;
      };

      let clientName = "";
      let projectAddress = address || "";
      let projectCity = "";

      if (customer_id) {
        const { data: customer } = await supabase
          .from("customers")
          .select("name, address, city")
          .eq("id", customer_id)
          .single();
        
        if (customer) {
          clientName = customer.name;
          projectAddress = address || customer.address || "";
          projectCity = customer.city || "";
        }
      }

      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: userId,
          name,
          client_name: clientName,
          address: projectAddress,
          city: projectCity,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    case "register_time": {
      const { project_id, hours, date, description } = args as {
        project_id: string;
        hours: number;
        date?: string;
        description?: string;
      };
      
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          user_id: userId,
          employer_id: userId,
          project_id,
          hours,
          date: date || new Date().toISOString().split('T')[0],
          description: description || "",
          status: "pending",
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "get_time_summary": {
      const { start_date, end_date, project_id } = args as {
        start_date: string;
        end_date: string;
        project_id?: string;
      };
      
      let q = supabase
        .from("time_entries")
        .select("id, date, hours, description, project_id, projects(name)")
        .eq("user_id", userId)
        .gte("date", start_date)
        .lte("date", end_date)
        .order("date", { ascending: false });
      
      if (project_id) q = q.eq("project_id", project_id);
      
      const { data, error } = await q;
      if (error) throw error;
      
      const totalHours = (data || []).reduce((sum: number, entry: any) => sum + (entry.hours || 0), 0);
      return { entries: data, totalHours, period: { start_date, end_date } };
    }

    case "create_daily_report": {
      const { project_id, work_items, headcount, total_hours, notes } = args as {
        project_id: string;
        work_items: string[];
        headcount: number;
        total_hours: number;
        notes?: string;
      };
      
      const { data, error } = await supabase
        .from("daily_reports")
        .insert({
          user_id: userId,
          project_id,
          work_items,
          headcount,
          total_hours,
          notes: notes || "",
          report_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "create_customer_invoice": {
      const { project_id, customer_id } = args as {
        project_id: string;
        customer_id: string;
      };
      
      const { data, error } = await supabase
        .from("customer_invoices")
        .insert({
          user_id: userId,
          project_id,
          customer_id,
          status: "draft",
          rows: [],
          total_ex_vat: 0,
          vat_amount: 0,
          total_inc_vat: 0,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "create_inspection": {
      const { project_id, template_id, inspector_name } = args as {
        project_id: string;
        template_id: string;
        inspector_name?: string;
      };
      
      // Get template info
      const { data: template } = await supabase
        .from("inspection_templates")
        .select("name, category, checkpoints")
        .eq("id", template_id)
        .single();
      
      const { data, error } = await supabase
        .from("inspections")
        .insert({
          user_id: userId,
          project_id,
          template_id,
          template_name: template?.name || "Egenkontroll",
          template_category: template?.category || "general",
          checkpoints: template?.checkpoints || [],
          inspector_name: inspector_name || "",
          status: "draft",
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "get_project_plan": {
      const { project_id } = args as { project_id: string };
      
      const { data, error } = await supabase
        .from("project_plans")
        .select("id, phases, start_date, total_weeks, notes")
        .eq("project_id", project_id)
        .single();
        
      if (error && error.code !== "PGRST116") throw error;
      return data;
    }

    // === ATTENDANCE ===
    case "check_in": {
      const { project_id } = args as { project_id: string };
      
      // Check if already checked in
      const { data: existing } = await supabase
        .from("attendance_records")
        .select("id")
        .eq("user_id", userId)
        .eq("project_id", project_id)
        .is("check_out", null)
        .single();
      
      if (existing) {
        return { already_checked_in: true, id: existing.id };
      }
      
      const { data, error } = await supabase
        .from("attendance_records")
        .insert({
          user_id: userId,
          employer_id: userId,
          project_id,
          check_in: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "check_out": {
      const { project_id } = args as { project_id: string };
      
      const { data, error } = await supabase
        .from("attendance_records")
        .update({ check_out: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("project_id", project_id)
        .is("check_out", null)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "get_active_attendance": {
      const { project_id } = args as { project_id: string };
      
      const { data, error } = await supabase
        .from("attendance_records")
        .select("id, user_id, check_in, guest_name, profiles(full_name)")
        .eq("project_id", project_id)
        .is("check_out", null);
        
      if (error) throw error;
      return data;
    }

    case "get_active_projects_for_time": {
      // Get all active projects for time registration form
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", userId)
        .in("status", ["active", "planning"])
        .order("name");
        
      if (error) throw error;
      return data || [];
    }

    case "get_customers_for_estimate": {
      // Get all customers for estimate form
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", userId)
        .order("name");
        
      if (error) throw error;
      return data || [];
    }

    case "get_projects_for_daily_report": {
      // Get all active projects for daily report form
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", userId)
        .in("status", ["active", "planning"])
        .order("name");
        
      if (error) throw error;
      return data || [];
    }

    case "get_all_customers": {
      // Get all customers for search card
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, city, email")
        .eq("user_id", userId)
        .order("name")
        .limit(100);
        
      if (error) throw error;
      return data || [];
    }

    case "get_customer_form": {
      // Return empty - just triggers the form display
      return { showForm: true };
    }

    case "get_project_form": {
      // Get customers for project form
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", userId)
        .order("name");
        
      if (error) throw error;
      return { customers: data || [] };
    }

    case "create_customer": {
      const { name, email, phone, address, city } = args as {
        name: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
      };
      
      const { data, error } = await supabase
        .from("customers")
        .insert({
          user_id: userId,
          name,
          email: email || null,
          phone: phone || null,
          address: address || null,
          city: city || null,
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    // === UPDATE ===
    case "update_customer": {
      const { customer_id, ...updates } = args as {
        customer_id: string;
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
      };
      
      const updateData: Record<string, string> = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.email) updateData.email = updates.email;
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.address) updateData.address = updates.address;
      if (updates.city) updateData.city = updates.city;
      
      const { data, error } = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", customer_id)
        .eq("user_id", userId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "update_project": {
      const { project_id, ...updates } = args as {
        project_id: string;
        name?: string;
        status?: string;
        address?: string;
      };
      
      const updateData: Record<string, string> = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.status) updateData.status = updates.status;
      if (updates.address) updateData.address = updates.address;
      
      const { data, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", project_id)
        .eq("user_id", userId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "update_estimate": {
      const { estimate_id, ...updates } = args as {
        estimate_id: string;
        manual_project_name?: string;
        status?: string;
      };
      
      const updateData: Record<string, string> = {};
      if (updates.manual_project_name) updateData.manual_project_name = updates.manual_project_name;
      if (updates.status) updateData.status = updates.status;
      
      const { data, error } = await supabase
        .from("project_estimates")
        .update(updateData)
        .eq("id", estimate_id)
        .eq("user_id", userId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    // === DELETE ===
    case "delete_customer": {
      const { customer_id } = args as { customer_id: string };
      
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer_id)
        .eq("user_id", userId);
        
      if (error) throw error;
      return { deleted: true, id: customer_id };
    }

    case "delete_project": {
      const { project_id } = args as { project_id: string };
      
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", project_id)
        .eq("user_id", userId);
        
      if (error) throw error;
      return { deleted: true, id: project_id };
    }

    case "delete_estimate": {
      const { estimate_id } = args as { estimate_id: string };
      
      const { error } = await supabase
        .from("project_estimates")
        .delete()
        .eq("id", estimate_id)
        .eq("user_id", userId);
        
      if (error) throw error;
      return { deleted: true, id: estimate_id };
    }

    // === GET (READ-ONLY) ===
    case "get_estimate": {
      const { estimate_id } = args as { estimate_id: string };
      
      const { data: estimate, error } = await supabase
        .from("project_estimates")
        .select("*")
        .eq("id", estimate_id)
        .eq("user_id", userId)
        .single();
        
      if (error) throw error;
      
      // Get estimate items
      const { data: items } = await supabase
        .from("estimate_items")
        .select("*")
        .eq("estimate_id", estimate_id)
        .order("sort_order");
        
      return { ...estimate, items: items || [] };
    }

    case "get_project": {
      const { project_id } = args as { project_id: string };
      
      const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", project_id)
        .eq("user_id", userId)
        .single();
        
      if (error) throw error;
      return project;
    }

    case "get_customer": {
      const { customer_id } = args as { customer_id: string };
      
      const { data: customer, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customer_id)
        .eq("user_id", userId)
        .single();
        
      if (error) throw error;
      
      // Get related projects and estimates
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, status")
        .eq("user_id", userId)
        .eq("client_name", customer.name)
        .limit(5);
        
      const { data: estimates } = await supabase
        .from("project_estimates")
        .select("id, offer_number, status, manual_project_name")
        .eq("user_id", userId)
        .eq("manual_client_name", customer.name)
        .limit(5);
        
      return { ...customer, projects: projects || [], estimates: estimates || [] };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Format tool results for the assistant response
function formatToolResults(toolName: string, results: unknown): {
  type: string;
  content: string;
  data?: Record<string, unknown>;
} {
  if (!results || (Array.isArray(results) && results.length === 0)) {
    return {
      type: "text",
      content: "Jag hittade inga resultat. Vill du söka efter något annat eller skapa ny?",
    };
  }

  switch (toolName) {
    case "search_customers": {
      const customers = results as Array<{
        id: string;
        name: string;
        city: string;
        email?: string;
        phone?: string;
        customer_type?: string;
      }>;
      
      return {
        type: "list",
        content: customers.length > 0 
          ? `Här är ${customers.length} kund${customers.length > 1 ? "er" : ""}:`
          : "Inga kunder hittades.",
        data: {
          listType: "customer",
          listItems: customers.map((c) => ({
            id: c.id,
            title: c.name,
            subtitle: c.city || "Ingen stad angiven",
            status: c.customer_type === "business" ? "Företag" : "Privat",
            statusColor: c.customer_type === "business" ? "blue" : "green",
            details: [
              ...(c.email ? [{ label: "E-post", value: c.email }] : []),
              ...(c.phone ? [{ label: "Telefon", value: c.phone }] : []),
            ],
            link: `/customers?id=${c.id}`,
          })),
        },
      };
    }

    case "search_projects": {
      const projects = results as Array<{
        id: string;
        name: string;
        client_name: string;
        address?: string;
        city?: string;
        status?: string;
      }>;
      
      // Helper functions for status translation
      const translateStatus = (status: string | undefined): string => {
        const statusMap: Record<string, string> = {
          planning: "Planering",
          active: "Pågående",
          closing: "Avslutning",
          completed: "Avslutat",
        };
        return statusMap[status || ""] || status || "Okänd";
      };
      
      const getStatusColor = (status: string | undefined): "green" | "yellow" | "blue" | "gray" => {
        const colorMap: Record<string, "green" | "yellow" | "blue" | "gray"> = {
          active: "green",
          planning: "blue",
          closing: "yellow",
          completed: "gray",
        };
        return colorMap[status || ""] || "gray";
      };
      
      // Return as list for viewing, not verification
      return {
        type: "list",
        content: projects.length > 0 
          ? `Här är ${projects.length} projekt:`
          : "Inga projekt hittades.",
        data: {
          listType: "project",
          listItems: projects.map((p) => ({
            id: p.id,
            title: p.name,
            subtitle: p.client_name || "Ingen kund",
            status: translateStatus(p.status),
            statusColor: getStatusColor(p.status),
            details: [
              ...(p.address ? [{ label: "Adress", value: p.address }] : []),
              ...(p.city ? [{ label: "Stad", value: p.city }] : []),
            ],
            link: `/projects/${p.id}`,
          })),
        },
      };
    }

    case "search_estimates": {
      const estimates = results as Array<{
        id: string;
        manual_project_name: string;
        manual_client_name: string;
        status?: string;
        total_incl_vat?: number;
        offer_number?: string;
      }>;
      
      return {
        type: "verification",
        content: `Jag hittade ${estimates.length} matchande offert${estimates.length > 1 ? "er" : ""}:`,
        data: {
          entityType: "estimate",
          matches: estimates.map((e) => ({
            id: e.id,
            title: e.manual_project_name || e.offer_number || "Offert",
            subtitle: e.manual_client_name || "Ingen kund",
            metadata: {
              ...(e.offer_number && { nummer: e.offer_number }),
              ...(e.status && { status: e.status }),
              ...(e.total_incl_vat && { belopp: `${e.total_incl_vat.toLocaleString("sv-SE")} kr` }),
            },
          })),
        },
      };
    }

    case "search_daily_reports": {
      const reports = results as Array<{
        id: string;
        report_date: string;
        work_items: string[];
        headcount: number;
        total_hours: number;
        projects?: { name: string };
      }>;
      
      return {
        type: "verification",
        content: `Jag hittade ${reports.length} dagrapport${reports.length > 1 ? "er" : ""}:`,
        data: {
          entityType: "daily_report",
          matches: reports.map((r) => ({
            id: r.id,
            title: r.projects?.name || "Dagrapport",
            subtitle: r.report_date,
            metadata: {
              personal: `${r.headcount} pers`,
              timmar: `${r.total_hours}h`,
            },
          })),
        },
      };
    }

    case "search_customer_invoices": {
      const invoices = results as Array<{
        id: string;
        invoice_number: string;
        invoice_date: string;
        total_inc_vat: number;
        status: string;
        customers?: { name: string };
      }>;
      
      return {
        type: "verification",
        content: `Jag hittade ${invoices.length} kundfaktura${invoices.length > 1 ? "or" : ""}:`,
        data: {
          entityType: "invoice",
          matches: invoices.map((inv) => ({
            id: inv.id,
            title: inv.invoice_number || "Faktura",
            subtitle: inv.customers?.name || "Okänd kund",
            metadata: {
              datum: inv.invoice_date,
              belopp: `${inv.total_inc_vat?.toLocaleString("sv-SE")} kr`,
              status: inv.status,
            },
          })),
        },
      };
    }

    case "search_vendor_invoices": {
      const invoices = results as Array<{
        id: string;
        vendor_name: string;
        invoice_number: string;
        total_amount: number;
        status: string;
      }>;
      
      return {
        type: "verification",
        content: `Jag hittade ${invoices.length} leverantörsfaktura${invoices.length > 1 ? "or" : ""}:`,
        data: {
          entityType: "invoice",
          matches: invoices.map((inv) => ({
            id: inv.id,
            title: inv.vendor_name || "Leverantörsfaktura",
            subtitle: inv.invoice_number || "",
            metadata: {
              belopp: `${inv.total_amount?.toLocaleString("sv-SE")} kr`,
              status: inv.status,
            },
          })),
        },
      };
    }

    case "search_inspections": {
      const inspections = results as Array<{
        id: string;
        template_name: string;
        template_category: string;
        inspection_date: string;
        status: string;
        projects?: { name: string };
      }>;
      
      return {
        type: "verification",
        content: `Jag hittade ${inspections.length} egenkontroll${inspections.length > 1 ? "er" : ""}:`,
        data: {
          entityType: "inspection",
          matches: inspections.map((i) => ({
            id: i.id,
            title: i.template_name,
            subtitle: i.projects?.name || "Okänt projekt",
            metadata: {
              datum: i.inspection_date,
              status: i.status,
            },
          })),
        },
      };
    }

    case "create_estimate": {
      const estimate = results as { id: string; offer_number: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Offert ${estimate.offer_number} har skapats!`,
          link: {
            label: "Öppna offert",
            href: `/estimates?estimateId=${estimate.id}`,
          },
          nextActions: [
            { label: "Skapa ny offert", icon: "plus", prompt: "Skapa en ny offert" },
            { label: "Visa alla offerter", icon: "list", prompt: "Visa mina offerter" },
          ],
        },
      };
    }

    case "create_project": {
      const project = results as { id: string; name: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Projekt "${project.name}" har skapats!`,
          link: {
            label: "Öppna projekt",
            href: `/projects/${project.id}`,
          },
          nextActions: [
            { label: "Skapa offert", icon: "file-text", prompt: "Skapa offert för detta projekt" },
            { label: "Registrera tid", icon: "clock", prompt: "Registrera tid på projektet" },
          ],
        },
      };
    }

    case "register_time": {
      const entry = results as { id: string; hours: number; date: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `${entry.hours} timmar registrerade för ${entry.date}!`,
          link: {
            label: "Öppna tidsrapportering",
            href: "/time-reporting",
          },
          nextActions: [
            { label: "Registrera mer tid", icon: "plus", prompt: "Registrera mer tid" },
            { label: "Visa veckans tid", icon: "calendar", prompt: "Visa veckans tidrapport" },
          ],
        },
      };
    }

    case "get_time_summary": {
      const summary = results as { totalHours: number; entries: any[]; period: { start_date: string; end_date: string } };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Totalt ${summary.totalHours} timmar registrerade mellan ${summary.period.start_date} och ${summary.period.end_date}.`,
          link: {
            label: "Öppna tidsrapportering",
            href: "/time-reporting",
          },
          nextActions: [
            { label: "Registrera tid", icon: "plus", prompt: "Registrera tid" },
            { label: "Visa projekt", icon: "folder", prompt: "Visa mina projekt" },
          ],
        },
      };
    }

    case "create_daily_report": {
      const report = results as { id: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: "Dagrapport skapad!",
          link: {
            label: "Öppna rapport",
            href: `/reports/${report.id}`,
          },
          nextActions: [
            { label: "Skapa ny rapport", icon: "plus", prompt: "Skapa en till dagrapport" },
            { label: "Visa alla rapporter", icon: "list", prompt: "Visa mina dagrapporter" },
          ],
        },
      };
    }

    case "create_customer_invoice": {
      const invoice = results as { id: string; invoice_number: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Kundfaktura ${invoice.invoice_number || ""} skapad!`,
          link: {
            label: "Öppna faktura",
            href: `/invoices?tab=customer&id=${invoice.id}`,
          },
          nextActions: [
            { label: "Skapa ny faktura", icon: "plus", prompt: "Skapa en ny kundfaktura" },
            { label: "Visa fakturor", icon: "list", prompt: "Visa mina kundfakturor" },
          ],
        },
      };
    }

    case "create_inspection": {
      const inspection = results as { id: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: "Egenkontroll skapad!",
          link: {
            label: "Öppna egenkontroll",
            href: `/inspections/${inspection.id}`,
          },
          nextActions: [
            { label: "Skapa ny kontroll", icon: "plus", prompt: "Skapa en till egenkontroll" },
            { label: "Visa kontroller", icon: "list", prompt: "Visa mina egenkontroller" },
          ],
        },
      };
    }

    case "get_project_plan": {
      const plan = results as { id: string; phases: any[]; total_weeks: number } | null;
      if (!plan) {
        return {
          type: "text",
          content: "Det finns ingen planering för detta projekt ännu. Vill du skapa en?",
        };
      }
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Projektplanen har ${plan.phases?.length || 0} faser och ${plan.total_weeks || 0} veckor.`,
          link: {
            label: "Öppna planering",
            href: `/planning?project=${plan.id}`,
          },
          nextActions: [
            { label: "Visa projekt", icon: "folder", prompt: "Öppna projektet" },
          ],
        },
      };
    }

    case "check_in": {
      const record = results as { id: string; already_checked_in?: boolean };
      if (record.already_checked_in) {
        return {
          type: "text",
          content: "Du är redan incheckad på detta projekt.",
        };
      }
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: "Du är nu incheckad!",
          link: {
            label: "Öppna närvaro",
            href: "/attendance",
          },
          nextActions: [
            { label: "Checka ut", icon: "log-out", prompt: "Checka ut mig" },
            { label: "Visa närvaro", icon: "users", prompt: "Visa vem som är incheckad" },
          ],
        },
      };
    }

    case "check_out": {
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: "Du är nu utcheckad!",
          link: {
            label: "Öppna närvaro",
            href: "/attendance",
          },
          nextActions: [
            { label: "Checka in igen", icon: "log-in", prompt: "Checka in mig" },
            { label: "Registrera tid", icon: "clock", prompt: "Registrera tid" },
          ],
        },
      };
    }

    case "get_active_attendance": {
      const records = results as Array<{
        id: string;
        check_in: string;
        guest_name?: string;
        profiles?: { full_name: string };
      }>;
      
      if (records.length === 0) {
        return {
          type: "text",
          content: "Ingen är incheckad på detta projekt just nu.",
        };
      }
      
      const names = records.map(r => r.profiles?.full_name || r.guest_name || "Okänd").join(", ");
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `${records.length} person${records.length > 1 ? "er" : ""} incheckade: ${names}`,
          link: {
            label: "Öppna närvaro",
            href: "/attendance",
          },
          nextActions: [
            { label: "Checka in", icon: "log-in", prompt: "Checka in mig" },
          ],
        },
      };
    }

    case "get_active_projects_for_time": {
      const projects = results as Array<{ id: string; name: string }>;
      
      if (projects.length === 0) {
        return {
          type: "text",
          content: "Du har inga aktiva projekt att registrera tid på. Skapa ett projekt först.",
        };
      }
      
      return {
        type: "time_form",
        content: "",
        data: {
          projects,
          defaultDate: new Date().toISOString().split("T")[0],
        },
      };
    }

    case "get_customers_for_estimate": {
      const customers = results as Array<{ id: string; name: string }>;
      
      if (customers.length === 0) {
        return {
          type: "text",
          content: "Du har inga kunder ännu. Skapa en kund först.",
        };
      }
      
      return {
        type: "estimate_form",
        content: "",
        data: {
          customers,
        },
      };
    }

    case "get_projects_for_daily_report": {
      const projects = results as Array<{ id: string; name: string }>;
      
      if (projects.length === 0) {
        return {
          type: "text",
          content: "Du har inga aktiva projekt. Skapa ett projekt först.",
        };
      }
      
      return {
        type: "daily_report_form",
        content: "",
        data: {
          projects,
        },
      };
    }

    case "get_all_customers": {
      const customers = results as Array<{ id: string; name: string; city?: string; email?: string }>;
      
      if (customers.length === 0) {
        return {
          type: "text",
          content: "Du har inga kunder ännu. Vill du skapa en?",
        };
      }
      
      return {
        type: "customer_search",
        content: "",
        data: {
          allCustomers: customers,
        },
      };
    }

    case "get_customer_form": {
      return {
        type: "customer_form",
        content: "",
        data: {},
      };
    }

    case "get_project_form": {
      const result = results as { customers: Array<{ id: string; name: string }> };
      
      return {
        type: "project_form",
        content: "",
        data: {
          customers: result.customers,
        },
      };
    }

    case "create_customer": {
      const customer = results as { id: string; name: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Kund "${customer.name}" har skapats!`,
          link: {
            label: "Visa kund",
            href: `/customers?id=${customer.id}`,
          },
          nextActions: [
            { label: "Skapa offert", icon: "file-text", prompt: "Skapa offert för denna kund" },
            { label: "Skapa projekt", icon: "folder", prompt: "Skapa projekt för denna kund" },
          ],
        },
      };
    }

    case "update_customer": {
      const customer = results as { id: string; name: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Kund "${customer.name}" har uppdaterats!`,
          link: {
            label: "Visa kund",
            href: `/customers?id=${customer.id}`,
          },
          nextActions: [
            { label: "Sök kund", icon: "search", prompt: "Sök efter en kund" },
            { label: "Skapa offert", icon: "file-text", prompt: "Skapa offert för kunden" },
          ],
        },
      };
    }

    case "update_project": {
      const project = results as { id: string; name: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Projekt "${project.name}" har uppdaterats!`,
          link: {
            label: "Öppna projekt",
            href: `/projects/${project.id}`,
          },
          nextActions: [
            { label: "Visa projekt", icon: "folder", prompt: "Visa mina projekt" },
          ],
        },
      };
    }

    case "update_estimate": {
      const estimate = results as { id: string; manual_project_name: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Offert "${estimate.manual_project_name}" har uppdaterats!`,
          link: {
            label: "Öppna offert",
            href: `/estimates?estimateId=${estimate.id}`,
          },
          nextActions: [
            { label: "Visa offerter", icon: "list", prompt: "Visa mina offerter" },
          ],
        },
      };
    }

    case "delete_customer":
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: "Kunden har tagits bort!",
          nextActions: [
            { label: "Sök kund", icon: "search", prompt: "Sök efter en kund" },
          ],
        },
      };

    case "delete_project":
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: "Projektet har tagits bort!",
          nextActions: [
            { label: "Visa projekt", icon: "folder", prompt: "Visa mina projekt" },
          ],
        },
      };

    case "delete_estimate":
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: "Offerten har tagits bort!",
          nextActions: [
            { label: "Visa offerter", icon: "list", prompt: "Visa mina offerter" },
          ],
        },
      };

    // === GET (READ-ONLY) ===
    case "get_estimate": {
      const estimate = results as any;
      const totalRows = estimate.items?.length || 0;
      
      // Calculate totals from items
      const laborTotal = estimate.items?.reduce((sum: number, item: any) => 
        item.type === 'labor' ? sum + (item.subtotal || 0) : sum, 0) || 0;
      const materialTotal = estimate.items?.reduce((sum: number, item: any) => 
        item.type === 'material' ? sum + (item.subtotal || 0) : sum, 0) || 0;
      
      return {
        type: "result",
        content: `**${estimate.offer_number || 'Offert'}**

**Projekt:** ${estimate.manual_project_name || 'Ej angivet'}
**Kund:** ${estimate.manual_client_name || 'Ej angiven'}
**Status:** ${estimate.status || 'Utkast'}

**Summering:**
- Arbete: ${laborTotal.toLocaleString('sv-SE')} kr
- Material: ${materialTotal.toLocaleString('sv-SE')} kr
- Totalt exkl. moms: ${(estimate.total_excl_vat || 0).toLocaleString('sv-SE')} kr
- Totalt inkl. moms: ${(estimate.total_incl_vat || 0).toLocaleString('sv-SE')} kr
- Antal rader: ${totalRows}

**Skapad:** ${new Date(estimate.created_at).toLocaleDateString('sv-SE')}`,
        data: {
          success: true,
          resultMessage: "",
          link: {
            label: "Öppna offert",
            href: `/estimates?estimateId=${estimate.id}`,
          },
          nextActions: [
            { label: "Redigera offert", icon: "edit", prompt: "Redigera denna offert" },
            { label: "Skapa projekt", icon: "folder", prompt: "Skapa projekt från denna offert" },
            { label: "Visa kund", icon: "users", prompt: "Visa kunden för denna offert" },
          ],
        },
      };
    }

    case "get_project": {
      const project = results as any;
      
      return {
        type: "result",
        content: `**${project.name}**

**Kund:** ${project.client_name || 'Ej angiven'}
**Status:** ${project.status || 'Ej angiven'}
**Adress:** ${project.address || 'Ej angiven'}${project.city ? `, ${project.city}` : ''}

**Ekonomi:**
- Budget: ${(project.budget || 0).toLocaleString('sv-SE')} kr

**Skapad:** ${new Date(project.created_at).toLocaleDateString('sv-SE')}`,
        data: {
          success: true,
          resultMessage: "",
          link: {
            label: "Öppna projekt",
            href: `/projects/${project.id}`,
          },
          nextActions: [
            { label: "Skapa dagrapport", icon: "clipboard", prompt: "Skapa dagrapport för detta projekt" },
            { label: "Registrera tid", icon: "clock", prompt: "Registrera tid på detta projekt" },
            { label: "Visa planering", icon: "calendar", prompt: "Visa planeringen för detta projekt" },
          ],
        },
      };
    }

    case "get_customer": {
      const customer = results as any;
      
      return {
        type: "result",
        content: `**${customer.name}**

**Kontakt:**
- Email: ${customer.email || 'Ej angiven'}
- Telefon: ${customer.phone || 'Ej angiven'}
- Adress: ${customer.address || 'Ej angiven'}${customer.city ? `, ${customer.city}` : ''}

**Relaterat:**
- Projekt: ${customer.projects?.length || 0} st
- Offerter: ${customer.estimates?.length || 0} st`,
        data: {
          success: true,
          resultMessage: "",
          link: {
            label: "Öppna kund",
            href: `/customers?id=${customer.id}`,
          },
          nextActions: [
            { label: "Skapa offert", icon: "file-text", prompt: "Skapa offert för denna kund" },
            { label: "Skapa projekt", icon: "folder", prompt: "Skapa projekt för denna kund" },
            { label: "Redigera kund", icon: "edit", prompt: "Redigera denna kund" },
          ],
        },
      };
    }

    default:
      return {
        type: "text",
        content: "Klart!",
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const { message, history, context } = await req.json();

    console.log("Received message:", message);
    console.log("Context:", context);

    // Build conversation history for AI
    const conversationMessages = [
      {
        role: "system",
        content: `Du är en hjälpsam AI-assistent för ett byggföretag. Du hjälper användaren att hantera hela verksamheten.

FUNKTIONER DU KAN UTFÖRA:
- Kunder: Söka, visa, skapa, redigera, ta bort
- Projekt: Söka, visa, skapa, redigera, ta bort  
- Offerter: Söka, visa, skapa, redigera, ta bort
- Tidsrapportering: Registrera tid, visa summeringar
- Dagrapporter: Skapa och söka rapporter
- Fakturor: Söka kund- och leverantörsfakturor, skapa kundfaktura
- Egenkontroller: Skapa och söka inspektioner
- Närvaro: Checka in/ut, visa aktiva på projekt

VIKTIGT - SKILLNAD MELLAN HÄMTA/VISA OCH UPPDATERA:
- När användaren vill "visa", "hämta", "se", "öppna" eller "kolla" → använd get_estimate/get_project/get_customer
- När användaren vill "ändra", "uppdatera", "redigera" med specifika värden → använd update_*
- ALDRIG använd update_* utan faktiska ändringar att göra
- Om användaren säger "hämta offerten" eller "visa projektet" → använd get_* verktygen

HANTERING AV BEKRÄFTELSER OCH VAL:
- När användaren säger "visa information om X" och context innehåller ett ID:
  - Om context.selectedCustomerId finns → anropa DIREKT get_customer med det ID:t
  - Om context.selectedProjectId finns → anropa DIREKT get_project med det ID:t
  - Om context.selectedEstimateId finns → anropa DIREKT get_estimate med det ID:t
- Visa ALLTID fullständig information efter bekräftelse, inte bara "OK"

NÄR DU BER OM KUNDINFORMATION:
- Be ENDAST om kundens namn, inget annat (inte stad eller e-post)

INTERAKTIVA FORMULÄR - ANVÄND DESSA NÄR ANVÄNDAREN INTE GER SPECIFIK INFO:
- "registrera tid", "rapportera tid" (utan projekt/timmar) → get_active_projects_for_time
- "skapa offert", "ny offert" (utan specifik kund) → get_customers_for_estimate
- "ny dagrapport", "skapa dagrapport" (utan projekt) → get_projects_for_daily_report
- "sök kund", "hitta kund", "visa kunder" → get_all_customers
- "ny kund", "skapa kund" → get_customer_form
- "skapa projekt", "nytt projekt" (utan specifik info) → get_project_form

Om användaren ger fullständig information (t.ex. "skapa kund Johan Svensson email@test.se"), använd create_customer direkt.
Om användaren anger projekt OCH timmar direkt, använd register_time direkt.

VIKTIGA REGLER:
1. Svara alltid på svenska
2. Var kortfattad och koncis (max 2-3 meningar)
3. Använd interaktiva formulär för att samla in information effektivt
4. Fråga aldrig om onödig information - använd det du har
5. Om användaren bekräftar en kund/projekt, fortsätt med nästa steg
6. Vid radering, varna alltid användaren och be om bekräftelse först
7. Föreslå alltid nästa steg efter en slutförd åtgärd

KONTEXT:
${context?.selectedCustomerId ? `- Vald kund-ID: ${context.selectedCustomerId}` : ""}
${context?.selectedProjectId ? `- Valt projekt-ID: ${context.selectedProjectId}` : ""}
${context?.selectedEstimateId ? `- Vald offert-ID: ${context.selectedEstimateId}` : ""}
${context?.pendingAction ? `- Väntande åtgärd: ${context.pendingAction}` : ""}

Använd verktygen för att söka och skapa data.`,
      },
    ];

    // Add history
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant") {
          conversationMessages.push({
            role: msg.role,
            content: msg.content || "",
          });
        }
      }
    }

    // Add current message
    conversationMessages.push({ role: "user", content: message });

    // Call AI with tools
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: conversationMessages,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded",
          type: "text",
          content: "Jag har för många förfrågningar just nu. Vänta en stund och försök igen.",
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const choice = aiData.choices?.[0];

    if (!choice) {
      throw new Error("No response from AI");
    }

    // Check if AI wants to call tools
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

      console.log("Tool call:", toolName, toolArgs);

      // Execute the tool
      const toolResult = await executeTool(supabase, userId, toolName, toolArgs);
      
      // Format and return the result
      const formattedResult = formatToolResults(toolName, toolResult);
      
      return new Response(JSON.stringify(formattedResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return text response
    return new Response(JSON.stringify({
      type: "text",
      content: choice.message.content || "Jag förstod inte. Kan du omformulera?",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Global assistant error:", error);
    return new Response(JSON.stringify({
      type: "text",
      content: "Något gick fel. Försök igen.",
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
