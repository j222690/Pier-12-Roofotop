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
    const {
      reservation_name,
      reservation_date,
      reservation_time,
      guests,
      guest_count,
      total_price,
      phone,
      notes,
      open_wine_opt_in,
      success_url,
      cancel_url,
    } = await req.json()

    if (!reservation_name || !reservation_date || !reservation_time) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check capacity (only confirmed reservations count)
    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('guest_count')
      .eq('reservation_date', reservation_date)
      .eq('status', 'confirmed')

    const currentGuests = (existingReservations || []).reduce(
      (s: number, r: { guest_count: number }) => s + r.guest_count, 0
    )

    if (currentGuests + guest_count > 70) {
      return new Response(JSON.stringify({
        error: 'capacity_full',
        message: 'Infelizmente, todas as mesas reservadas para este dia já foram preenchidas. Mas não desanime! Você ainda pode tentar uma mesa presencialmente — funcionamos também sem reserva, por ordem de chegada.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Free reservation — skip Stripe, save directly as confirmed
    if (!total_price || total_price <= 0) {
      const { error: dbError } = await supabase.from('reservations').insert({
        reservation_name,
        reservation_date,
        reservation_time,
        guests: guests ?? [],
        guest_count,
        total_price: 0,
        phone: phone || null,
        notes: notes || null,
        open_wine_opt_in: open_wine_opt_in ?? false,
        status: 'confirmed',
      })

      if (dbError) {
        return new Response(JSON.stringify({ error: dbError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ free: true, url: success_url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- SCALABLE FLOW ---
    // 1. Save full reservation as 'pending' in DB (no metadata size limit)
    const { data: pendingReservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        reservation_name,
        reservation_date,
        reservation_time,
        guests: guests ?? [],
        guest_count,
        total_price,
        phone: phone || null,
        notes: notes || null,
        open_wine_opt_in: open_wine_opt_in ?? false,
        status: 'pending',
      })
      .select('id')
      .single()

    if (insertError || !pendingReservation) {
      throw new Error(insertError?.message || 'Failed to create pending reservation')
    }

    const reservationId = pendingReservation.id

    // 2. Create Stripe session with only the reservation_id in metadata
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-04-30.basil' })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Reserva Pier 12 — ${reservation_name}`,
              description: `${reservation_date} às ${reservation_time} • ${guest_count} pessoa(s)`,
            },
            unit_amount: Math.round(total_price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Expire session after 30 minutes to match our cleanup window
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: success_url || 'https://pier12-elevate-reserve.lovable.app/reservar?status=success',
      cancel_url: cancel_url || 'https://pier12-elevate-reserve.lovable.app/reservar?status=cancelled',
      metadata: {
        // Only the reservation_id — works for any group size, forever
        reservation_id: reservationId,
      },
    })

    // 3. Store stripe_session_id on the pending reservation for traceability
    await supabase
      .from('reservations')
      .update({ stripe_session_id: session.id })
      .eq('id', reservationId)

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Checkout error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
