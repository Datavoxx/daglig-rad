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
  // === WORK ORDERS ===
  {
    type: "function",
    function: {
      name: "create_work_order",
      description: "Create a new work order for a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          title: { type: "string", description: "Work order title" },
          description: { type: "string", description: "Work description" },
          assigned_to: { type: "string", description: "Employee ID to assign to" },
          due_date: { type: "string", description: "Due date (YYYY-MM-DD)" },
        },
        required: ["project_id", "title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_work_orders",
      description: "Search work orders by project or status",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID to filter by" },
          status: { type: "string", description: "Filter by status (pending, in_progress, completed)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_work_order",
      description: "Get details of a specific work order",
      parameters: {
        type: "object",
        properties: {
          work_order_id: { type: "string", description: "Work order ID" },
        },
        required: ["work_order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_work_order",
      description: "Update a work order (status, description, etc.)",
      parameters: {
        type: "object",
        properties: {
          work_order_id: { type: "string", description: "Work order ID" },
          title: { type: "string", description: "New title" },
          description: { type: "string", description: "New description" },
          status: { type: "string", description: "New status (pending, in_progress, completed)" },
          due_date: { type: "string", description: "New due date" },
        },
        required: ["work_order_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_work_order",
      description: "Delete a work order. WARNING: This is permanent!",
      parameters: {
        type: "object",
        properties: {
          work_order_id: { type: "string", description: "Work order ID to delete" },
        },
        required: ["work_order_id"],
      },
    },
  },
  // === ÄTA (ÄNDRINGS- OCH TILLÄGGSARBETEN) ===
  {
    type: "function",
    function: {
      name: "create_ata",
      description: "Create a new ÄTA (ändrings- och tilläggsarbete) for a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          description: { type: "string", description: "Description of the extra work" },
          estimated_cost: { type: "number", description: "Estimated cost in SEK" },
          estimated_hours: { type: "number", description: "Estimated hours" },
          reason: { type: "string", description: "Reason for the change" },
        },
        required: ["project_id", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_ata",
      description: "Search ÄTA items by project or status",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID to filter by" },
          status: { type: "string", description: "Filter by status (pending, approved, rejected, completed)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_ata",
      description: "Get details of a specific ÄTA",
      parameters: {
        type: "object",
        properties: {
          ata_id: { type: "string", description: "ÄTA ID" },
        },
        required: ["ata_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_ata",
      description: "Update an ÄTA (status, cost, etc.)",
      parameters: {
        type: "object",
        properties: {
          ata_id: { type: "string", description: "ÄTA ID" },
          description: { type: "string", description: "New description" },
          estimated_cost: { type: "number", description: "New estimated cost" },
          estimated_hours: { type: "number", description: "New estimated hours" },
          status: { type: "string", description: "New status (pending, approved, rejected, completed)" },
        },
        required: ["ata_id"],
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
  {
    type: "function",
    function: {
      name: "create_plan",
      description: "Create a new project plan with phases",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          start_date: { type: "string", description: "Project start date (YYYY-MM-DD)" },
          phases: { 
            type: "array", 
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Phase name" },
                weeks: { type: "number", description: "Number of weeks" },
              },
            },
            description: "List of phases with names and durations" 
          },
          notes: { type: "string", description: "Planning notes" },
        },
        required: ["project_id", "start_date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_plan",
      description: "Update an existing project plan",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          start_date: { type: "string", description: "New start date" },
          phases: { 
            type: "array", 
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Phase name" },
                weeks: { type: "number", description: "Number of weeks" },
              },
            },
            description: "Updated phases" 
          },
          notes: { type: "string", description: "Updated notes" },
        },
        required: ["project_id"],
      },
    },
  },
  // === FILES ===
  {
    type: "function",
    function: {
      name: "list_project_files",
      description: "List all files and images for a project",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          category: { type: "string", description: "Filter by category (image, document, attachment)" },
        },
        required: ["project_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_project_file",
      description: "Delete a file from a project",
      parameters: {
        type: "object",
        properties: {
          file_id: { type: "string", description: "File ID to delete" },
        },
        required: ["file_id"],
      },
    },
  },
  // === ATTENDANCE / QR ===
  {
    type: "function",
    function: {
      name: "generate_attendance_qr",
      description: "Generate a QR code for attendance tracking on a project",
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
      name: "get_attendance_qr",
      description: "Get the existing QR code for a project's attendance",
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
  // === ECONOMY ===
  {
    type: "function",
    function: {
      name: "get_project_economy",
      description: "Get complete economic overview for a project including budget, costs, hours, ÄTA, and invoiced amounts",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID or name" },
        },
        required: ["project_id"],
      },
    },
  },
  // === PROJECT OVERVIEW (conversational) ===
  {
    type: "function",
    function: {
      name: "get_project_overview",
      description: "Hämta komplett projektöversikt för att svara på öppna frågor som 'hur går projektet?', 'berätta om projektet', 'vad har hänt?'. Returnerar ekonomi, dagrapporter, ÄTA, tidsplan och vad som saknas.",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID or name" },
        },
        required: ["project_id"],
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
      description: "Create a new project from an existing estimate. The project inherits all data from the estimate.",
      parameters: {
        type: "object",
        properties: {
          estimate_id: { type: "string", description: "Estimate ID to create project from" },
        },
        required: ["estimate_id"],
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
      description: "Create a daily work report for a project with crew info, work items, deviations, ÄTA, and materials",
      parameters: {
        type: "object",
        properties: {
          project_id: { type: "string", description: "Project ID" },
          headcount: { type: "number", description: "Number of workers" },
          hours_per_person: { type: "number", description: "Hours per person" },
          total_hours: { type: "number", description: "Total hours worked" },
          roles: { type: "array", items: { type: "string" }, description: "List of roles (e.g. snickare, elektriker)" },
          work_items: { type: "array", items: { type: "string" }, description: "List of work performed" },
          deviations: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                type: { type: "string", description: "Deviation type" },
                description: { type: "string", description: "Deviation description" },
                hours: { type: "number", description: "Hours affected" },
              },
            }, 
            description: "List of deviations" 
          },
          ata: { 
            type: "object",
            properties: {
              has_ata: { type: "boolean" },
              items: { 
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reason: { type: "string" },
                    consequence: { type: "string" },
                    estimated_hours: { type: "number" },
                  },
                },
              },
            },
            description: "ÄTA (ändrings- och tilläggsarbeten)" 
          },
          materials_delivered: { type: "array", items: { type: "string" }, description: "Materials delivered" },
          materials_missing: { type: "array", items: { type: "string" }, description: "Materials missing" },
          notes: { type: "string", description: "Additional notes" },
        },
        required: ["project_id"],
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
  // === FORM TOOLS ===
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
  // === ESTIMATE ITEMS ===
  {
    type: "function",
    function: {
      name: "add_estimate_items",
      description: "Add items (rows) to an existing estimate. Use when user provides estimate items data after creating an estimate.",
      parameters: {
        type: "object",
        properties: {
          estimate_id: { type: "string", description: "Estimate ID" },
          introduction: { type: "string", description: "Project description (saved to scope field)" },
          timeline: { type: "string", description: "Timeline/schedule - one item per line (saved to assumptions field)" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                article: { type: "string", description: "Article type: labor, material, subcontractor, other" },
                description: { type: "string", description: "Item description" },
                quantity: { type: "number", description: "Quantity" },
                unit: { type: "string", description: "Unit (tim, st, m, etc.)" },
                unit_price: { type: "number", description: "Unit price" },
              },
            },
            description: "List of estimate items",
          },
          addons: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Addon name" },
                price: { type: "number", description: "Addon price" },
              },
            },
            description: "Optional addons",
          },
        },
        required: ["estimate_id"],
      },
    },
  },
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
  {
    type: "function",
    function: {
      name: "get_project_form",
      description: "Get available estimates (not yet linked to projects) for project creation form. Use this when user wants to create a new project.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  // === WORK ORDER FORM ===
  {
    type: "function",
    function: {
      name: "get_projects_for_work_order",
      description: "Get active projects for work order form. Use when user wants to create a work order without specifying a project, or when user says 'skapa arbetsorder'.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  // === CHECK-IN FORM ===
  {
    type: "function",
    function: {
      name: "get_projects_for_check_in",
      description: "Get active projects for check-in (personalliggare) form. Use when user wants to check in.",
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
  // === DELETE ESTIMATE ITEM ===
  {
    type: "function",
    function: {
      name: "delete_estimate_item",
      description: "Delete a specific row/item from an estimate. Use row_number (1-based) or item_id.",
      parameters: {
        type: "object",
        properties: {
          estimate_id: { type: "string", description: "Estimate ID" },
          row_number: { type: "number", description: "Row number to delete (1-based)" },
          item_id: { type: "string", description: "Item ID to delete (alternative to row_number)" },
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
  args: Record<string, unknown>,
  context?: Record<string, unknown>
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

    // === WORK ORDERS ===
    case "create_work_order": {
      const { project_id, title, description, assigned_to, due_date } = args as {
        project_id: string;
        title: string;
        description?: string;
        assigned_to?: string;
        due_date?: string;
      };
      
      // Generate order number
      const { count } = await supabase
        .from("project_work_orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      
      const orderNumber = `AO-${String((count || 0) + 1).padStart(4, "0")}`;
      
      const { data, error } = await supabase
        .from("project_work_orders")
        .insert({
          user_id: userId,
          project_id,
          title,
          description: description || "",
          assigned_to: assigned_to || null,
          due_date: due_date || null,
          order_number: orderNumber,
          status: "pending",
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "search_work_orders": {
      const projectId = args.project_id as string | undefined;
      const status = args.status as string | undefined;
      
      let q = supabase
        .from("project_work_orders")
        .select("id, order_number, title, description, status, due_date, assigned_to, projects(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (projectId) q = q.eq("project_id", projectId);
      if (status) q = q.eq("status", status);
      
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "get_work_order": {
      const { work_order_id } = args as { work_order_id: string };
      
      const { data, error } = await supabase
        .from("project_work_orders")
        .select("*, projects(name, address)")
        .eq("id", work_order_id)
        .eq("user_id", userId)
        .single();
        
      if (error) throw error;
      return data;
    }

    case "update_work_order": {
      const { work_order_id, ...updates } = args as {
        work_order_id: string;
        title?: string;
        description?: string;
        status?: string;
        due_date?: string;
      };
      
      const updateData: Record<string, unknown> = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;
      if (updates.due_date) updateData.due_date = updates.due_date;
      
      const { data, error } = await supabase
        .from("project_work_orders")
        .update(updateData)
        .eq("id", work_order_id)
        .eq("user_id", userId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "delete_work_order": {
      const { work_order_id } = args as { work_order_id: string };
      
      const { error } = await supabase
        .from("project_work_orders")
        .delete()
        .eq("id", work_order_id)
        .eq("user_id", userId);
        
      if (error) throw error;
      return { deleted: true, id: work_order_id };
    }

    // === ÄTA ===
    case "create_ata": {
      const { project_id, description, estimated_cost, estimated_hours, reason } = args as {
        project_id: string;
        description: string;
        estimated_cost?: number;
        estimated_hours?: number;
        reason?: string;
      };
      
      // Generate ATA number
      const { count } = await supabase
        .from("project_ata")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project_id);
      
      const ataNumber = `ÄTA-${String((count || 0) + 1).padStart(3, "0")}`;
      
      const { data, error } = await supabase
        .from("project_ata")
        .insert({
          user_id: userId,
          project_id,
          description,
          estimated_cost: estimated_cost || null,
          estimated_hours: estimated_hours || null,
          reason: reason || "",
          ata_number: ataNumber,
          status: "pending",
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "search_ata": {
      const projectId = args.project_id as string | undefined;
      const status = args.status as string | undefined;
      
      let q = supabase
        .from("project_ata")
        .select("id, ata_number, description, estimated_cost, estimated_hours, status, projects(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (projectId) q = q.eq("project_id", projectId);
      if (status) q = q.eq("status", status);
      
      const { data, error } = await q;
      if (error) throw error;
      return data;
    }

    case "get_ata": {
      const { ata_id } = args as { ata_id: string };
      
      const { data, error } = await supabase
        .from("project_ata")
        .select("*, projects(name, address)")
        .eq("id", ata_id)
        .eq("user_id", userId)
        .single();
        
      if (error) throw error;
      return data;
    }

    case "update_ata": {
      const { ata_id, ...updates } = args as {
        ata_id: string;
        description?: string;
        estimated_cost?: number;
        estimated_hours?: number;
        status?: string;
      };
      
      const updateData: Record<string, unknown> = {};
      if (updates.description) updateData.description = updates.description;
      if (updates.estimated_cost !== undefined) updateData.estimated_cost = updates.estimated_cost;
      if (updates.estimated_hours !== undefined) updateData.estimated_hours = updates.estimated_hours;
      if (updates.status) updateData.status = updates.status;
      
      const { data, error } = await supabase
        .from("project_ata")
        .update(updateData)
        .eq("id", ata_id)
        .eq("user_id", userId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    // === PLANNING ===
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

    case "create_plan": {
      const { project_id, start_date, phases, notes } = args as {
        project_id: string;
        start_date: string;
        phases?: Array<{ name: string; weeks: number }>;
        notes?: string;
      };
      
      // Transform phases to the expected format with startWeek and color
      const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
      let currentWeek = 1;
      const formattedPhases = (phases || []).map((phase, index) => {
        const formatted = {
          id: crypto.randomUUID(),
          name: phase.name,
          startWeek: currentWeek,
          weeks: phase.weeks,
          color: colors[index % colors.length],
        };
        currentWeek += phase.weeks;
        return formatted;
      });
      
      const totalWeeks = formattedPhases.reduce((sum, p) => sum + p.weeks, 0);
      
      const { data, error } = await supabase
        .from("project_plans")
        .insert({
          user_id: userId,
          project_id,
          start_date,
          phases: formattedPhases,
          total_weeks: totalWeeks,
          notes: notes || "",
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    case "update_plan": {
      const { project_id, start_date, phases, notes } = args as {
        project_id: string;
        start_date?: string;
        phases?: Array<{ name: string; weeks: number }>;
        notes?: string;
      };
      
      const updateData: Record<string, unknown> = {};
      if (start_date) updateData.start_date = start_date;
      if (notes !== undefined) updateData.notes = notes;
      
      if (phases) {
        const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
        let currentWeek = 1;
        const formattedPhases = phases.map((phase, index) => {
          const formatted = {
            id: crypto.randomUUID(),
            name: phase.name,
            startWeek: currentWeek,
            weeks: phase.weeks,
            color: colors[index % colors.length],
          };
          currentWeek += phase.weeks;
          return formatted;
        });
        updateData.phases = formattedPhases;
        updateData.total_weeks = formattedPhases.reduce((sum, p) => sum + p.weeks, 0);
      }
      
      const { data, error } = await supabase
        .from("project_plans")
        .update(updateData)
        .eq("project_id", project_id)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    }

    // === FILES ===
    case "list_project_files": {
      const { project_id, category } = args as {
        project_id: string;
        category?: string;
      };
      
      let q = supabase
        .from("project_files")
        .select("id, file_name, file_type, file_size, category, storage_path, created_at")
        .eq("project_id", project_id)
        .order("created_at", { ascending: false });
      
      if (category) q = q.eq("category", category);
      
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }

    case "delete_project_file": {
      const { file_id } = args as { file_id: string };
      
      // Get file info first
      const { data: file } = await supabase
        .from("project_files")
        .select("storage_path")
        .eq("id", file_id)
        .single();
      
      if (file?.storage_path) {
        // Delete from storage
        await supabase.storage.from("project-files").remove([file.storage_path]);
      }
      
      // Delete record
      const { error } = await supabase
        .from("project_files")
        .delete()
        .eq("id", file_id);
        
      if (error) throw error;
      return { deleted: true, id: file_id };
    }

    // === ATTENDANCE / QR ===
    case "generate_attendance_qr": {
      const { project_id } = args as { project_id: string };
      
      // Check if token already exists
      const { data: existing } = await supabase
        .from("attendance_qr_tokens")
        .select("id, token")
        .eq("project_id", project_id)
        .single();
      
      if (existing) {
        return { token: existing.token, project_id, already_exists: true };
      }
      
      // Generate new token
      const token = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from("attendance_qr_tokens")
        .insert({
          project_id,
          created_by: userId,
          token,
        })
        .select()
        .single();
        
      if (error) throw error;
      return { token: data.token, project_id };
    }

    case "get_attendance_qr": {
      const { project_id } = args as { project_id: string };
      
      const { data, error } = await supabase
        .from("attendance_qr_tokens")
        .select("id, token, created_at")
        .eq("project_id", project_id)
        .single();
        
      if (error && error.code !== "PGRST116") throw error;
      
      if (!data) {
        return { exists: false, project_id };
      }
      
      return { token: data.token, project_id, created_at: data.created_at };
    }

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

    // === ECONOMY ===
    case "get_project_economy": {
      const { project_id } = args as { project_id: string };
      
      // Get project with budget
      const { data: project } = await supabase
        .from("projects")
        .select("id, name, budget")
        .eq("id", project_id)
        .single();
      
      // Get estimate if linked
      const { data: estimate } = await supabase
        .from("project_estimates")
        .select("total_excl_vat, total_incl_vat, labor_cost, material_cost")
        .eq("project_id", project_id)
        .single();
      
      // Get time entries
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("hours")
        .eq("project_id", project_id);
      
      const totalHours = (timeEntries || []).reduce((sum, e) => sum + (e.hours || 0), 0);
      
      // Get ÄTA items
      const { data: ataItems } = await supabase
        .from("project_ata")
        .select("estimated_cost, status")
        .eq("project_id", project_id);
      
      const approvedAtaCost = (ataItems || [])
        .filter((a) => a.status === "approved" || a.status === "completed")
        .reduce((sum, a) => sum + (a.estimated_cost || 0), 0);
      
      const pendingAtaCost = (ataItems || [])
        .filter((a) => a.status === "pending")
        .reduce((sum, a) => sum + (a.estimated_cost || 0), 0);
      
      // Get invoiced amount
      const { data: invoices } = await supabase
        .from("customer_invoices")
        .select("total_inc_vat, status")
        .eq("project_id", project_id);
      
      const invoicedAmount = (invoices || [])
        .filter((i) => i.status === "sent" || i.status === "paid")
        .reduce((sum, i) => sum + (i.total_inc_vat || 0), 0);
      
      const paidAmount = (invoices || [])
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (i.total_inc_vat || 0), 0);
      
      return {
        project_id,
        project_name: project?.name,
        budget: project?.budget || 0,
        estimate_total: estimate?.total_incl_vat || 0,
        estimate_labor: estimate?.labor_cost || 0,
        estimate_material: estimate?.material_cost || 0,
        total_hours: totalHours,
        ata_approved: approvedAtaCost,
        ata_pending: pendingAtaCost,
        ata_count: ataItems?.length || 0,
        invoiced_amount: invoicedAmount,
        paid_amount: paidAmount,
        invoice_count: invoices?.length || 0,
      };
    }

    // === PROJECT OVERVIEW (conversational) ===
    case "get_project_overview": {
      const { project_id } = args as { project_id: string };
      
      // Get project with all basic info
      const { data: project } = await supabase
        .from("projects")
        .select("id, name, status, address, city, start_date, budget, client_name")
        .eq("id", project_id)
        .single();
      
      if (!project) {
        throw new Error("Projekt hittades inte");
      }
      
      // Get estimate if linked
      const { data: estimate } = await supabase
        .from("project_estimates")
        .select("total_excl_vat, total_incl_vat, labor_cost, material_cost")
        .eq("project_id", project_id)
        .single();
      
      // Get time entries
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("hours")
        .eq("project_id", project_id);
      
      const totalHours = (timeEntries || []).reduce((sum, e) => sum + (e.hours || 0), 0);
      
      // Get ÄTA items
      const { data: ataItems } = await supabase
        .from("project_ata")
        .select("estimated_cost, status")
        .eq("project_id", project_id);
      
      const approvedAtaCost = (ataItems || [])
        .filter((a) => a.status === "approved" || a.status === "completed")
        .reduce((sum, a) => sum + (a.estimated_cost || 0), 0);
      
      const pendingAtaCount = (ataItems || []).filter((a) => a.status === "pending").length;
      const approvedAtaCount = (ataItems || []).filter((a) => a.status === "approved" || a.status === "completed").length;
      
      // Get invoiced amount
      const { data: invoices } = await supabase
        .from("customer_invoices")
        .select("total_inc_vat, status")
        .eq("project_id", project_id);
      
      const invoicedAmount = (invoices || [])
        .filter((i) => i.status === "sent" || i.status === "paid")
        .reduce((sum, i) => sum + (i.total_inc_vat || 0), 0);
      
      const paidAmount = (invoices || [])
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (i.total_inc_vat || 0), 0);
      
      // Get daily reports (recent activity)
      const { data: reports, count: reportsCount } = await supabase
        .from("daily_reports")
        .select("id, report_date, total_hours", { count: "exact" })
        .eq("project_id", project_id)
        .order("report_date", { ascending: false })
        .limit(5);
      
      const recentReportsHours = (reports || []).reduce((sum, r) => sum + (r.total_hours || 0), 0);
      
      // Get project plan
      const { data: plan } = await supabase
        .from("project_plans")
        .select("start_date, total_weeks, phases")
        .eq("project_id", project_id)
        .single();
      
      // Generate warnings
      const warnings: string[] = [];
      if (!project.start_date) warnings.push("Startdatum saknas");
      if (!plan) warnings.push("Ingen tidsplan");
      if (invoicedAmount === 0 && (estimate?.total_incl_vat || 0) > 0) warnings.push("Inget fakturerat ännu");
      if (totalHours === 0) warnings.push("Ingen tid registrerad");
      
      return {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          address: project.address,
          city: project.city,
          start_date: project.start_date,
          client_name: project.client_name,
        },
        economy: {
          budget: project.budget || 0,
          estimate_total: estimate?.total_incl_vat || 0,
          estimate_labor: estimate?.labor_cost || 0,
          estimate_material: estimate?.material_cost || 0,
          invoiced_amount: invoicedAmount,
          paid_amount: paidAmount,
          invoice_count: invoices?.length || 0,
        },
        time: {
          total_hours: totalHours,
          recent_hours: recentReportsHours,
        },
        reports: {
          count: reportsCount || 0,
          recent: reports || [],
        },
        ata: {
          approved_count: approvedAtaCount,
          pending_count: pendingAtaCount,
          approved_value: approvedAtaCost,
        },
        plan: plan ? {
          start_date: plan.start_date,
          total_weeks: plan.total_weeks,
          phases_count: Array.isArray(plan.phases) ? plan.phases.length : 0,
        } : null,
        warnings,
      };
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

    case "add_estimate_items": {
      const { estimate_id, introduction, timeline, items, addons } = args as {
        estimate_id: string;
        introduction?: string;
        timeline?: string;
        items?: Array<{
          article: string;
          description: string;
          quantity?: number | null;
          unit: string;
          unit_price: number;
        }>;
        addons?: Array<{
          name: string;
          price: number;
        }>;
      };

      // First, verify the estimate belongs to the user
      const { data: estimate, error: fetchError } = await supabase
        .from("project_estimates")
        .select("id, offer_number")
        .eq("id", estimate_id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !estimate) {
        throw new Error("Offert hittades inte");
      }

      // Update scope (project description) and assumptions (timeline) if provided
      const estimateUpdateData: Record<string, unknown> = {};
      if (introduction) {
        estimateUpdateData.scope = introduction;
      }
      if (timeline) {
        // Convert timeline text to array (one line per item)
        estimateUpdateData.assumptions = timeline.split("\n").filter((s: string) => s.trim());
      }
      
      if (Object.keys(estimateUpdateData).length > 0) {
        await supabase
          .from("project_estimates")
          .update(estimateUpdateData)
          .eq("id", estimate_id);
      }

      // Get current max sort_order for items
      const { data: existingItems } = await supabase
        .from("estimate_items")
        .select("sort_order")
        .eq("estimate_id", estimate_id)
        .order("sort_order", { ascending: false })
        .limit(1);

      let sortOrder = (existingItems?.[0]?.sort_order || 0) + 1;
      let itemsAdded = 0;

      // Add items
      if (items && items.length > 0) {
        const itemsToInsert = items.map((item) => {
          // Map Swedish article category to type for summation
          const articleLower = (item.article || "").toLowerCase();
          let type = "labor";
          if (["material", "bygg", "förbrukning", "maskin", "deponi"].includes(articleLower)) {
            type = "material";
          } else if (["ue", "underentreprenör"].includes(articleLower)) {
            type = "subcontractor";
          }

          const qty = item.quantity || 1;
          return {
            estimate_id,
            article: item.article || "Arbete",
            description: item.description || "",
            quantity: qty,
            hours: qty, // Set hours = quantity for correct "Antal" display
            unit: item.unit || "st",
            unit_price: item.unit_price || 0,
            subtotal: qty * (item.unit_price || 0),
            type,
            moment: item.description || "Arbete",
            sort_order: sortOrder++,
          };
        });

        const { error: itemsError } = await supabase
          .from("estimate_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
        itemsAdded = items.length;
      }

      // Add addons
      if (addons && addons.length > 0) {
        const addonsToInsert = addons.map((addon, index) => ({
          estimate_id,
          name: addon.name,
          price: addon.price,
          is_selected: false,
          sort_order: index + 1,
        }));

        const { error: addonsError } = await supabase
          .from("estimate_addons")
          .insert(addonsToInsert);

        if (addonsError) throw addonsError;
        itemsAdded += addons.length;
      }

      // Recalculate totals
      const { data: allItems } = await supabase
        .from("estimate_items")
        .select("subtotal, type")
        .eq("estimate_id", estimate_id);

      const laborCost = allItems?.reduce((sum, i) => i.type === "labor" ? sum + (i.subtotal || 0) : sum, 0) || 0;
      const materialCost = allItems?.reduce((sum, i) => i.type === "material" ? sum + (i.subtotal || 0) : sum, 0) || 0;
      const subcontractorCost = allItems?.reduce((sum, i) => i.type === "subcontractor" ? sum + (i.subtotal || 0) : sum, 0) || 0;
      const totalExclVat = allItems?.reduce((sum, i) => sum + (i.subtotal || 0), 0) || 0;
      const totalInclVat = totalExclVat * 1.25;

      await supabase
        .from("project_estimates")
        .update({
          labor_cost: laborCost,
          material_cost: materialCost,
          subcontractor_cost: subcontractorCost,
          total_excl_vat: totalExclVat,
          total_incl_vat: totalInclVat,
        })
        .eq("id", estimate_id);

      return {
        id: estimate.id,
        offer_number: estimate.offer_number,
        items_added: itemsAdded,
      };
    }

    case "delete_estimate_item": {
      const { estimate_id, row_number, item_id } = args as {
        estimate_id: string;
        row_number?: number;
        item_id?: string;
      };

      // Verify the estimate belongs to the user
      const { data: estimate, error: fetchError } = await supabase
        .from("project_estimates")
        .select("id, offer_number")
        .eq("id", estimate_id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !estimate) {
        throw new Error("Offert hittades inte");
      }

      let deletedItemId: string | null = null;
      let deletedDescription = "";

      if (item_id) {
        // Delete by item ID
        const { data: item } = await supabase
          .from("estimate_items")
          .select("id, description, moment")
          .eq("id", item_id)
          .eq("estimate_id", estimate_id)
          .single();
        
        if (!item) throw new Error("Rad hittades inte");
        deletedItemId = item.id;
        deletedDescription = item.description || item.moment || "";
        
        await supabase
          .from("estimate_items")
          .delete()
          .eq("id", item_id);
      } else if (row_number) {
        // Delete by row number (1-based)
        const { data: items } = await supabase
          .from("estimate_items")
          .select("id, description, moment, sort_order")
          .eq("estimate_id", estimate_id)
          .order("sort_order", { ascending: true });

        if (!items || items.length === 0) {
          throw new Error("Offerten har inga rader");
        }

        const index = row_number - 1;
        if (index < 0 || index >= items.length) {
          throw new Error(`Rad ${row_number} finns inte. Offerten har ${items.length} rader.`);
        }

        const itemToDelete = items[index];
        deletedItemId = itemToDelete.id;
        deletedDescription = itemToDelete.description || itemToDelete.moment || "";

        await supabase
          .from("estimate_items")
          .delete()
          .eq("id", deletedItemId);
      } else {
        throw new Error("Ange antingen row_number eller item_id");
      }

      // Recalculate totals
      const { data: allItems } = await supabase
        .from("estimate_items")
        .select("subtotal, type")
        .eq("estimate_id", estimate_id);

      const laborCost = allItems?.reduce((sum, i) => i.type === "labor" ? sum + (i.subtotal || 0) : sum, 0) || 0;
      const materialCost = allItems?.reduce((sum, i) => i.type === "material" ? sum + (i.subtotal || 0) : sum, 0) || 0;
      const subcontractorCost = allItems?.reduce((sum, i) => i.type === "subcontractor" ? sum + (i.subtotal || 0) : sum, 0) || 0;
      const totalExclVat = allItems?.reduce((sum, i) => sum + (i.subtotal || 0), 0) || 0;
      const totalInclVat = totalExclVat * 1.25;

      await supabase
        .from("project_estimates")
        .update({
          labor_cost: laborCost,
          material_cost: materialCost,
          subcontractor_cost: subcontractorCost,
          total_excl_vat: totalExclVat,
          total_incl_vat: totalInclVat,
        })
        .eq("id", estimate_id);

      return {
        deleted: true,
        item_id: deletedItemId,
        description: deletedDescription,
        offer_number: estimate.offer_number,
        remaining_items: allItems?.length || 0,
      };
    }

    case "create_project": {
      const { estimate_id } = args as { estimate_id: string };

      // Fetch estimate data
      const { data: estimate, error: estError } = await supabase
        .from("project_estimates")
        .select("manual_project_name, manual_client_name, manual_address, manual_postal_code, manual_city, manual_latitude, manual_longitude, offer_number")
        .eq("id", estimate_id)
        .single();

      if (estError || !estimate) {
        throw new Error("Offerten hittades inte");
      }

      // Create project with estimate data
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: userId,
          name: estimate.manual_project_name || estimate.offer_number || "Nytt projekt",
          client_name: estimate.manual_client_name || null,
          address: estimate.manual_address || null,
          postal_code: estimate.manual_postal_code || null,
          city: estimate.manual_city || null,
          latitude: estimate.manual_latitude || null,
          longitude: estimate.manual_longitude || null,
          estimate_id,
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
      
      // Check if user is admin (no employer_id) or employee
      const { data: userData } = await supabase.auth.getUser();
      const employerId = userData?.user?.user_metadata?.employer_id;
      const isAdmin = !employerId;
      
      let q = supabase
        .from("time_entries")
        .select("id, date, hours, description, project_id, user_id, employer_id, projects(name)")
        .gte("date", start_date)
        .lte("date", end_date)
        .order("date", { ascending: false });
      
      if (isAdmin) {
        // Admin: fetch own entries + employee entries (where employer_id = admin's user id)
        q = q.or(`user_id.eq.${userId},employer_id.eq.${userId}`);
      } else {
        // Employee: only own entries
        q = q.eq("user_id", userId);
      }
      
      if (project_id) q = q.eq("project_id", project_id);
      
      const { data, error } = await q;
      if (error) throw error;
      
      const totalHours = (data || []).reduce((sum: number, entry: any) => sum + (entry.hours || 0), 0);
      return { entries: data, totalHours, period: { start_date, end_date } };
    }

    case "create_daily_report": {
      const { 
        project_id, 
        work_items, 
        headcount, 
        hours_per_person,
        total_hours, 
        roles,
        deviations,
        ata,
        materials_delivered,
        materials_missing,
        notes 
      } = args as {
        project_id: string;
        work_items?: string[];
        headcount?: number;
        hours_per_person?: number;
        total_hours?: number;
        roles?: string[];
        deviations?: Array<{ type: string; description: string; hours: number | null }>;
        ata?: { has_ata: boolean; items: Array<{ reason: string; consequence: string; estimated_hours: number | null }> };
        materials_delivered?: string[];
        materials_missing?: string[];
        notes?: string;
      };

      // Check if we have pendingData from form submission
      const pendingData = context?.pendingData as Record<string, unknown> | undefined;
      
      // Use pendingData if available (from form), otherwise use AI-extracted args
      const finalWorkItems = pendingData?.workItems as string[] || work_items || [];
      const finalHeadcount = pendingData?.headcount as number || headcount || 1;
      const finalHoursPerPerson = pendingData?.hoursPerPerson as number || hours_per_person;
      const finalTotalHours = pendingData?.totalHours as number || total_hours || (finalHeadcount * (finalHoursPerPerson || 8));
      const finalRoles = pendingData?.roles as string[] || roles || [];
      
      // Handle deviations from form
      const formDeviations = pendingData?.deviations as Array<{ type: string; description: string; hours: number | null }> | undefined;
      const finalDeviations = formDeviations || deviations || [];
      
      // Handle ÄTA from form
      const formAta = pendingData?.ata as Array<{ reason: string; consequence: string; estimatedHours: number | null }> | undefined;
      const finalAta = formAta && formAta.length > 0 
        ? { has_ata: true, items: formAta.map(a => ({ reason: a.reason, consequence: a.consequence, estimated_hours: a.estimatedHours })) }
        : ata || null;
      
      // Handle materials from form (convert string to array)
      const formMaterialsDelivered = pendingData?.materialsDelivered as string | undefined;
      const formMaterialsMissing = pendingData?.materialsMissing as string | undefined;
      const finalMaterialsDelivered = formMaterialsDelivered 
        ? formMaterialsDelivered.split(",").map(s => s.trim()).filter(Boolean)
        : materials_delivered || [];
      const finalMaterialsMissing = formMaterialsMissing
        ? formMaterialsMissing.split(",").map(s => s.trim()).filter(Boolean)
        : materials_missing || [];
      
      const finalNotes = pendingData?.notes as string || notes || "";
      const reportDate = new Date().toISOString().split('T')[0];
      
      // Check if a report already exists for this project + date + user
      const { data: existing } = await supabase
        .from("daily_reports")
        .select("id")
        .eq("project_id", project_id)
        .eq("report_date", reportDate)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (existing) {
        // Update existing report
        const { data, error } = await supabase
          .from("daily_reports")
          .update({
            work_items: finalWorkItems,
            headcount: finalHeadcount,
            hours_per_person: finalHoursPerPerson,
            total_hours: finalTotalHours,
            roles: finalRoles,
            deviations: finalDeviations as any,
            ata: finalAta as any,
            materials_delivered: finalMaterialsDelivered,
            materials_missing: finalMaterialsMissing,
            notes: finalNotes,
          })
          .eq("id", existing.id)
          .select()
          .single();
          
        if (error) throw error;
        return { ...data, updated: true };
      } else {
        // Create new report
        const { data, error } = await supabase
          .from("daily_reports")
          .insert({
            user_id: userId,
            project_id,
            work_items: finalWorkItems,
            headcount: finalHeadcount,
            hours_per_person: finalHoursPerPerson,
            total_hours: finalTotalHours,
            roles: finalRoles,
            deviations: finalDeviations as any,
            ata: finalAta as any,
            materials_delivered: finalMaterialsDelivered,
            materials_missing: finalMaterialsMissing,
            notes: finalNotes,
            report_date: reportDate,
          })
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
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

    case "get_active_projects_for_time": {
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
      const { data, error } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", userId)
        .order("name");
        
      if (error) throw error;
      return data || [];
    }

    case "get_projects_for_daily_report": {
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
      return { showForm: true };
    }

    case "get_project_form": {
      // Get estimates already linked to projects
      const { data: projects } = await supabase
        .from("projects")
        .select("estimate_id")
        .eq("user_id", userId);
      
      const linkedEstimateIds = (projects || [])
        .map(p => p.estimate_id)
        .filter(Boolean) as string[];
      
      // Fetch estimates NOT linked to any project
      let query = supabase
        .from("project_estimates")
        .select("id, offer_number, manual_project_name, manual_client_name, manual_address, status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (linkedEstimateIds.length > 0) {
        query = query.not("id", "in", `(${linkedEstimateIds.join(",")})`);
      }
      
      const { data: estimates, error } = await query;
      if (error) throw error;
      return { estimates: estimates || [] };
    }

    case "get_projects_for_work_order": {
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, address")
        .eq("user_id", userId)
        .in("status", ["active", "planning"])
        .order("name");
        
      if (projectsError) throw projectsError;

      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("id, name")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("name");
        
      if (employeesError) throw employeesError;

      return { projects: projects || [], employees: employees || [] };
    }

    case "get_projects_for_check_in": {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, address")
        .eq("user_id", userId)
        .in("status", ["active", "planning"])
        .order("name");
        
      if (error) throw error;
      return data || [];
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
  const toolsWithCustomEmptyHandling = ["get_customers_for_estimate"];
  if (
    (!results || (Array.isArray(results) && results.length === 0)) &&
    !toolsWithCustomEmptyHandling.includes(toolName)
  ) {
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

    // === WORK ORDERS ===
    case "create_work_order": {
      const wo = results as { id: string; order_number: string; title: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Arbetsorder ${wo.order_number} "${wo.title}" har skapats!`,
          link: {
            label: "Öppna projekt",
            href: `/projects/${wo.id}`,
          },
          nextActions: [
            { label: "Skapa ny arbetsorder", icon: "plus", prompt: "Skapa en ny arbetsorder" },
            { label: "Visa arbetsordrar", icon: "list", prompt: "Visa mina arbetsordrar" },
          ],
          showFeedback: true,
          taskType: "create_work_order",
        },
      };
    }

    case "search_work_orders": {
      const orders = results as Array<{
        id: string;
        order_number: string;
        title: string;
        status: string;
        due_date?: string;
        projects?: { name: string };
      }>;
      
      const translateStatus = (status: string): string => {
        const map: Record<string, string> = {
          pending: "Väntande",
          in_progress: "Pågående",
          completed: "Klar",
        };
        return map[status] || status;
      };
      
      const getStatusColor = (status: string): "green" | "yellow" | "blue" | "gray" => {
        const map: Record<string, "green" | "yellow" | "blue" | "gray"> = {
          pending: "yellow",
          in_progress: "blue",
          completed: "green",
        };
        return map[status] || "gray";
      };
      
      return {
        type: "list",
        content: orders.length > 0 
          ? `Här är ${orders.length} arbetsord${orders.length > 1 ? "rar" : "er"}:`
          : "Inga arbetsordrar hittades.",
        data: {
          listType: "work_order",
          listItems: orders.map((wo) => ({
            id: wo.id,
            title: `${wo.order_number}: ${wo.title}`,
            subtitle: wo.projects?.name || "Okänt projekt",
            status: translateStatus(wo.status),
            statusColor: getStatusColor(wo.status),
            details: wo.due_date ? [{ label: "Förfaller", value: wo.due_date }] : [],
          })),
        },
      };
    }

    case "get_work_order": {
      const wo = results as any;
      return {
        type: "result",
        content: `**${wo.order_number}: ${wo.title}**

**Projekt:** ${wo.projects?.name || "Ej angivet"}
**Status:** ${wo.status === "pending" ? "Väntande" : wo.status === "in_progress" ? "Pågående" : "Klar"}
**Förfallodatum:** ${wo.due_date || "Ej angivet"}

**Beskrivning:**
${wo.description || "Ingen beskrivning"}`,
        data: {
          success: true,
          resultMessage: "",
          nextActions: [
            { label: "Markera som klar", icon: "check", prompt: "Markera arbetsorder som klar" },
            { label: "Redigera", icon: "edit", prompt: "Uppdatera arbetsordern" },
          ],
        },
      };
    }

    case "update_work_order": {
      const wo = results as { id: string; order_number: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Arbetsorder ${wo.order_number} har uppdaterats!`,
          nextActions: [
            { label: "Visa arbetsordrar", icon: "list", prompt: "Visa arbetsordrar" },
          ],
        },
      };
    }

    case "delete_work_order":
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: "Arbetsordern har tagits bort!",
          nextActions: [
            { label: "Visa arbetsordrar", icon: "list", prompt: "Visa arbetsordrar" },
          ],
        },
      };

    // === ÄTA ===
    case "create_ata": {
      const ata = results as { id: string; ata_number: string; description: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `ÄTA ${ata.ata_number} har skapats: "${ata.description}"`,
          nextActions: [
            { label: "Skapa ny ÄTA", icon: "plus", prompt: "Skapa en ny ÄTA" },
            { label: "Visa alla ÄTA", icon: "list", prompt: "Visa alla ÄTA" },
          ],
        },
      };
    }

    case "search_ata": {
      const items = results as Array<{
        id: string;
        ata_number: string;
        description: string;
        estimated_cost?: number;
        status: string;
        projects?: { name: string };
      }>;
      
      const translateStatus = (status: string): string => {
        const map: Record<string, string> = {
          pending: "Väntande",
          approved: "Godkänd",
          rejected: "Avvisad",
          completed: "Utförd",
        };
        return map[status] || status;
      };
      
      const getStatusColor = (status: string): "green" | "yellow" | "blue" | "gray" => {
        const map: Record<string, "green" | "yellow" | "blue" | "gray"> = {
          pending: "yellow",
          approved: "green",
          rejected: "gray",
          completed: "blue",
        };
        return map[status] || "gray";
      };
      
      return {
        type: "list",
        content: items.length > 0 
          ? `Här är ${items.length} ÄTA-ärende${items.length > 1 ? "n" : ""}:`
          : "Inga ÄTA-ärenden hittades.",
        data: {
          listType: "ata",
          listItems: items.map((ata) => ({
            id: ata.id,
            title: `${ata.ata_number}: ${ata.description.slice(0, 50)}${ata.description.length > 50 ? "..." : ""}`,
            subtitle: ata.projects?.name || "Okänt projekt",
            status: translateStatus(ata.status),
            statusColor: getStatusColor(ata.status),
            details: ata.estimated_cost 
              ? [{ label: "Kostnad", value: `${ata.estimated_cost.toLocaleString("sv-SE")} kr` }] 
              : [],
          })),
        },
      };
    }

    case "get_ata": {
      const ata = results as any;
      return {
        type: "result",
        content: `**${ata.ata_number}**

**Projekt:** ${ata.projects?.name || "Ej angivet"}
**Status:** ${ata.status === "pending" ? "Väntande godkännande" : ata.status === "approved" ? "Godkänd" : ata.status === "rejected" ? "Avvisad" : "Utförd"}

**Beskrivning:**
${ata.description}

**Ekonomi:**
- Beräknad kostnad: ${(ata.estimated_cost || 0).toLocaleString("sv-SE")} kr
- Beräknade timmar: ${ata.estimated_hours || 0}h

${ata.reason ? `**Anledning:** ${ata.reason}` : ""}`,
        data: {
          success: true,
          resultMessage: "",
          nextActions: [
            { label: "Godkänn ÄTA", icon: "check", prompt: "Godkänn denna ÄTA" },
            { label: "Uppdatera kostnad", icon: "edit", prompt: "Uppdatera kostnaden" },
          ],
        },
      };
    }

    case "update_ata": {
      const ata = results as { id: string; ata_number: string };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `ÄTA ${ata.ata_number} har uppdaterats!`,
          nextActions: [
            { label: "Visa alla ÄTA", icon: "list", prompt: "Visa ÄTA-ärenden" },
          ],
        },
      };
    }

    // === PLANNING ===
    case "get_project_plan": {
      const plan = results as { id: string; phases: any[]; total_weeks: number; start_date?: string; notes?: string } | null;
      if (!plan) {
        return {
          type: "text",
          content: "Det finns ingen planering för detta projekt ännu. Vill du att jag skapar en?",
        };
      }
      
      const phaseList = (plan.phases || []).map((p: any) => `- ${p.name}: ${p.weeks} veckor`).join("\n");
      
      return {
        type: "result",
        content: `**Projektplanering**

**Startdatum:** ${plan.start_date || "Ej angivet"}
**Totalt:** ${plan.total_weeks || 0} veckor

**Faser:**
${phaseList || "Inga faser definierade"}

${plan.notes ? `**Anteckningar:** ${plan.notes}` : ""}`,
        data: {
          success: true,
          resultMessage: "",
          link: {
            label: "Öppna planering",
            href: `/planning`,
          },
          nextActions: [
            { label: "Uppdatera planering", icon: "edit", prompt: "Uppdatera planeringen" },
            { label: "Lägg till fas", icon: "plus", prompt: "Lägg till en ny fas" },
          ],
        },
      };
    }

    case "create_plan": {
      const plan = results as { id: string; total_weeks: number; phases: any[] };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Planering skapad med ${plan.phases?.length || 0} faser och totalt ${plan.total_weeks || 0} veckor!`,
          link: {
            label: "Öppna planering",
            href: `/planning`,
          },
          nextActions: [
            { label: "Visa planering", icon: "calendar", prompt: "Visa planeringen" },
            { label: "Lägg till fas", icon: "plus", prompt: "Lägg till en fas" },
          ],
        },
      };
    }

    case "update_plan": {
      const plan = results as { id: string; total_weeks: number };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Planeringen har uppdaterats! Totalt ${plan.total_weeks || 0} veckor.`,
          link: {
            label: "Öppna planering",
            href: `/planning`,
          },
          nextActions: [
            { label: "Visa planering", icon: "calendar", prompt: "Visa planeringen" },
          ],
        },
      };
    }

    // === FILES ===
    case "list_project_files": {
      const files = results as Array<{
        id: string;
        file_name: string;
        file_type: string;
        file_size?: number;
        category?: string;
        created_at: string;
      }>;
      
      if (files.length === 0) {
        return {
          type: "text",
          content: "Det finns inga filer för detta projekt ännu. Du kan ladda upp filer genom projektets filsektion.",
        };
      }
      
      return {
        type: "file_list",
        content: `Projektet har ${files.length} fil${files.length > 1 ? "er" : ""}:`,
        data: {
          files: files.map((f) => ({
            id: f.id,
            name: f.file_name,
            type: f.file_type,
            size: f.file_size,
            category: f.category,
            date: f.created_at,
          })),
        },
      };
    }

    case "delete_project_file":
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: "Filen har tagits bort!",
          nextActions: [
            { label: "Visa filer", icon: "folder", prompt: "Visa projektets filer" },
          ],
        },
      };

    // === ATTENDANCE / QR ===
    case "generate_attendance_qr": {
      const result = results as { token: string; project_id: string; already_exists?: boolean };
      return {
        type: "qr_code",
        content: result.already_exists 
          ? "QR-kod för närvaro finns redan för detta projekt:"
          : "QR-kod för närvaro har genererats!",
        data: {
          token: result.token,
          project_id: result.project_id,
          url: `https://datavoxx.se/attendance/scan?token=${result.token}`,
        },
      };
    }

    case "get_attendance_qr": {
      const result = results as { token?: string; project_id: string; exists?: boolean };
      
      if (!result.token) {
        return {
          type: "text",
          content: "Det finns ingen QR-kod för detta projekt ännu. Vill du att jag skapar en?",
        };
      }
      
      return {
        type: "qr_code",
        content: "Här är QR-koden för närvaro:",
        data: {
          token: result.token,
          project_id: result.project_id,
          url: `https://datavoxx.se/attendance/scan?token=${result.token}`,
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
          showFeedback: true,
          taskType: "check_in",
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
          showFeedback: true,
          taskType: "check_out",
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

    // === ECONOMY ===
    case "get_project_economy": {
      const eco = results as {
        project_name?: string;
        budget: number;
        estimate_total: number;
        estimate_labor: number;
        estimate_material: number;
        total_hours: number;
        ata_approved: number;
        ata_pending: number;
        ata_count: number;
        invoiced_amount: number;
        paid_amount: number;
        invoice_count: number;
      };
      
      return {
        type: "economy_overview",
        content: `**Ekonomisk översikt: ${eco.project_name || "Projekt"}**

**Budget & Offert:**
- Budget: ${eco.budget.toLocaleString("sv-SE")} kr
- Offert totalt: ${eco.estimate_total.toLocaleString("sv-SE")} kr
- Varav arbete: ${eco.estimate_labor.toLocaleString("sv-SE")} kr
- Varav material: ${eco.estimate_material.toLocaleString("sv-SE")} kr

**Tidsredovisning:**
- Totalt registrerade timmar: ${eco.total_hours}h

**ÄTA-arbeten:** (${eco.ata_count} st)
- Godkända: ${eco.ata_approved.toLocaleString("sv-SE")} kr
- Väntande: ${eco.ata_pending.toLocaleString("sv-SE")} kr

**Fakturering:** (${eco.invoice_count} fakturor)
- Fakturerat: ${eco.invoiced_amount.toLocaleString("sv-SE")} kr
- Betalt: ${eco.paid_amount.toLocaleString("sv-SE")} kr`,
        data: {
          ...eco,
        },
      };
    }

    // === PROJECT OVERVIEW (conversational) ===
    case "get_project_overview": {
      const data = results as {
        project: {
          id: string;
          name: string;
          status: string;
          address?: string;
          city?: string;
          start_date?: string;
          client_name?: string;
        };
        economy: {
          budget: number;
          estimate_total: number;
          estimate_labor: number;
          estimate_material: number;
          invoiced_amount: number;
          paid_amount: number;
          invoice_count: number;
        };
        time: {
          total_hours: number;
          recent_hours: number;
        };
        reports: {
          count: number;
          recent: Array<{ id: string; report_date: string; total_hours: number }>;
        };
        ata: {
          approved_count: number;
          pending_count: number;
          approved_value: number;
        };
        plan: {
          start_date: string;
          total_weeks: number;
          phases_count: number;
        } | null;
        warnings: string[];
      };
      
      // Translate status
      const translateStatus = (status: string): string => {
        const statusMap: Record<string, string> = {
          planning: "i planeringsfas",
          active: "pågående",
          closing: "i avslutningsfas",
          completed: "avslutat",
        };
        return statusMap[status] || status || "okänd status";
      };
      
      // Build conversational summary
      let summary = `**${data.project.name}** är ${translateStatus(data.project.status)}.`;
      
      // Economy section
      if (data.economy.estimate_total > 0) {
        const invoicedPct = Math.round((data.economy.invoiced_amount / data.economy.estimate_total) * 100);
        summary += ` Fakturerat ${invoicedPct}% av offerten (${data.economy.invoiced_amount.toLocaleString("sv-SE")} av ${data.economy.estimate_total.toLocaleString("sv-SE")} kr).`;
      } else if (data.economy.budget > 0) {
        summary += ` Budget: ${data.economy.budget.toLocaleString("sv-SE")} kr.`;
      }
      
      // Activity section
      if (data.reports.count > 0 || data.time.total_hours > 0) {
        summary += ` ${data.reports.count} dagrapport${data.reports.count !== 1 ? "er" : ""}, ${data.time.total_hours} timmar registrerade.`;
      }
      
      // ÄTA section
      if (data.ata.approved_count > 0 || data.ata.pending_count > 0) {
        const ataParts = [];
        if (data.ata.approved_count > 0) {
          ataParts.push(`${data.ata.approved_count} godkända (+${data.ata.approved_value.toLocaleString("sv-SE")} kr)`);
        }
        if (data.ata.pending_count > 0) {
          ataParts.push(`${data.ata.pending_count} väntande`);
        }
        summary += ` ÄTA: ${ataParts.join(", ")}.`;
      }
      
      // Plan section
      if (data.plan) {
        summary += ` Planering: ${data.plan.phases_count} faser, ${data.plan.total_weeks} veckor.`;
      }
      
      // Warnings section
      if (data.warnings.length > 0) {
        summary += ` ⚠️ ${data.warnings.join(", ")}.`;
      }
      
      return {
        type: "text",
        content: summary,
        data: {
          project_name: data.project.name,
          ...data.economy,
          total_hours: data.time.total_hours,
          ata_approved: data.ata.approved_value,
          ata_count: data.ata.approved_count + data.ata.pending_count,
          warnings: data.warnings,
          nextActions: [
            { label: "Visa ekonomi", icon: "dollar-sign", prompt: `ekonomi för ${data.project.name}` },
            { label: "Öppna projekt", icon: "folder", prompt: `visa ${data.project.name}` },
            { label: "Skapa dagrapport", icon: "file-text", prompt: `ny dagrapport för ${data.project.name}` },
          ],
        },
      };
    }

    // === CREATE ===
    case "create_estimate": {
      const estimate = results as { id: string; offer_number: string };
      // Return estimate_items_form to continue the flow
      return {
        type: "estimate_items_form",
        content: `Offert ${estimate.offer_number} skapad! Lägg till offertposter nedan.`,
        data: {
          estimateId: estimate.id,
          offerNumber: estimate.offer_number,
        },
        context: {
          selectedEstimateId: estimate.id,
        },
      };
    }

    case "add_estimate_items": {
      const result = results as { id: string; offer_number: string; items_added: number };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Offert ${result.offer_number} uppdaterad med ${result.items_added} poster!`,
          link: {
            label: "Öppna offert",
            href: `/estimates?estimateId=${result.id}`,
          },
          downloadLink: {
            label: "Ladda ner PDF",
            href: `/estimates?estimateId=${result.id}&download=true`,
          },
          showFeedback: true,
          taskType: "add_estimate_items",
        },
      };
    }

    case "delete_estimate_item": {
      const result = results as { 
        deleted: boolean; 
        item_id: string; 
        description: string; 
        offer_number: string;
        remaining_items: number;
      };
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Rad "${result.description || "utan beskrivning"}" har tagits bort från ${result.offer_number}. ${result.remaining_items} rader kvar.`,
          nextActions: [
            { label: "Visa offert", icon: "file-text", prompt: "Visa offerten" },
            { label: "Ta bort fler rader", icon: "trash", prompt: "Ta bort rad" },
          ],
        },
        context: {
          selectedEstimateId: undefined, // Keep context
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
            { label: "Skapa arbetsorder", icon: "clipboard", prompt: "Skapa arbetsorder för projektet" },
          ],
          showFeedback: true,
          taskType: "create_project",
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
          showFeedback: true,
          taskType: "register_time",
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
      const report = results as { id: string; updated?: boolean };
      const actionText = report.updated ? "uppdaterad" : "skapad";
      return {
        type: "result",
        content: "",
        data: {
          success: true,
          resultMessage: `Dagrapport ${actionText}!`,
          link: {
            label: "Öppna rapport",
            href: `/reports/${report.id}`,
          },
          nextActions: [
            { label: "Skapa ny rapport", icon: "plus", prompt: "Skapa en till dagrapport" },
            { label: "Visa alla rapporter", icon: "list", prompt: "Visa mina dagrapporter" },
          ],
          showFeedback: true,
          taskType: "create_daily_report",
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
          type: "result",
          content: "",
          data: {
            success: false,
            resultMessage: "Du har inga kunder ännu att koppla en offert till. Skapa en kund först så kan vi börja!",
            nextActions: [
              { label: "Skapa ny kund", icon: "user-plus", prompt: "Jag vill skapa en ny kund" },
            ],
          },
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
      const result = results as { 
        estimates: Array<{ 
          id: string; 
          offer_number: string | null; 
          manual_project_name: string | null;
          manual_client_name: string | null;
          manual_address: string | null;
          status: string;
        }> 
      };
      
      if (result.estimates.length === 0) {
        return {
          type: "text",
          content: "Du har inga tillgängliga offerter att skapa projekt från. Skapa en offert först, eller säg 'skapa offert'.",
        };
      }
      
      return {
        type: "project_form",
        content: "",
        data: {
          estimates: result.estimates,
        },
      };
    }

    case "get_projects_for_work_order": {
      const result = results as { 
        projects: Array<{ id: string; name: string; address?: string }>;
        employees: Array<{ id: string; name: string }>;
      };
      
      if (result.projects.length === 0) {
        return {
          type: "text",
          content: "Du har inga aktiva projekt. Skapa ett projekt först.",
        };
      }
      
      return {
        type: "work_order_form",
        content: "",
        data: {
          projects: result.projects,
          employees: result.employees,
        },
      };
    }

    case "get_projects_for_check_in": {
      const projects = results as Array<{ id: string; name: string; address?: string }>;
      
      if (projects.length === 0) {
        return {
          type: "text",
          content: "Du har inga aktiva projekt att checka in på.",
        };
      }
      
      return {
        type: "check_in_form",
        content: "",
        data: {
          projects,
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
          showFeedback: true,
          taskType: "create_customer",
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
      
      const laborTotal = estimate.items?.reduce((sum: number, item: any) => 
        item.type === 'labor' ? sum + (item.subtotal || 0) : sum, 0) || 0;
      const materialTotal = estimate.items?.reduce((sum: number, item: any) => 
        item.type === 'material' ? sum + (item.subtotal || 0) : sum, 0) || 0;
      
      // Build item details with quantity
      let itemsDetails = "";
      if (estimate.items && estimate.items.length > 0) {
        itemsDetails = "\n\n**Offertposter:**\n" + estimate.items.map((item: any, idx: number) => {
          const qty = item.quantity ?? 1;
          const unitPrice = item.unit_price ?? 0;
          const subtotal = item.subtotal ?? (qty * unitPrice);
          const desc = item.description || item.moment || "-";
          return `${idx + 1}. ${desc} – ${qty} ${item.unit || 'st'} × ${unitPrice.toLocaleString('sv-SE')} kr = **${subtotal.toLocaleString('sv-SE')} kr**`;
        }).join("\n");
      }
      
      return {
        type: "result",
        content: `**${estimate.offer_number || 'Offert'}**

**Projekt:** ${estimate.manual_project_name || 'Ej angivet'}
**Kund:** ${estimate.manual_client_name || 'Ej angiven'}
**Status:** ${estimate.status || 'Utkast'}
${itemsDetails}

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
            { label: "Visa ekonomi", icon: "dollar-sign", prompt: "Visa ekonomisk översikt" },
            { label: "Skapa arbetsorder", icon: "file-text", prompt: "Skapa arbetsorder" },
            { label: "Lägg till ÄTA", icon: "plus-circle", prompt: "Lägg till ÄTA" },
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

    // === DIRECT COMMAND PATTERNS ===
    // Bypass AI when message contains all required data for specific operations
    // This prevents the AI from misinterpreting "Skapa offert X för kund med ID Y" as a form request
    
    // Pattern 1: Skapa offert "titel" för kund med ID uuid
    const createEstimatePattern = /(?:skapa|create)\s*offert\s*[""]([^""]+)[""].*(?:kund med ID|customer_id)[=:\s]*([a-f0-9-]{36})/i;
    const createEstimateMatch = message.match(createEstimatePattern);
    
    if (createEstimateMatch) {
      const [, title, customerId] = createEstimateMatch;
      const addressMatch = message.match(/(?:på adress|address)[=:\s]+(.+?)(?:\s+för|\s*$)/i);
      const address = addressMatch?.[1]?.trim() || "";
      
      console.log("Direct pattern matched: create_estimate", { title, customerId, address });
      
      const result = await executeTool(supabase, userId, "create_estimate", {
        customer_id: customerId,
        title: title.trim(),
        address,
      }, context);
      
      const formatted = formatToolResults("create_estimate", result);
      return new Response(JSON.stringify(formatted), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Pattern 2: Lägg till poster på offert med ID uuid (with pending data in context)
    // Updated regex to allow numbers between "lägg till" and "poster" (e.g., "Lägg till 1 poster...")
    const addItemsPattern = /(?:lägg till|add|spara)\s*(?:\d+\s*)?(?:poster|rader|offertposter|items|offert)\b.*?(?:offert med ID|estimate_id)\s*[:=]?\s*([a-f0-9-]{36})/i;
    const addItemsMatch = message.match(addItemsPattern);
    
    // Also extract UUID from message for failsafe
    const uuidInMessage = message.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)?.[1];
    
    // Failsafe: If pendingData has items/addons AND message contains UUID, execute directly
    const hasPendingEstimateData = context?.pendingData && 
      (Array.isArray(context.pendingData.items) || Array.isArray(context.pendingData.addons));
    const estimateIdFromContext = context?.pendingData?.estimateId || context?.selectedEstimateId;
    
    if ((addItemsMatch || (hasPendingEstimateData && (uuidInMessage || estimateIdFromContext))) && context?.pendingData) {
      const estimateId = addItemsMatch?.[1] || uuidInMessage || estimateIdFromContext;
      
      console.log("Direct pattern matched: add_estimate_items", { 
        estimateId, 
        pendingData: context.pendingData,
        matchMethod: addItemsMatch ? "regex" : "failsafe"
      });
      
      const result = await executeTool(supabase, userId, "add_estimate_items", {
        estimate_id: estimateId,
        introduction: context.pendingData.introduction,
        timeline: context.pendingData.timeline,
        items: context.pendingData.items,
        addons: context.pendingData.addons,
      }, context);
      
      const formatted = formatToolResults("add_estimate_items", result);
      
      // Clear pendingData after successful execution to prevent duplicates
      return new Response(JSON.stringify({
        ...formatted,
        context: {
          pendingData: null,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Define which tools need auto-injection of IDs
    const PROJECT_TOOLS = [
      "create_work_order", "search_work_orders", 
      "create_ata", "search_ata",
      "get_project_plan", "create_plan", "update_plan",
      "list_project_files",
      "generate_attendance_qr", "get_attendance_qr",
      "check_in", "check_out", "get_active_attendance",
      "get_project_economy", "get_project_overview",
      "search_daily_reports", "create_daily_report",
      "search_inspections", "create_inspection",
      "register_time", "get_time_summary",
    ];
    
    const CUSTOMER_TOOLS = [
      "create_estimate", "create_project",
    ];

    // Helper function to resolve project name to UUID
    async function resolveProjectId(input: string): Promise<{ id: string; name: string } | null> {
      if (!input) return null;
      
      // Check if input is already a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(input)) {
        // Verify the UUID exists and get its name
        const { data } = await supabase
          .from("projects")
          .select("id, name")
          .eq("id", input)
          .eq("user_id", userId)
          .maybeSingle();
        return data;
      }
      
      // Search for project by name (case-insensitive)
      const { data } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", userId)
        .ilike("name", `%${input}%`)
        .limit(1)
        .maybeSingle();
        
      return data;
    }
    
    // Helper function to resolve customer name to UUID
    async function resolveCustomerId(input: string): Promise<{ id: string; name: string } | null> {
      if (!input) return null;
      
      // Check if input is already a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(input)) {
        const { data } = await supabase
          .from("customers")
          .select("id, name")
          .eq("id", input)
          .eq("user_id", userId)
          .maybeSingle();
        return data;
      }
      
      // Search for customer by name
      const { data } = await supabase
        .from("customers")
        .select("id, name")
        .eq("user_id", userId)
        .ilike("name", `%${input}%`)
        .limit(1)
        .maybeSingle();
        
      return data;
    }

    const conversationMessages = [
      {
        role: "system",
        content: `<role>
Du är Byggio AI - en effektiv assistent för byggföretag. Korta svar, snabba verktyg.
</role>

<brevity>
SVARSSTIL baserat på frågetyp:

KOMMANDON (skapa, registrera, checka in):
- MAX 1-2 meningar
- Visa formulär DIREKT
- Inga inledande fraser ("Jag ska hjälpa dig...", "Självklart!")

ÖPPNA FRÅGOR (hur går det, berätta om, vad har hänt, status):
- 3-5 meningar OK
- Ge kontext och insikt
- Nämn varningar om något saknas
</brevity>

<auto_resolve>
VIKTIGT: Backend konverterar automatiskt projektnamn till UUID!

När du kör get_project_economy, get_project, get_project_overview, etc. med ett NAMN:
→ Backend hittar rätt projekt automatiskt
→ Du behöver INTE köra search_projects först!

Exempel:
- "ekonomi för Tony Test" → get_project_economy(project_id: "Tony Test") ✅
- "visa projekt Solvik" → get_project(project_id: "Solvik") ✅
- "hur går det för projektet X" → get_project_overview(project_id: "X") ✅
</auto_resolve>

<conversational_mode>
ÖPPNA FRÅGOR - svara mer utförligt:

När användaren frågar:
- "hur går det för X?" → get_project_overview → ge sammanfattning
- "berätta om projektet" → get_project_overview → ge sammanfattning  
- "vad har hänt på X?" → get_project_overview → fokusera på aktivitet
- "status för projektet" → get_project_overview → ge sammanfattning

Sammanfattning ska innehålla:
1. Nuvarande status i en mening
2. Ekonomisk situation (fakturerat vs offert)
3. Aktivitet (dagrapporter, timmar)
4. Eventuella varningar (saknas startdatum, etc.)
5. ÄTA om det finns
</conversational_mode>

<intent_detection>
PROJEKTNAMN ÄR PARAMETER, INTE INSTRUKTION!

När användaren säger:
- "ekonomi för projekt X" → get_project_economy(project_id: "X")
- "hur går det för X?" → get_project_overview(project_id: "X")
- "arbetsorder på X" → get_projects_for_work_order
- "visa projekt X" → get_project(project_id: "X")
- "dagrapport för X" → get_projects_for_daily_report

ALDRIG visa projektet om användaren frågade om ekonomi/arbetsorder/etc!
</intent_detection>

<form_policy>
VISA FORMULÄR DIREKT för dessa:
- "skapa arbetsorder" → get_projects_for_work_order
- "registrera tid" → get_active_projects_for_time
- "skapa offert" (UTAN kund-ID) → get_customers_for_estimate
- "ny dagrapport" → get_projects_for_daily_report
- "checka in" / "personalliggare" → get_projects_for_check_in
- "ny kund" → get_customer_form
- "skapa projekt" → get_project_form
</form_policy>

<form_vs_create>
VIKTIGT! SKILLNAD MELLAN FÖRFRÅGAN OCH SKAPANDE:

VISA FORMULÄR (ingen data):
- "skapa offert" → get_customers_for_estimate

SKAPA DIREKT (data finns redan i meddelandet):
- "Skapa offert X för kund med ID Y" → create_estimate
- Om meddelandet innehåller kund-ID (UUID) → create_estimate

REGEL: Om kund-ID (UUID) finns i meddelandet → INTE formulär, SKAPA direkt!
</form_vs_create>

<context>
${context?.selectedProjectId ? `✅ VALT PROJEKT-ID: ${context.selectedProjectId} → Använd automatiskt!` : "❌ Inget projekt valt."}
${context?.selectedCustomerId ? `✅ VALD KUND-ID: ${context.selectedCustomerId} → Använd automatiskt!` : ""}
${context?.selectedEstimateId ? `✅ VALD OFFERT-ID: ${context.selectedEstimateId}` : ""}
</context>

<tools_quick_ref>
SÖKA: search_customers, search_projects, search_estimates, search_work_orders, search_ata
SKAPA: create_work_order, create_ata, create_plan, create_estimate, create_project, register_time, create_daily_report
VISA: get_project, get_customer, get_estimate, get_project_economy, get_project_overview, get_project_plan, list_project_files
FORMULÄR: get_projects_for_work_order, get_active_projects_for_time, get_customers_for_estimate, get_projects_for_daily_report, get_projects_for_check_in, get_customer_form, get_project_form
UPPDATERA: update_work_order, update_ata, update_customer, update_project
NÄRVARO: generate_attendance_qr, check_in, check_out
</tools_quick_ref>

<rules>
1. Svara på svenska
2. ANVÄND kontext-ID automatiskt
3. Vid namn → skicka direkt (backend resolver)
4. Visa formulär utan förklaring
5. Korta bekräftelser efter åtgärd
6. Öppna frågor → använd get_project_overview för konversation
</rules>`,
      },
    ];

    // Enrich history with context information so AI "sees" which entities were discussed
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === "user" || msg.role === "assistant") {
          let content = msg.content || "";
          
          // Append context info from message data if available
          if (msg.data?.project_name) {
            content += ` [Projekt: ${msg.data.project_name}]`;
          }
          if (msg.data?.customer_name) {
            content += ` [Kund: ${msg.data.customer_name}]`;
          }
          
          conversationMessages.push({
            role: msg.role,
            content,
          });
        }
      }
    }

    conversationMessages.push({ role: "user", content: message });

    const _aiStartTime = Date.now();
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
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

    // Log AI usage (enhanced) - after parsing so we have token data
    try {
      const _aiEndTime = Date.now();
      const svcClient = createClient(SUPABASE_URL!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const _reqBody = JSON.stringify({ model: "openai/gpt-5-mini", messages: conversationMessages, tools, tool_choice: "auto" });
      const _content = choice?.message?.content || "";
      await svcClient.from("ai_usage_logs").insert({ user_id: userId, function_name: "global-assistant", model: "openai/gpt-5-mini", tokens_in: aiData.usage?.prompt_tokens, tokens_out: aiData.usage?.completion_tokens, response_time_ms: _aiEndTime - _aiStartTime, input_size: _reqBody.length, output_size: _content.length });
    } catch (_) {}

    if (!choice) {
      throw new Error("No response from AI");
    }

    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const toolName = toolCall.function.name;
      const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

      // AUTO-INJECT project_id if missing but exists in context
      if (!toolArgs.project_id && context?.selectedProjectId && PROJECT_TOOLS.includes(toolName)) {
        toolArgs.project_id = context.selectedProjectId;
        console.log(`Auto-injected project_id: ${context.selectedProjectId} for tool: ${toolName}`);
      }
      
      // AUTO-INJECT customer_id if missing but exists in context
      if (!toolArgs.customer_id && context?.selectedCustomerId && CUSTOMER_TOOLS.includes(toolName)) {
        toolArgs.customer_id = context.selectedCustomerId;
        console.log(`Auto-injected customer_id: ${context.selectedCustomerId} for tool: ${toolName}`);
      }
      
      // RESOLVE project_id from name to UUID if it's not a valid UUID
      if (toolArgs.project_id && PROJECT_TOOLS.includes(toolName)) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(toolArgs.project_id)) {
          console.log(`Resolving project name "${toolArgs.project_id}" to UUID...`);
          const resolved = await resolveProjectId(toolArgs.project_id);
          if (resolved) {
            console.log(`Resolved to: ${resolved.id} (${resolved.name})`);
            toolArgs.project_id = resolved.id;
          } else {
            console.log(`Project not found: ${toolArgs.project_id}`);
            return new Response(JSON.stringify({
              type: "text",
              content: `Jag kunde inte hitta något projekt med namnet "${toolArgs.project_id}". Försök med ett annat namn eller välj ett projekt från listan.`,
              data: {
                nextActions: [
                  { label: "Visa projekt", icon: "folder", prompt: "Visa mina projekt" },
                  { label: "Sök projekt", icon: "search", prompt: "Sök efter projekt" },
                ],
              },
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
      
      // RESOLVE customer_id from name to UUID if it's not a valid UUID
      if (toolArgs.customer_id && CUSTOMER_TOOLS.includes(toolName)) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(toolArgs.customer_id)) {
          console.log(`Resolving customer name "${toolArgs.customer_id}" to UUID...`);
          const resolved = await resolveCustomerId(toolArgs.customer_id);
          if (resolved) {
            console.log(`Resolved to: ${resolved.id} (${resolved.name})`);
            toolArgs.customer_id = resolved.id;
          } else {
            console.log(`Customer not found: ${toolArgs.customer_id}`);
            return new Response(JSON.stringify({
              type: "text",
              content: `Jag kunde inte hitta någon kund med namnet "${toolArgs.customer_id}". Försök med ett annat namn eller välj en kund från listan.`,
              data: {
                nextActions: [
                  { label: "Visa kunder", icon: "users", prompt: "Visa mina kunder" },
                  { label: "Sök kund", icon: "search", prompt: "Sök efter kund" },
                ],
              },
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      console.log("Tool call:", toolName, toolArgs);

      const toolResult = await executeTool(supabase, userId, toolName, toolArgs, context);
      const formattedResult = formatToolResults(toolName, toolResult);
      
      return new Response(JSON.stringify(formattedResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
