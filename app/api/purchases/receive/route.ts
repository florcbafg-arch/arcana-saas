import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { purchase_id } = await req.json()

  // 1. Traer items de la compra
  const { data: items, error } = await supabase
    .from('purchase_items')
    .select('*')
    .eq('purchase_id', purchase_id)

  if (error || !items) {
    return Response.json({ error: 'No se pudieron obtener items' }, { status: 400 })
  }

  // 2. Actualizar stock
  for (const item of items) {
    await supabase.rpc('increment_product_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity
    })
  }

  // 3. Cambiar estado a received
  await supabase
    .from('purchases')
    .update({ status: 'received' })
    .eq('id', purchase_id)

  return Response.json({ success: true })
}