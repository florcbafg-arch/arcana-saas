'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function GlobalInsightsBanner() {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const loadInsight = async () => {
      const businessId = localStorage.getItem('activeBusinessId')
      if (!businessId) return

      const { data: products } = await supabase
        .from('products')
        .select('name, stock_quantity, min_stock_red, min_stock_yellow, active, expiration_date')
        .eq('business_id', businessId)

      if (!products?.length) return

      const today = new Date()
today.setHours(0, 0, 0, 0)

const productsWithExpiration = products
  .filter(p => p.active && p.expiration_date)
  .map(p => {
    const expiration = new Date(p.expiration_date)
    expiration.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil(
      (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      ...p,
      diffDays
    }
  })

const expired = productsWithExpiration.find(p => p.diffDays < 0)

const expiresToday = productsWithExpiration.find(p => p.diffDays === 0)

const expiresSoon = productsWithExpiration.find(
  p => p.diffDays > 0 && p.diffDays <= 7
)

if (expired) {
  setMessage(`⛔ ${expired.name} ya está vencido`)
  return
}

if (expiresToday) {
  setMessage(`🚨 ${expiresToday.name} vence hoy`)
  return
}

if (expiresSoon) {
  setMessage(`⚠️ ${expiresSoon.name} vence en ${expiresSoon.diffDays} días`)
  return
}

      const critical = products.find(
        p => p.active && p.stock_quantity <= p.min_stock_red
      )

      const warning = products.find(
        p => p.active && p.stock_quantity <= p.min_stock_yellow
      )

      if (critical) {
        setMessage(`🚨 ${critical.name} está crítico: quedan ${critical.stock_quantity}`)
        return
      }

      if (warning) {
        setMessage(`⚠️ ${warning.name} tiene stock bajo: quedan ${warning.stock_quantity}`)
        return
      }

      setMessage(null)
    }

    loadInsight()

    const interval = setInterval(loadInsight, 15000)

    return () => clearInterval(interval)
  }, [])

  if (!message || dismissed) return null

  return (
  <div className="mb-4 relative">
    <button
      onClick={() => router.push('/dashboard')}
      className="w-full rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-left text-sm font-semibold text-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.08)] transition hover:bg-yellow-400/15"
    >
      {message}
      <span className="ml-2 text-xs text-yellow-200/70">
        Ver detalle
      </span>
    </button>

    <button
      onClick={() => setDismissed(true)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-300 hover:text-white"
    >
      ✕
    </button>
  </div>
)
}