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

    // ID de suscripción enviado por MercadoPago
    const subscriptionId = body.data?.id || body.id

    if (!subscriptionId) {
      console.log("No subscription id")
      return NextResponse.json({ message: "No subscription id" })
    }

    // buscar usuario por subscription_id
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .single()

    if (!user) {
      console.log("Usuario no encontrado")
      return NextResponse.json({ message: "User not found" })
    }

    // detectar evento enviado por MercadoPago
    const eventType = body.type || body.action

    console.log("Evento recibido:", eventType)

    // =========================
    // SUSCRIPCIÓN ACTIVADA
    // =========================
    if (
      eventType === "payment.created" ||
      eventType === "subscription_authorized" ||
      eventType === "subscription.updated"
    ) {

      await supabase
        .from("users")
        .update({
          plan: "pro",
          subscription_status: "active"
        })
        .eq("id", user.id)

      console.log("Usuario actualizado a PRO")

    }

    // =========================
    // PAGO FALLIDO
    // =========================
    if (eventType === "payment.failed") {

      await supabase
        .from("users")
        .update({
          plan: "free",
          subscription_status: "past_due"
        })
        .eq("id", user.id)

      console.log("Pago fallido, usuario pasado a FREE")

    }

    // =========================
    // SUSCRIPCIÓN CANCELADA
    // =========================
    if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.canceled"
    ) {

      await supabase
        .from("users")
        .update({
          plan: "free",
          subscription_status: "cancelled"
        })
        .eq("id", user.id)

      console.log("Suscripción cancelada")

    }

    return NextResponse.json({ received: true })

  } catch (error) {

    console.error("Webhook error:", error)

    return NextResponse.json(
      { error: "Webhook error" },
      { status: 500 }
    )
  }
}