import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("BODY RECIBIDO:", body)

    const { email, user_id } = body

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
   body: JSON.stringify({
  reason: "Arcana Pro - Suscripción mensual",

  auto_recurring: {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: 15000,
    currency_id: "ARS",
    start_date: new Date(Date.now() + 3600000).toISOString()
  },

  back_url: "https://arcana-saas.vercel.app/dashboard",

  payer_email: email,


  external_reference: user_id
})
    })

    const data = await response.json()

    console.log("MP DATA:", data)

    // guardar subscription_id en Supabase
    await supabase
      .from("users")
      .update({
        subscription_id: data.id,
        subscription_status: "pending"
      })
      .eq("id", user_id)

    return NextResponse.json(data)

  } catch (error) {
    console.error("SERVER ERROR:", error)

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}