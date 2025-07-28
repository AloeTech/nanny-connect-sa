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
  type: string;
  interestId?: string;
  amount?: number;
  nannyName?: string;
  clientName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message, type, interestId, amount, nannyName, clientName }: EmailRequest = await req.json();

    console.log(`Email notification - Type: ${type}`, { interestId, nannyName, clientName });

    let emailContent = message;
    
    // Handle different email types
    if (type === 'interview_setup' && interestId) {
      emailContent = `Great news! Payment has been confirmed for the nanny placement service.

Nanny: ${nannyName}
Client: ${clientName}
Amount Paid: R${amount}

Next Steps:
1. Both parties should now arrange a suitable interview time
2. Exchange contact details to coordinate the meeting
3. Discuss expectations, schedule, and terms

Contact Information Exchange:
- The payment confirms both parties' commitment
- Please reach out to each other directly to arrange your interview
- Remember to meet in a safe, public location for your first meeting

🛡️ SAFETY REMINDERS:
• Always meet in public places
• Verify all documents independently
• Trust your instincts
• Bring someone with you to interviews
• Check references thoroughly

For any issues, please contact Nanny Placements SA support.

Best regards,
Nanny Placements SA Team`;
    } else if (type === 'welcome_nanny') {
      emailContent = `Welcome to Nanny Placements SA!

Thank you for registering as a nanny on our platform. 

Next Steps:
1. Complete your profile with all required information
2. Upload your documents (Criminal record check, Credit check)
3. Complete our Nanny Academy training program
4. Wait for admin approval

Terms and Privacy:
Please review our Terms of Service and Privacy Policy at your dashboard.

We're committed to your safety and success. Our training academy will prepare you with essential skills for professional childcare.

Best regards,
Nanny Placements SA Team`;
    } else if (type === 'welcome_client') {
      emailContent = `Welcome to Nanny Placements SA!

Thank you for registering as a client. We're here to help you find the perfect nanny for your family.

Next Steps:
1. Complete your profile with your family's needs
2. Browse our verified nannies
3. Express interest in suitable candidates
4. Arrange interviews after payment

Terms and Privacy:
Please review our Terms of Service and Privacy Policy at your dashboard.

Our nannies are verified, trained, and background-checked for your peace of mind.

Best regards,
Nanny Placements SA Team`;
    }

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
    const finalEmailContent = {
      to,
      subject,
      html: `
        <h2>${subject}</h2>
        <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${emailContent}</pre>
        ${safetyMessage ? `<div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px;">${safetyMessage}</div>` : ''}
        <p>Best regards,<br>Nanny Placements South Africa Team</p>
      `
    };

    return new Response(
      JSON.stringify({ success: true, emailSent: finalEmailContent }),
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