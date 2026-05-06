import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-04-30.basil' })
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    const body = await req.text()
    let event: Stripe.Event

    if (webhookSecret) {
      const sig = req.headers.get('stripe-signature')!
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } else {
      event = JSON.parse(body)
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = session.metadata!

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Decompress guests from compact format: "idX,idX"
      // X encoding: A=female/adult, B=female/child, C=male/adult, D=male/child, E=female/birthday, F=male/birthday
      function decompressGuests(compressed: string): Array<{ id: string; gender: string; ageCategory: string; isBirthday?: boolean }> {
        if (!compressed) return []
        const decodeMap: Record<string, { gender: string; ageCategory: string; isBirthday?: boolean }> = {
          A: { gender: 'female', ageCategory: 'adult' },
          B: { gender: 'female', ageCategory: 'child' },
          C: { gender: 'male',   ageCategory: 'adult' },
          D: { gender: 'male',   ageCategory: 'child' },
          E: { gender: 'female', ageCategory: 'adult', isBirthday: true },
          F: { gender: 'male',   ageCategory: 'adult', isBirthday: true },
        }
        return compressed.split(',').map(entry => {
          const code = entry.slice(-1)
          const id = entry.slice(0, -1)
          return { id, ...(decodeMap[code] || { gender: 'female', ageCategory: 'adult' }) }
        })
      }

      let guests
      try { guests = decompressGuests(meta.guests || '') } catch { guests = [] }

      // Cria a reserva e pega o ID gerado
      const { data: reservation, error: insertError } = await supabase
        .from('reservations')
        .insert({
          reservation_name: meta.reservation_name,
          reservation_date: meta.reservation_date,
          reservation_time: meta.reservation_time,
          guest_count: Number(meta.guest_count),
          total_price: Number(meta.total_price),
          phone: meta.phone || null,
          notes: meta.notes || null,
          open_wine_opt_in: meta.open_wine_opt_in === 'true',
          guests,
          status: 'confirmed',
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      console.log('Reservation created for:', meta.reservation_name, '| id:', reservation?.id)

      // Dispara o push para todos os admins
      try {
        const pushUrl = `${supabaseUrl}/functions/v1/send-push-notification`
        const pushRes = await fetch(pushUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            reservationId:    reservation?.id ?? '',
            reservation_name: meta.reservation_name,
            reservation_date: meta.reservation_date,
            reservation_time: meta.reservation_time,
            guest_count:      Number(meta.guest_count),
            total_price:      Number(meta.total_price),
          }),
        })
        const pushJson = await pushRes.json()
        console.log('Push result:', JSON.stringify(pushJson))
      } catch (pushErr) {
        console.error('Push error (non-fatal):', pushErr)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
