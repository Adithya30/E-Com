import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import crypto from 'node:crypto'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const signature = req.headers.get('x-razorpay-signature')
        const body = await req.text()

        // 1. Verify Webhook Signature
        const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
        if (!secret) throw new Error("Webhook secret not set")

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex')

        if (signature !== expectedSignature) {
            return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
        }

        const event = JSON.parse(body)

        // 2. Handle 'order.paid' event (or payment.captured)
        if (event.event === 'order.paid') {
            const payload = event.payload.order.entity
            const notes = payload.notes

            // 3. Initialize Admin Client (Service Role)
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // 4. Create Order in DB (Strictly Backend)
            // We parse the items back from the notes we saved earlier
            const items = JSON.parse(notes.items)

            const { error } = await supabase.from('orders').insert([{
                user_id: notes.user_id, // Add user_id to link order to user
                customer_name: notes.customer_name,
                customer_phone: notes.customer_phone,
                address: notes.address,
                total_amount: payload.amount / 100, // Convert back to Rupees
                items: items,
                status: 'Pending',
                payment_id: event.payload.payment.entity.id, // Save payment ref
                order_id: payload.id
            }])

            if (error) throw error
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
