'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useBusinessAlerts from '../hooks/useBusinessAlerts'

export default function GlobalInsightsBanner() {
  const router = useRouter()

  const { alerts } = useBusinessAlerts()

  const [dismissedKey, setDismissedKey] =
    useState<string | null>(null)

  const topAlert = alerts[0] || null

  useEffect(() => {
    if (!topAlert) return

    const dismissed =
      sessionStorage.getItem(
        'arcanaDismissedAlert'
      )

    setDismissedKey(dismissed)
  }, [topAlert?.key])

  if (!topAlert) return null

  if (dismissedKey === topAlert.key) {
    return null
  }

  const handleDismiss = () => {
    sessionStorage.setItem(
      'arcanaDismissedAlert',
      topAlert.key
    )

    setDismissedKey(topAlert.key)
  }

  const handleOpenProduct = () => {
    router.push(
      `/dashboard/productos?edit=${topAlert.productId}`
    )
  }

  return (
    <div
      className={`
        relative
        rounded-2xl
        border
        px-4 py-3
        pr-10
        mb-5
        ${
          topAlert.priority === 1
            ? 'bg-red-500/10 border-red-500/25'
            : 'bg-yellow-500/10 border-yellow-500/25'
        }
      `}
    >

      <div
        className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          justify-between
          gap-3
        "
      >

        <div className="flex items-center gap-3">

          <span className="text-xl">
            {topAlert.icon}
          </span>

          <div>

            <p
              className={`text-sm font-semibold ${
                topAlert.priority === 1
                  ? 'text-red-300'
                  : 'text-yellow-300'
              }`}
            >
              {topAlert.message}
            </p>

            <p className="text-xs text-gray-400 mt-0.5">
              Arcana detectó una situación que requiere atención.
            </p>

          </div>

        </div>


        <button
          type="button"
          onClick={handleOpenProduct}
          className="
            self-start
            sm:self-auto
            text-xs
            font-semibold
            text-[#6EA8FF]
            hover:text-white
            transition
            whitespace-nowrap
          "
        >
          Ver producto →
        </button>

      </div>


      <button
        type="button"
        onClick={handleDismiss}
        className="
          absolute
          right-3
          top-1/2
          -translate-y-1/2
          text-gray-400
          hover:text-white
          transition
        "
      >
        ✕
      </button>

    </div>
  )
}