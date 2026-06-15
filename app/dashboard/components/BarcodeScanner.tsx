"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"

type Props = {
  onScan: (code: string) => void
}

export default function BarcodeScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const codeReader = useRef(new BrowserMultiFormatReader())
  const controlsRef = useRef<any>(null)
  const lastScanRef = useRef<string | null>(null)
  const scanningRef = useRef(false)
  const [message, setMessage] = useState("Apuntá el código dentro del marco")
  const [status, setStatus] = useState<"ready" | "scanning" | "success" | "error">("ready")

  const beep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.type = "square"
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime)

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.start()

      gainNode.gain.exponentialRampToValueAtTime(
        0.00001,
        ctx.currentTime + 0.15
      )

      setTimeout(() => {
        oscillator.stop()
        ctx.close()
      }, 160)
    } catch {}
  }

  const vibrate = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(80)
    }
  }

  useEffect(() => {
    const startScanner = async () => {
      try {
        setStatus("scanning")
        setMessage("Buscando código...")

        const controls = await codeReader.current.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current!,
          (result) => {
            if (result && !scanningRef.current) {
              const code = result.getText()
              const now = Date.now()

              if (lastScanRef.current === code) return

              scanningRef.current = true
              lastScanRef.current = code

              setStatus("success")
              setMessage("✅ Código detectado")

              vibrate()
              beep()

              onScan(code)

              setTimeout(() => {
                scanningRef.current = false
                setStatus("scanning")
                setMessage("Buscando código...")
              }, 1200)

              controlsRef.current?.stop()
            }
          }
        )

        controlsRef.current = controls
      } catch (err) {
        console.error(err)
        setStatus("error")
        setMessage("No se pudo iniciar la cámara")
      }
    }

    startScanner()

    return () => {
      controlsRef.current?.stop()
    }
  }, [onScan])

  return (
    <div className="rounded-3xl border border-white/10 bg-black p-4 shadow-2xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p
          className={`text-sm font-semibold ${
            status === "success"
              ? "text-green-400"
              : status === "error"
              ? "text-red-400"
              : "text-gray-300"
          }`}
        >
          {message}
        </p>

        <span
          className={`h-3 w-3 rounded-full ${
            status === "success"
              ? "bg-green-400"
              : status === "error"
              ? "bg-red-400"
              : "bg-yellow-400 animate-pulse"
          }`}
        />
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="h-[360px] w-full object-cover"
          muted
          playsInline
        />

        {/* Oscurecedor */}
        <div className="pointer-events-none absolute inset-0 bg-black/35" />

        {/* Marco scanner */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative h-32 w-[82%] max-w-md rounded-2xl border border-green-400/30 bg-black/10">
            <div className="absolute -left-1 -top-1 h-8 w-8 border-l-4 border-t-4 border-green-400 rounded-tl-xl" />
            <div className="absolute -right-1 -top-1 h-8 w-8 border-r-4 border-t-4 border-green-400 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 h-8 w-8 border-b-4 border-l-4 border-green-400 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 h-8 w-8 border-b-4 border-r-4 border-green-400 rounded-br-xl" />

            <div className="absolute left-4 right-4 top-1/2 h-[2px] -translate-y-1/2 bg-green-400 shadow-[0_0_18px_rgba(34,197,94,0.9)] animate-pulse" />

            <p className="absolute -bottom-8 left-0 right-0 text-center text-xs text-gray-300">
              Centrá el código de barras dentro del marco
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}