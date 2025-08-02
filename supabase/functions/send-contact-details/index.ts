import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ContactDetailsEmail } from "./_templates/contact-details.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ContactDetailsRequest {
  interestId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { interestId }: ContactDetailsRequest = await req.json();

    // Get interest with all related data
    const { data: interest, error: interestError } = await supabase
      .from('interests')
      .select(`
        *,
        clients!inner(
          user_id,
          profiles!inner(first_name, last_name, email, phone, city)
        ),
        nannies!inner(
          user_id,
          hourly_rate,
          bio,
          profiles!inner(first_name, last_name, email, phone, city)
        )
      `)
      .eq('id', interestId)
      .eq('admin_approved', true)
      .eq('payment_status', 'completed')
      .single();

    if (interestError || !interest) {
      throw new Error('Interest not found or not approved/paid');
    }

    const clientProfile = interest.clients.profiles;
    const nannyProfile = interest.nannies.profiles;

    // Render email for client
    const clientEmailHtml = await renderAsync(
      React.createElement(ContactDetailsEmail, {
        recipientName: clientProfile.first_name,
        recipientType: 'client',
        contactName: `${nannyProfile.first_name} ${nannyProfile.last_name}`,
        contactEmail: nannyProfile.email,
        contactPhone: nannyProfile.phone || 'Not provided',
        contactCity: nannyProfile.city || 'Not provided',
        hourlyRate: interest.nannies.hourly_rate,
        bio: interest.nannies.bio || 'No bio provided'
      })
    );

    // Render email for nanny
    const nannyEmailHtml = await renderAsync(
      React.createElement(ContactDetailsEmail, {
        recipientName: nannyProfile.first_name,
        recipientType: 'nanny',
        contactName: `${clientProfile.first_name} ${clientProfile.last_name}`,
        contactEmail: clientProfile.email,
        contactPhone: clientProfile.phone || 'Not provided',
        contactCity: clientProfile.city || 'Not provided'
      })
    );

    // Send emails to both parties
    const [clientEmail, nannyEmail] = await Promise.all([
      resend.emails.send({
        from: 'Nanny Placements SA <noreply@nannyplacements.co.za>',
        to: [clientProfile.email],
        subject: 'Contact Details - Interview Setup Approved',
        html: clientEmailHtml,
      }),
      resend.emails.send({
        from: 'Nanny Placements SA <noreply@nannyplacements.co.za>',
        to: [nannyProfile.email],
        subject: 'Contact Details - Interview Setup Approved',
        html: nannyEmailHtml,
      })
    ]);

    console.log('Contact details emails sent:', { clientEmail, nannyEmail });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contact details sent to both parties' 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending contact details:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});