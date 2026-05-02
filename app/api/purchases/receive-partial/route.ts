import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { purchase_id, items } = await req.json()

  try {
    for (const item of items) {
      const received = Number(item.received || 0)

      if (received > 0) {
        // 1. actualizar received_quantity
        await supabase
          .from('purchase_items')
          .update({
            received_quantity: received
          })
          .eq('id', item.id)

        // 2. sumar stock
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single()

        await supabase
          .from('products')
          .update({
            stock_quantity: (product?.stock_quantity || 0) + received
          })
          .eq('id', item.product_id)
      }
    }

    // 3. determinar estado
    const { data: purchaseItems } = await supabase
      .from('purchase_items')
      .select('quantity, received_quantity')
      .eq('purchase_id', purchase_id)

    const allReceived = purchaseItems?.every(
      (i) => i.received_quantity >= i.quantity
    )

    const anyReceived = purchaseItems?.some(
      (i) => i.received_quantity > 0
    )

    let status = 'pending'

    if (allReceived) status = 'received'
    else if (anyReceived) status = 'partial'

    await supabase
      .from('purchases')
      .update({ status })
      .eq('id', purchase_id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Error en recepción parcial' },
      { status: 500 }
    )
  }
}