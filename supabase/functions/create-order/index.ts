import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Razorpay from 'npm:razorpay@2.9.2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Get User
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            throw new Error('User not authenticated')
        }

        const { items, customer_name, customer_phone, address } = await req.json()

        // 2. Calculate Total Securely (Fetch prices from DB)
        // Extract IDs to fetch
        const productIds = items.map((i: any) => i.id)
        const { data: products, error: productError } = await supabase
            .from('products')
            .select('id, price, name, variants')
            .in('id', productIds)

        if (productError || !products) {
            throw new Error('Failed to fetch product prices')
        }

        let calculatedTotal = 0

        // Match items with DB products to get real price
        for (const item of items) {
            const product = products.find(p => p.id === item.id)
            if (!product) continue

            let price = product.price

            // If variant, find variant price
            // Note: In a real app, you'd fetch variant prices securely too. 
            // For now, we trust the variant price logic from the product row if variants are stored in JSON.
            if (item.variant) {
                // Find the variant in the product's variants array
                const dbVariant = product.variants?.find((v: any) => v.name === item.variant.name)
                if (dbVariant) {
                    price = dbVariant.price
                }
            }

            calculatedTotal += price * item.qty
        }

        // 3. Initialize Razorpay
        const razorpay = new Razorpay({
            key_id: Deno.env.get('RAZORPAY_KEY_ID'),
            key_secret: Deno.env.get('RAZORPAY_KEY_SECRET'),
        })

        // 4. Create Order on Razorpay
        const order = await razorpay.orders.create({
            amount: calculatedTotal * 100, // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                user_id: user.id,
                customer_name,
                customer_phone,
                address,
                items: JSON.stringify(items) // Store items in notes for Webhook to retrieve
            }
        })

        // Return the Order ID and Calculated Amount to frontend
        return new Response(
            JSON.stringify({
                order_id: order.id,
                amount: calculatedTotal,
                currency: "INR",
                key_id: Deno.env.get('RAZORPAY_KEY_ID')
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

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
