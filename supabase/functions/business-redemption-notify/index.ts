import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { business_id, business_name, rider_nickname, offer_desc, redeemed_at } = await req.json()

    const sbAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: bizUser } = await sbAdmin
      .from('business_users')
      .select('email')
      .eq('business_id', business_id)
      .single()

    if (!bizUser?.email) throw new Error('Email del negocio no encontrado')

    const fecha = new Date(redeemed_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })

    const emailBody = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <img src="https://motoclubes.es/email-logo-helmet.png" width="40" style="border-radius:8px;margin-bottom:16px">
        <h2 style="color:#111;margin-bottom:8px">¡Nuevo canje registrado! 🪖</h2>
        <p style="color:#555;margin-bottom:24px">Se ha canjeado un cupón en <strong>${business_name}</strong>.</p>
        <div style="background:#F5EFE8;border-radius:12px;padding:18px;margin-bottom:24px">
          <div style="margin-bottom:10px"><span style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Motero</span><br><span style="font-size:16px;font-weight:700;color:#111">🏍️ ${rider_nickname}</span></div>
          <div style="margin-bottom:10px"><span style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Oferta aplicada</span><br><span style="font-size:16px;font-weight:700;color:#FF7A1A">${offer_desc}</span></div>
          <div><span style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase">Fecha y hora</span><br><span style="font-size:14px;color:#555">${fecha}</span></div>
        </div>
        <p style="color:#888;font-size:12px">Este canje queda registrado en tu panel de MOTOCLUBes.</p>
        <a href="https://www.motoclubes.es/negocio/index.html" style="display:inline-block;margin-top:12px;background:#FF7A1A;color:#fff;padding:10px 22px;border-radius:50px;text-decoration:none;font-weight:700;font-size:13px">Ver mi panel</a>
      </div>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MOTOCLUBes <notify@notify.motoclubes.es>',
        to: bizUser.email,
        subject: `Nuevo canje — ${rider_nickname} ha usado su cupón`,
        html: emailBody
      })
    })

    if (!resendRes.ok) throw new Error('Error enviando email')

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
