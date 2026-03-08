import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {

    const body = await req.json()

    console.log("Webhook recibido:", body)

    // MercadoPago envía el ID de la suscripción
    const subscriptionId = body.data?.id || body.id

    if (!subscriptionId) {
      return NextResponse.json({ message: "No subscription id" })
    }

    // buscamos el usuario que tiene esa suscripción
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .single()

    if (!user) {
      console.log("Usuario no encontrado")
      return NextResponse.json({ message: "User not found" })
    }

    // activamos el plan PRO
    await supabase
      .from("users")
      .update({
        plan: "pro",
        subscription_status: "active"
      })
      .eq("id", user.id)

    console.log("Usuario actualizado a PRO")

    return NextResponse.json({ received: true })

  } catch (error) {

    console.error("Webhook error:", error)

    return NextResponse.json(
      { error: "Webhook error" },
      { status: 500 }
    )
  }
}