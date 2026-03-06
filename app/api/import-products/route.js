import * as XLSX from "xlsx"
import { createClient } from "@supabase/supabase-js"

export async function POST(req) {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const formData = await req.formData()
  const file = formData.get("file")
  const user_id = formData.get("user_id")

  const buffer = await file.arrayBuffer()

  const workbook = XLSX.read(buffer)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]

  const rows = XLSX.utils.sheet_to_json(sheet)

  // buscar business_id
  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id")
    .eq("user_id", user_id)
    .single()

  const business_id = businessUser.business_id

  const products = rows.map(p => ({
    business_id,
    code: p.code,
    name: p.name,
    price: p.price,
    stock_quantity: p.stock_quantity
  }))

  const { error } = await supabase
    .from("products")
    .upsert(products, {
      onConflict: "business_id,code"
    })

  if (error) {
    return Response.json({ error })
  }

  return Response.json({ success: true })

}