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

      let guests
      try { guests = JSON.parse(meta.guests || '[]') } catch { guests = [] }

      await supabase.from('reservations').insert({
        reservation_name: meta.reservation_name,
        reservation_date: meta.reservation_date,
        reservation_time: meta.reservation_time,
        guest_count: Number(meta.guest_count),
        total_price: Number(meta.total_price),
        phone: meta.phone || null,
        open_wine_opt_in: meta.open_wine_opt_in === 'true',
        guests,
        status: 'confirmed',
      })

      console.log('Reservation created for:', meta.reservation_name)
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
