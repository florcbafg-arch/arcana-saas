'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type BusinessAlertType =
  | 'expired'
  | 'expires_today'
  | 'expires_soon'
  | 'stock_critical'
  | 'stock_low'

export type BusinessAlert = {
  key: string
  type: BusinessAlertType
  priority: number
  productId: string
  productName: string
  title: string
  message: string
  icon: string
}

export default function useBusinessAlerts() {
  const [alerts, setAlerts] = useState<BusinessAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadAlerts = async () => {
      const businessId = localStorage.getItem('activeBusinessId')

      if (!businessId) {
        if (mounted) {
          setAlerts([])
          setLoading(false)
        }
        return
      }

      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          stock_quantity,
          min_stock_red,
          min_stock_yellow,
          active,
          expiration_date
        `)
        .eq('business_id', businessId)
        .eq('active', true)

      if (error) {
        console.error('Error cargando alertas:', error)

        if (mounted) {
          setLoading(false)
        }

        return
      }

      const generatedAlerts: BusinessAlert[] = []

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      products?.forEach((product) => {

        // =========================
        // VENCIMIENTOS
        // =========================

        if (product.expiration_date) {
          const [year, month, day] =
            product.expiration_date
              .split('-')
              .map(Number)

          const expiration =
            new Date(year, month - 1, day)

          expiration.setHours(0, 0, 0, 0)

          const diffDays = Math.ceil(
            (
              expiration.getTime() -
              today.getTime()
            ) /
            (1000 * 60 * 60 * 24)
          )

          if (diffDays < 0) {
            generatedAlerts.push({
              key: `expired-${product.id}-${product.expiration_date}`,
              type: 'expired',
              priority: 1,
              productId: product.id,
              productName: product.name,
              title: 'Producto vencido',
              message: `${product.name} ya está vencido`,
              icon: '⛔'
            })
          } else if (diffDays === 0) {
            generatedAlerts.push({
              key: `expires-today-${product.id}-${product.expiration_date}`,
              type: 'expires_today',
              priority: 1,
              productId: product.id,
              productName: product.name,
              title: 'Vence hoy',
              message: `${product.name} vence hoy`,
              icon: '🚨'
            })
          } else if (diffDays <= 7) {
            generatedAlerts.push({
              key: `expires-soon-${product.id}-${product.expiration_date}`,
              type: 'expires_soon',
              priority: 2,
              productId: product.id,
              productName: product.name,
              title: 'Próximo vencimiento',
              message: `${product.name} vence en ${diffDays} ${
                diffDays === 1 ? 'día' : 'días'
              }`,
              icon: '⚠️'
            })
          }
        }

        // =========================
        // STOCK
        // =========================

        if (
          Number(product.stock_quantity) <=
          Number(product.min_stock_red)
        ) {
          generatedAlerts.push({
            key: `stock-critical-${product.id}-${product.stock_quantity}`,
            type: 'stock_critical',
            priority: 1,
            productId: product.id,
            productName: product.name,
            title: 'Stock crítico',
            message: `${product.name}: quedan ${product.stock_quantity}`,
            icon: '🔴'
          })
        } else if (
          Number(product.stock_quantity) <=
          Number(product.min_stock_yellow)
        ) {
          generatedAlerts.push({
            key: `stock-low-${product.id}-${product.stock_quantity}`,
            type: 'stock_low',
            priority: 3,
            productId: product.id,
            productName: product.name,
            title: 'Stock bajo',
            message: `${product.name}: quedan ${product.stock_quantity}`,
            icon: '🟡'
          })
        }
      })

      generatedAlerts.sort(
        (a, b) => a.priority - b.priority
      )

      if (mounted) {
        setAlerts(generatedAlerts)
        setLoading(false)
      }
    }

    loadAlerts()

    const interval = setInterval(
      loadAlerts,
      15000
    )

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return {
    alerts,
    loading
  }
}