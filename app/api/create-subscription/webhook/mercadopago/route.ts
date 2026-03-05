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

    if (body.type === "subscription_preapproval") {

      const subscription_id = body.data.id

      const response = await fetch(
        `https://api.mercadopago.com/preapproval/${subscription_id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        }
      )

      const subscription = await response.json()

      if (subscription.status === "authorized") {

        await supabase
          .from("users")
          .update({
            plan: "pro",
            subscription_status: "authorized"
          })
          .eq("subscription_id", subscription_id)

      }

    }

    return NextResponse.json({ received: true })

  } catch (error) {

    console.error("Webhook error:", error)

    return NextResponse.json({ error: "Webhook error" }, { status: 500 })

  }
}