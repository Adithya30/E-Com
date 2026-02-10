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

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("Invalid items array")
        }

        let calculatedTotal = 0
        const enrichedItems = [] // Store full item details for DB

        // Match items with DB products to get real price
        for (const item of items) {
            if (!item.id || !item.qty || item.qty < 1) {
                console.warn("Skipping invalid item:", item)
                continue
            }

            const product = products.find(p => p.id === item.id)
            if (!product) continue

            let price = product.price
            let variantName = null

            // If variant, find variant price
            // Note: In a real app, you'd fetch variant prices securely too. 
            // For now, we trust the variant price logic from the product row if variants are stored in JSON.
            if (item.variant) {
                // Find the variant in the product's variants array
                const dbVariant = product.variants?.find((v: any) => v.name === item.variant.name)
                if (dbVariant) {
                    price = dbVariant.price
                    variantName = dbVariant.name
                }
            }

            calculatedTotal += price * item.qty

            // Add to enriched items
            enrichedItems.push({
                ...item,
                name: product.name,
                price: price, // Store unit price for display
                variant: item.variant // Keep variant details if needed
            })
        }

        if (calculatedTotal === 0) {
            throw new Error("Order total cannot be zero")
        }

        // 3. Initialize Razorpay
        const instance = new Razorpay({
            key_id: Deno.env.get('RAZORPAY_KEY_ID') ?? '',
            key_secret: Deno.env.get('RAZORPAY_KEY_SECRET') ?? '',
        })

        // Create Razorpay Order
        const order = await instance.orders.create({
            amount: calculatedTotal * 100, // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        })

        // 4. Save to Supabase (Pending Payment) using Service Role Key to bypass RLS
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { error: insertError } = await supabaseAdmin.from('orders').insert([{
            user_id: user.id,
            customer_name,
            customer_phone,
            address,
            total_amount: calculatedTotal,
            items: enrichedItems, // Use the enriched items with name/price
            status: 'Pending', // Revert to standard status to avoid constraint errors
            order_id: order.id, // Razorpay Order ID to match later
            payment_id: null
        }])

        if (insertError) {
            console.error("DB Insert Error:", insertError)
            throw new Error("Failed to create order record")
        }

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
        console.error("Function Error:", error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
