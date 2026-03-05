import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    console.log("Webhook recibido:", body)

    return NextResponse.json({
      received: true
    })

  } catch (error) {
    console.error("Error webhook:", error)

    return NextResponse.json(
      { error: "Webhook error" },
      { status: 500 }
    )
  }
}