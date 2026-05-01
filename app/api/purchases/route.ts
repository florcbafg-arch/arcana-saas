import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { business_id, supplier_id, notes, items } = body

    if (!business_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios' },
        { status: 400 }
      )
    }

    // 1️⃣ Crear compra
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert([
        {
          business_id,
          supplier_id,
          notes
        }
      ])
      .select()
      .single()

    if (purchaseError) {
      return NextResponse.json({ error: purchaseError.message }, { status: 500 })
    }

    // 2️⃣ Insertar items
    const itemsToInsert = items.map((item: any) => ({
      purchase_id: purchase.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost
    }))

    const { error: itemsError } = await supabase
      .from('purchase_items')
      .insert(itemsToInsert)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      purchase_id: purchase.id
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}