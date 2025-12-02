import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import emailjs from "npm:@emailjs/browser@4.4.1";

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
    if (type === 'new_interest') {
      emailContent = `You have received a new interest request from a client on Nanny Placements SA!

Client Message: "${message}"

A client is interested in your nanny services and would like to get in touch. Please log in to your nanny dashboard to review this request and approve or decline it.

🔗 Login to your dashboard: ${Deno.env.get("SITE_URL") || "https://nannyplacement.co.za"}/dashboard

Best regards,
Nanny Placements SA Team`;
    } else if (type === 'interview_setup' && interestId) {
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

    // Send email using EmailJS
    try {
      const serviceID = "service_syqn4ol";
      const templateID = "template_exkrbne";
      const publicKey = "rK97vwvxnXTTY8PjW";

      const templateParams = {
        name: "Nanny Placements SA",
        email: "admin@nannyplacementssouthafrica.co.za",
        subject,
        message: emailContent + safetyMessage,
        to_email: to,
      };

      await emailjs.send(serviceID, templateID, templateParams, publicKey);

      return new Response(
        JSON.stringify({ success: true, emailSent: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (emailError) {
      console.error("EmailJS error:", emailError);
      // Fallback to success response as notification should not block the main process
      return new Response(
        JSON.stringify({ success: true, emailSent: false, error: "Email service temporarily unavailable" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
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