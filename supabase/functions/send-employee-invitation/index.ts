import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InvitationRequest {
  employeeId: string;
  employeeEmail: string;
  employeeName: string;
  organizationName: string;
  baseUrl: string;
}

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

const generateEmailHtml = (
  organizationName: string,
  employeeName: string,
  inviteUrl: string
): string => {
  const logoUrl = "https://ddxcbbycvybdpbtufdqr.supabase.co/storage/v1/object/public/email-assets/byggio-logo.png?v=1";
  
  return `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inbjudan till Byggio</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 500px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${logoUrl}" alt="Byggio" style="height: 48px; width: auto;" />
            </td>
          </tr>
          
          <!-- Content Section -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #18181b; text-align: center;">
                Hej${employeeName ? ` ${employeeName}` : ''}!
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 24px; color: #52525b; text-align: center;">
                Du har bjudits in till <strong style="color: #18181b;">${organizationName}</strong> på Byggio – verktyget för smarta byggföretag.
              </p>
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 24px; color: #52525b; text-align: center;">
                Klicka på knappen nedan för att aktivera ditt konto och skapa ett lösenord.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background-color: #22c55e; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; transition: background-color 0.2s;">
                      Aktivera mitt konto
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 20px; color: #a1a1aa; text-align: center;">
                Länken är giltig i 7 dagar.
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0;" />
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 40px 40px;">
              <p style="margin: 0; font-size: 14px; line-height: 20px; color: #71717a; text-align: center;">
                Med vänliga hälsningar,<br />
                <strong>Byggio-teamet</strong>
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Outside footer -->
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #a1a1aa; text-align: center;">
          © ${new Date().getFullYear()} Byggio. Alla rättigheter förbehållna.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate the user's token
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub as string;

    const { employeeId, employeeEmail, employeeName, organizationName, baseUrl }: InvitationRequest = await req.json();

    if (!employeeId || !employeeEmail || !organizationName || !baseUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a unique token
    const inviteToken = generateToken();
    const inviteUrl = `${baseUrl}/accept-invitation?token=${inviteToken}`;

    // Store the invitation in the database
    const { error: insertError } = await supabase
      .from("employee_invitations")
      .insert({
        employee_id: employeeId,
        invited_by: userId,
        token: inviteToken,
        email: employeeEmail,
        organization_name: organizationName,
      });

    if (insertError) {
      console.error("Error inserting invitation:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create invitation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update employee status to pending
    const { error: updateError } = await supabase
      .from("employees")
      .update({ invitation_status: "pending" })
      .eq("id", employeeId);

    if (updateError) {
      console.error("Error updating employee status:", updateError);
    }

    // Send the email
    const emailHtml = generateEmailHtml(organizationName, employeeName, inviteUrl);

    const { error: emailError } = await resend.emails.send({
      from: "Byggio <noreply@resend.dev>", // Change to your verified domain
      to: [employeeEmail],
      subject: `Du har bjudits in till ${organizationName} på Byggio`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send invitation email", details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Invitation sent successfully to ${employeeEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-employee-invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
