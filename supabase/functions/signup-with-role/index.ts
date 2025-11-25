import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    console.log('Received:', body)

    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      city,
      suburb,
      user_type,
      send_confirmation = true,
      redirect_to
    } = body

    if (!email || !password || !first_name || !user_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    // Create user server-side but DO NOT mark email confirmed.
    const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // ensure user is NOT auto-confirmed
      user_metadata: { first_name, last_name, phone, city, suburb, user_type }
    })

    if (signUpError || !user) {
      return new Response(
        JSON.stringify({ error: signUpError?.message || 'Failed to create user' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    // Create profile & role as before
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        first_name,
        last_name,
        phone,
        city,
        suburb,
        user_type
      })

    if (profileError) throw profileError

    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: user_type })

    if (roleError) throw roleError

    if (user_type === 'client') {
      await supabase.from('clients').insert({
        user_id: userId,
        first_name, last_name, phone, city, suburb
      })
    } else if (user_type === 'nanny') {
      await supabase.from('nannies').insert({
        user_id: userId,
        first_name, last_name, phone, city, suburb,
        languages: [], experience_type: 'entry_level',
        criminal_check_status: 'pending', credit_check_status: 'pending',
        profile_approved: false
      })
    }

    // If requested, trigger the confirmation email via Admin endpoint
    if (send_confirmation) {
      // Compose invite/OTP endpoint. Supabase supports sending invite via:
      // POST /auth/v1/admin/invite or use the "send OTP" for magic links depending on auth config.
      // We'll call the "invite" admin endpoint which exists on newer projects.
      try {
        const inviteResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            email,
            // setting password is optional here; if provided, user can sign in with password after confirm
            // redirect_to is optional - used to set the redirect url after confirmation
            redirect_to: redirect_to || undefined,
          }),
        })

        if (!inviteResp.ok) {
          const txt = await inviteResp.text()
          console.warn('Invite endpoint returned non-OK:', inviteResp.status, txt)
          // Not fatal: continue but warn the caller
        } else {
          console.log('Invite email triggered for', email)
        }
      } catch (err) {
        console.error('Invite request failed:', err)
      }
    }

    return new Response(
      JSON.stringify({ success: true, user: { id: userId, email } }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})