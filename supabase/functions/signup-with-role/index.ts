// Edge Function: signup-with-role
import { createClient } from 'npm:@supabase/supabase-js@2.31.0';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      city,
      suburb,
      user_type,
      redirect_to,
      // ───── New bank fields (only for nannies) ─────
      bank_name,
      account_number,
      account_holder_name,
    } = body;

    // Required fields validation
    if (!email || !password || !first_name || !user_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, first_name, user_type' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Extra validation for nannies
    if (user_type === 'nanny') {
      if (!bank_name?.trim() || !account_number?.trim() || !account_holder_name?.trim()) {
        return new Response(
          JSON.stringify({ error: 'Nannies must provide bank_name, account_number, and account_holder_name' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1) Public signup → triggers confirmation email
    const signupResp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ email, password, options: { redirect_to } }),
    });

    const signupText = await signupResp.text();
    if (!signupResp.ok) {
      return new Response(
        JSON.stringify({ error: 'Signup failed', details: signupText }),
        { status: signupResp.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    let signupJson = null;
    try {
      signupJson = JSON.parse(signupText);
    } catch (e) {}

    let userId = signupJson?.user?.id || signupJson?.id || null;

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

    let finalUserId = userId;

    // Fallback: try to find user by email if ID not returned
    if (!finalUserId) {
      try {
        if (typeof supabaseAdmin.auth.admin.getUserByEmail === 'function') {
          const { data, error } = await supabaseAdmin.auth.admin.getUserByEmail(email);
          if (!error && data?.user?.id) {
            finalUserId = data.user.id;
          }
        }
      } catch (e) {
        console.warn('getUserByEmail failed or not available', e);
      }
    }

    if (!finalUserId) {
      // Last fallback: listUsers
      const listResp = await supabaseAdmin.auth.admin.listUsers();
      let listData = listResp?.data || listResp;
      let listError = listResp?.error || null;

      if (listError) console.error('listUsers error:', listError);

      const found = listData?.users?.find((u: any) => u.email === email);
      if (found?.id) {
        finalUserId = found.id;
      }
    }

    if (!finalUserId) {
      return new Response(
        JSON.stringify({ error: 'Could not determine user ID after signup' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // ───────────────────────────────────────────────
    // INSERT PROFILE (common for both roles)
    // ───────────────────────────────────────────────
    const profileInsert = await supabaseAdmin
      .from('profiles')
      .insert({
        id: finalUserId,
        email,
        first_name,
        last_name,
        phone,
        city,
        suburb,
        user_type,
      })
      .select();

    if (profileInsert.error) {
      console.error('profiles.insert error:', profileInsert.error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert profile', details: profileInsert.error.message }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // ───────────────────────────────────────────────
    // INSERT ROLE
    // ───────────────────────────────────────────────
    const roleInsert = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: finalUserId, role: user_type })
      .select();

    if (roleInsert.error) {
      console.error('user_roles.insert error:', roleInsert.error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert role', details: roleInsert.error.message }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // ───────────────────────────────────────────────
    // ROLE-SPECIFIC INSERTS
    // ───────────────────────────────────────────────
    if (user_type === 'client') {
      const clientInsert = await supabaseAdmin
        .from('clients')
        .insert({ user_id: finalUserId, first_name, last_name, phone, city, suburb })
        .select();

      if (clientInsert.error) {
        console.error('clients.insert error:', clientInsert.error);
        return new Response(
          JSON.stringify({ error: 'Failed to insert client', details: clientInsert.error.message }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    } 
    else if (user_type === 'nanny') {
      const nannyInsert = await supabaseAdmin
        .from('nannies')
        .insert({
          user_id: finalUserId,
          first_name,
          last_name,
          phone,
          city,
          suburb,
          languages: [],
          experience_type: 'entry_level',
          criminal_check_status: 'pending',
          credit_check_status: 'pending',
          profile_approved: false,
          // ───── NEW BANK FIELDS ─────
          bank_name: bank_name?.trim(),
          account_number: account_number?.trim(),
          account_holder_name: account_holder_name?.trim(),
        })
        .select();

      if (nannyInsert.error) {
        console.error('nannies.insert error:', nannyInsert.error);
        return new Response(
          JSON.stringify({ error: 'Failed to insert nanny profile', details: nannyInsert.error.message }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ───────────────────────────────────────────────
    // SUCCESS RESPONSE
    // ───────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success: true,
        user: { id: finalUserId, email },
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});