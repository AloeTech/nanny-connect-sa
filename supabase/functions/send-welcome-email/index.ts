import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  userType: 'nanny' | 'client';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, userType }: WelcomeEmailRequest = await req.json();

    // Import emailjs functionality (would need to be configured with proper API keys)
    const safetyRules = `
      <h2>Safety Guidelines & Disclaimers</h2>
      
      <h3>For All Users:</h3>
      <ul>
        <li>Always meet in public places for initial meetings</li>
        <li>Conduct thorough background checks</li>
        <li>Verify all certifications and references</li>
        <li>Trust your instincts - if something feels wrong, don't proceed</li>
        <li>Keep all communications through our platform initially</li>
      </ul>

      <h3>For Nannies:</h3>
      <ul>
        <li>Always verify the identity of potential employers</li>
        <li>Request to meet all family members before starting work</li>
        <li>Clarify expectations, duties, and emergency procedures</li>
        <li>Ensure you have emergency contact information</li>
        <li>Report any concerning behavior through our platform</li>
      </ul>

      <h3>For Clients:</h3>
      <ul>
        <li>Thoroughly check all references and certifications</li>
        <li>Consider a trial period before committing long-term</li>
        <li>Provide clear instructions and emergency contacts</li>
        <li>Respect professional boundaries</li>
        <li>Report any issues through our platform</li>
      </ul>

      <h3>Important Disclaimers:</h3>
      <p><strong>Nanny Placement acts as a platform to connect families and nannies. We do not employ nannies directly and are not responsible for:</strong></p>
      <ul>
        <li>The actions or behavior of users</li>
        <li>Verification of credentials beyond basic checks</li>
        <li>Any incidents that occur during employment</li>
        <li>Payment disputes between parties</li>
      </ul>

      <p><strong>Users are responsible for:</strong></p>
      <ul>
        <li>Conducting their own due diligence</li>
        <li>Verifying all information provided</li>
        <li>Following local employment laws</li>
        <li>Maintaining appropriate insurance coverage</li>
      </ul>
    `;

    const emailContent = userType === 'nanny' ? 
      `<h1>Welcome to Nanny Placement, ${name}!</h1>
       <p>Thank you for joining our platform as a nanny. Please complete your profile and academy training to start receiving client interests.</p>
       ${safetyRules}` :
      `<h1>Welcome to Nanny Placement, ${name}!</h1>
       <p>Thank you for joining our platform. You can now browse our verified nannies to find the perfect match for your family.</p>
       ${safetyRules}`;

    // This would integrate with your email service
    console.log(`Sending welcome email to ${email} (${userType})`);
    console.log('Email content:', emailContent);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);