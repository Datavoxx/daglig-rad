import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AcceptRequest {
  token: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, password }: AcceptRequest = await req.json();

    if (!token || !password) {
      return new Response(
        JSON.stringify({ error: "Token och lösenord krävs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Lösenordet måste vara minst 6 tecken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the invitation by token
    const { data: invitation, error: invitationError } = await supabase
      .from("employee_invitations")
      .select("*, employees(id, name)")
      .eq("token", token)
      .single();

    if (invitationError || !invitation) {
      console.log("Invitation not found:", invitationError);
      return new Response(
        JSON.stringify({ error: "Ogiltig inbjudningslänk" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return new Response(
        JSON.stringify({ error: "Denna inbjudan har redan accepterats" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return new Response(
        JSON.stringify({ error: "Inbjudningslänken har gått ut" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user account using admin API
    const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true, // Auto-confirm since they clicked the invite link
      user_metadata: {
        full_name: invitation.employees?.name || "",
        is_employee: true,
        employer_id: invitation.invited_by,
      },
    });

    if (createUserError) {
      console.error("Error creating user:", createUserError);
      
      // Check if user already exists
      if (createUserError.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "Denna e-postadress har redan ett konto" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Kunde inte skapa konto", details: createUserError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Kunde inte skapa konto" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the employee record with the linked user ID
    const { error: updateEmployeeError } = await supabase
      .from("employees")
      .update({
        linked_user_id: userId,
        invitation_status: "accepted",
      })
      .eq("id", invitation.employee_id);

    if (updateEmployeeError) {
      console.error("Error updating employee:", updateEmployeeError);
    }

    // Mark the invitation as accepted
    const { error: updateInviteError } = await supabase
      .from("employee_invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    if (updateInviteError) {
      console.error("Error updating invitation:", updateInviteError);
    }

    // Copy employer's company_settings to the new employee
    const { data: employerSettings } = await supabase
      .from("company_settings")
      .select("*")
      .eq("user_id", invitation.invited_by)
      .single();

    if (employerSettings) {
      const { id, user_id, created_at, ...settingsToCopy } = employerSettings;
      const { error: copySettingsError } = await supabase
        .from("company_settings")
        .insert({
          ...settingsToCopy,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (copySettingsError) {
        console.error("Error copying company settings:", copySettingsError);
      } else {
        console.log(`Company settings copied from employer ${invitation.invited_by} to employee ${userId}`);
      }
    }

    // Set restricted modules for the employee (override the default full access)
    const { error: updatePermissionsError } = await supabase
      .from("user_permissions")
      .update({ modules: ["dashboard", "projects", "time-reporting"] })
      .eq("user_id", userId);

    if (updatePermissionsError) {
      console.error("Error updating permissions:", updatePermissionsError);
    } else {
      console.log(`Permissions restricted to dashboard, projects, time-reporting for ${userId}`);
    }

    console.log(`User account created for ${invitation.email}, linked to employee ${invitation.employee_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Konto skapat! Du kan nu logga in.",
        email: invitation.email,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in accept-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
