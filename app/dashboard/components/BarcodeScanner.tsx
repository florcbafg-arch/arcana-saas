"use client"

import { useEffect, useRef } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"

type Props = {
  onScan: (code: string) => void
}

export default function BarcodeScanner({ onScan }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const codeReader = useRef(new BrowserMultiFormatReader())
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const startScanner = async () => {
      try {

        await navigator.mediaDevices.getUserMedia({
  video: { facingMode: "environment" }
})

        const devices = await BrowserMultiFormatReader.listVideoInputDevices()

        const backCamera =
          devices.find((d) =>
            d.label.toLowerCase().includes("back")
          ) || devices[0]

       
        const controls = await codeReader.current.decodeFromConstraints(
  {
    video: {
      facingMode: "environment"
    }
  },
  videoRef.current!,
  (result, err) => {
    if (result) {
  const code = result.getText()

  const beep = () => {
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
  }

  beep()

  onScan(code)

  controlsRef.current?.stop()
}
  }
)
      } catch (err) {
        console.error(err)
      }
    }

    startScanner()

 return () => {
  controlsRef.current?.stop()
}
  }, [onScan])

  return (
    <div className="bg-black rounded-xl p-4">
      <p className="text-sm text-gray-400 mb-2">
        Apunta la cámara al código de barras
      </p>

      <video
        ref={videoRef}
        className="w-full rounded-lg"
      />
    </div>
  )
}