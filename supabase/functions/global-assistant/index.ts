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
      description: "Search for projects by name or client",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          status: { type: "string", description: "Filter by status (active, completed, etc.)" },
        },
        required: ["query"],
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
      const query = args.query as string;
      const status = args.status as string | undefined;
      
      let q = supabase
        .from("projects")
        .select("id, name, client_name, address, city, status")
        .eq("user_id", userId)
        .or(`name.ilike.%${query}%,client_name.ilike.%${query}%`)
        .limit(5);
      
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

    case "create_estimate": {
      const { customer_id, title, address } = args as {
        customer_id: string;
        title: string;
        address?: string;
      };

      // Get customer info
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
      }>;
      
      return {
        type: "verification",
        content: `Jag hittade ${customers.length} matchande kund${customers.length > 1 ? "er" : ""}:`,
        data: {
          entityType: "customer",
          matches: customers.map((c) => ({
            id: c.id,
            title: c.name,
            subtitle: c.city || "Ingen stad angiven",
            metadata: {
              ...(c.phone && { phone: c.phone }),
              ...(c.email && { email: c.email }),
            },
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
        status?: string;
      }>;
      
      return {
        type: "verification",
        content: `Jag hittade ${projects.length} matchande projekt:`,
        data: {
          entityType: "project",
          matches: projects.map((p) => ({
            id: p.id,
            title: p.name,
            subtitle: p.client_name || "Ingen kund",
            metadata: {
              ...(p.address && { address: p.address }),
              ...(p.status && { status: p.status }),
            },
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
            href: `/estimates?id=${estimate.id}`,
          },
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
        content: `Du är en hjälpsam AI-assistent för ett byggföretag. Du hjälper användaren att hantera kunder, projekt och offerter.

VIKTIGA REGLER:
1. Svara alltid på svenska
2. Var kortfattad och koncis (max 2-3 meningar)
3. När användaren vill skapa något (offert, projekt), sök alltid först efter matchande kunder
4. Fråga aldrig om onödig information - använd det du har
5. Om användaren bekräftar en kund/projekt, fortsätt med nästa steg

KONTEXT:
${context?.selectedCustomerId ? `- Vald kund-ID: ${context.selectedCustomerId}` : ""}
${context?.selectedProjectId ? `- Valt projekt-ID: ${context.selectedProjectId}` : ""}
${context?.pendingAction ? `- Väntande åtgärd: ${context.pendingAction}` : ""}

Använd verktygen för att söka och skapa data. Bekräfta alltid innan du skapar något.`,
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
