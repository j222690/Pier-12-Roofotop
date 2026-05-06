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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // -------------------------------------------------------
    // PAYMENT CONFIRMED: confirm the pending reservation
    // -------------------------------------------------------
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const reservationId = session.metadata?.reservation_id

      if (!reservationId) {
        console.error('Webhook: missing reservation_id in metadata', session.id)
        return new Response(JSON.stringify({ received: true, warning: 'missing reservation_id' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: reservation, error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', reservationId)
        .eq('status', 'pending') // safety: only confirm if still pending
        .select('id, reservation_name, reservation_date, reservation_time, guest_count, total_price')
        .single()

      if (updateError) throw updateError

      console.log('Reservation confirmed:', reservation?.id, '|', reservation?.reservation_name)

      // Trigger push notification to admins
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
            reservation_name: reservation?.reservation_name,
            reservation_date: reservation?.reservation_date,
            reservation_time: reservation?.reservation_time,
            guest_count:      reservation?.guest_count,
            total_price:      reservation?.total_price,
          }),
        })
        const pushJson = await pushRes.json()
        console.log('Push result:', JSON.stringify(pushJson))
      } catch (pushErr) {
        console.error('Push error (non-fatal):', pushErr)
      }
    }

    // -------------------------------------------------------
    // SESSION EXPIRED: delete the pending reservation
    // Fires when the 30-minute Stripe session window closes
    // without payment — works alongside pg_cron as a safety net
    // -------------------------------------------------------
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session
      const reservationId = session.metadata?.reservation_id

      if (reservationId) {
        const { error: deleteError } = await supabase
          .from('reservations')
          .delete()
          .eq('id', reservationId)
          .eq('status', 'pending') // only delete if still pending (not confirmed)

        if (deleteError) {
          console.error('Failed to delete expired reservation:', deleteError.message)
        } else {
          console.log('Expired pending reservation deleted:', reservationId)
        }

        // Also trigger pg cleanup for any other stale pending reservations
        await supabase.rpc('cleanup_pending_reservations')
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
