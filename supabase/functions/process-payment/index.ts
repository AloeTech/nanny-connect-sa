import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  interestId: string;
  amount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { interestId, amount }: PaymentRequest = await req.json();

    // Get interest details
    const { data: interest, error: interestError } = await supabaseClient
      .from('interests')
      .select(`
        *,
        client:clients!inner(user_id),
        nanny:nannies!inner(user_id)
      `)
      .eq('id', interestId)
      .single();

    if (interestError || !interest) {
      throw new Error("Interest not found");
    }

    // Verify user is the client
    if (interest.client.user_id !== user.id) {
      throw new Error("Unauthorized");
    }

    // Simulate payment processing (replace with actual payment gateway)
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo

    if (paymentSuccess) {
      // Create payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from('payments')
        .insert({
          client_id: interest.client_id,
          nanny_id: interest.nanny_id,
          interest_id: interestId,
          amount,
          status: 'completed',
          payment_method: 'mock_payment',
          transaction_id: `mock_${Date.now()}`
        })
        .select()
        .single();

      if (paymentError) {
        throw new Error("Failed to record payment");
      }

      // Update interest status
      await supabaseClient
        .from('interests')
        .update({ status: 'paid' })
        .eq('id', interestId);

      return new Response(
        JSON.stringify({ 
          success: true, 
          payment,
          message: "Payment processed successfully"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Payment failed
      const { data: payment } = await supabaseClient
        .from('payments')
        .insert({
          client_id: interest.client_id,
          nanny_id: interest.nanny_id,
          interest_id: interestId,
          amount,
          status: 'failed',
          payment_method: 'mock_payment',
          transaction_id: `failed_${Date.now()}`
        })
        .select()
        .single();

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Payment processing failed. Please try again."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});