'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function GlobalInsightsBanner() {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadInsight = async () => {
      const businessId = localStorage.getItem('activeBusinessId')
      if (!businessId) return

      const { data: products } = await supabase
        .from('products')
        .select('name, stock_quantity, min_stock_red, min_stock_yellow, active')
        .eq('business_id', businessId)

      if (!products?.length) return

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

  if (!message) return null

  return (
    <button
      onClick={() => router.push('/dashboard')}
      className="mb-4 w-full rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-left text-sm font-semibold text-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.08)] transition hover:bg-yellow-400/15"
    >
      {message}
      <span className="ml-2 text-xs text-yellow-200/70">
        Ver detalle
      </span>
    </button>
  )
}