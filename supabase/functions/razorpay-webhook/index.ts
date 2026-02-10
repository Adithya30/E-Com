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

        // 2. Handle 'order.paid' event
        // This event confirms that the order is fully paid.
        if (event.event === 'order.paid') {
            const orderPayload = event.payload.order.entity
            const paymentPayload = event.payload.payment ? event.payload.payment.entity : null

            // 3. Initialize Admin Client (Service Role)
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            // 4. UPDATE existing Order in DB
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'Pending', // Mark as Paid/Confirmed
                    payment_id: paymentPayload ? paymentPayload.id : 'confirmed_no_id'
                })
                .eq('order_id', orderPayload.id)

            if (updateError) {
                console.error("Webhook Update Error:", updateError)
                throw updateError
            }
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
