import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  type: 'welcome' | 'interest' | 'payment_success' | 'interview_setup';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message, type }: EmailRequest = await req.json();

    // For now, log the email - in production this would send via SMTP
    console.log(`Email notification - Type: ${type}`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);

    // Safety reminder for certain email types
    let safetyMessage = "";
    if (type === 'interview_setup' || type === 'payment_success') {
      safetyMessage = `
      
🛡️ SAFETY REMINDERS:
• Meet in a public place for interviews
• Bring someone with you
• Verify minimum wage requirements
• Trust your instincts
• Report any concerning behavior
      `;
    }

    // Simulate sending email (replace with actual SMTP implementation)
    const emailContent = {
      to,
      subject,
      html: `
        <h2>${subject}</h2>
        <p>${message}</p>
        ${safetyMessage ? `<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px;">${safetyMessage}</div>` : ''}
        <p>Best regards,<br>Nanny Placements South Africa Team</p>
      `
    };

    return new Response(
      JSON.stringify({ success: true, emailSent: emailContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});