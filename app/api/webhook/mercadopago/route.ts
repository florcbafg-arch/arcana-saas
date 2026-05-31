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

    const subscriptionId = body.data?.id || body.id

    if (!subscriptionId) {
      return NextResponse.json({ message: "No subscription id" })
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .single()

    if (!business) {
      return NextResponse.json({ message: "Business not found" })
    }

    const eventType = body.type || body.action

    if (
      eventType === "payment.created" ||
      eventType === "subscription_authorized" ||
      eventType === "subscription.updated"
    ) {
      await supabase
        .from("businesses")
        .update({
          plan_type: "impulso",
          subscription_active: true,
          subscription_status: "active",
        })
        .eq("id", business.id)
    }

    if (eventType === "payment.failed") {
      await supabase
        .from("businesses")
        .update({
          plan_type: "base",
          subscription_active: true,
          subscription_status: "past_due",
        })
        .eq("id", business.id)
    }

    if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.canceled"
    ) {
      await supabase
        .from("businesses")
        .update({
          plan_type: "base",
          subscription_active: true,
          subscription_status: "cancelled",
        })
        .eq("id", business.id)
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