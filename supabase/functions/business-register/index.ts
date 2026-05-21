import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, password, business_name } = await req.json()

    if (!email || !password || !business_name) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 8 caracteres' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: existing } = await supabase
      .from('business_users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return new Response(JSON.stringify({ error: 'Este email ya tiene un negocio registrado. Ve a iniciar sesión.' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password))
    const password_hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    const { data: biz, error: bizError } = await supabase
      .from('rider_friendly_businesses')
      .insert({ name: business_name, is_active: false })
      .select('id')
      .single()

    if (bizError) {
      return new Response(JSON.stringify({ error: 'Error al crear el negocio: ' + bizError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { error: userError } = await supabase
      .from('business_users')
      .insert({ id: crypto.randomUUID(), email, password_hash, business_id: biz.id })

    if (userError) {
      return new Response(JSON.stringify({ error: 'Error al crear usuario: ' + userError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MOTOCLUBes <notify@notify.motoclubes.es>',
        to: email,
        subject: '¡Bienvenido a Rider Friendly! 🏍️',
        html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto"><div style="background:#FF7A1A;padding:24px;border-radius:12px 12px 0 0;text-align:center"><img src="https://motoclubes.es/email-logo-helmet.png" width="48" style="border-radius:10px"><div style="color:#fff;font-size:20px;font-weight:800;margin-top:8px">MOTOCLUBes</div></div><div style="background:#fff;padding:32px;border-radius:0 0 12px 12px"><h2 style="color:#111;margin-bottom:12px">¡Bienvenido a Rider Friendly!</h2><p style="color:#555;line-height:1.6">Tu negocio <strong>${business_name}</strong> ha sido registrado correctamente.</p><p style="color:#555;line-height:1.6;margin-top:12px">Ya puedes acceder a tu panel para completar tu perfil y empezar a recibir moteros.</p><a href="https://www.motoclubes.es/negocio/login.html" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#FF7A1A;color:#fff;border-radius:50px;text-decoration:none;font-weight:700">Acceder al panel</a></div></div>`
      })
    })

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
