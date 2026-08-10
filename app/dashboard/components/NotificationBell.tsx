'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useBusinessAlerts from '../hooks/useBusinessAlerts'

export default function NotificationBell() {
  const router = useRouter()

  const { alerts } = useBusinessAlerts()

  const [open, setOpen] = useState(false)

  const handleOpenProduct = (
    productId: string
  ) => {
    setOpen(false)

    router.push(
      `/dashboard/productos?edit=${productId}`
    )
  }

  return (
    <div className="relative">

      {/* CAMPANA */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          relative
          w-11 h-11
          rounded-xl
          bg-[#14141A]
          border border-[#2A2A32]
          flex
          items-center
          justify-center
          text-xl
          hover:border-[#1F6BFF]/50
          hover:bg-[#181820]
          transition
        "
        aria-label="Notificaciones"
      >
        🔔

        {alerts.length > 0 && (
          <span
            className="
              absolute
              -top-1.5
              -right-1.5
              min-w-[20px]
              h-5
              px-1
              rounded-full
              bg-red-500
              text-white
              text-[10px]
              font-bold
              flex
              items-center
              justify-center
              border-2
              border-[#0B0B10]
            "
          >
            {alerts.length > 99
              ? '99+'
              : alerts.length}
          </span>
        )}
      </button>


      {/* PANEL */}
      {open && (
        <>
          {/* Click exterior */}
          <button
            type="button"
            aria-label="Cerrar notificaciones"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[998] cursor-default"
          />

          <div
            className="
              fixed
              md:absolute
              z-[999]
              top-16
              md:top-14
              right-3
              md:right-0
              left-3
              md:left-auto
              md:w-[390px]
              max-h-[70vh]
              bg-[#14141A]
              border border-[#2A2A32]
              rounded-2xl
              shadow-2xl
              overflow-hidden
            "
          >

            {/* HEADER */}
            <div
              className="
                flex
                items-center
                justify-between
                p-4
                border-b
                border-[#25252D]
              "
            >
              <div>
                <h3 className="text-white font-semibold">
                  Notificaciones
                </h3>

                <p className="text-xs text-gray-500 mt-0.5">
                  Situaciones que necesitan tu atención.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="
                  w-8 h-8
                  rounded-lg
                  text-gray-400
                  hover:text-white
                  hover:bg-[#22222A]
                  transition
                "
              >
                ✕
              </button>
            </div>


            {/* NOTIFICACIONES */}
            <div className="max-h-[430px] overflow-y-auto">

              {alerts.length === 0 ? (

                <div className="p-8 text-center">

                  <div className="text-3xl mb-3">
                    ✅
                  </div>

                  <p className="text-sm text-white font-medium">
                    Todo está bajo control
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    No hay notificaciones pendientes.
                  </p>

                </div>

              ) : (

                <div className="divide-y divide-[#25252D]">

                  {alerts.map((alert) => (

                    <div
                      key={alert.key}
                      className="
                        p-4
                        hover:bg-[#18181F]
                        transition
                      "
                    >

                      <div className="flex gap-3">

                        <div
                          className="
                            w-9 h-9
                            shrink-0
                            rounded-xl
                            bg-[#0F0F14]
                            flex
                            items-center
                            justify-center
                          "
                        >
                          {alert.icon}
                        </div>


                        <div className="flex-1 min-w-0">

                          <div className="flex justify-between gap-3">

                            <div>

                              <p
                                className={`text-xs font-semibold ${
                                  alert.priority === 1
                                    ? 'text-red-400'
                                    : alert.priority === 2
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                {alert.title}
                              </p>

                              <p className="text-sm text-white mt-1">
                                {alert.message}
                              </p>

                            </div>

                          </div>


                          <button
                            type="button"
                            onClick={() =>
                              handleOpenProduct(
                                alert.productId
                              )
                            }
                            className="
                              mt-3
                              text-xs
                              text-[#6EA8FF]
                              hover:text-white
                              font-medium
                              transition
                            "
                          >
                            Ver producto →
                          </button>

                        </div>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>


            {/* FOOTER */}
            {alerts.length > 0 && (
              <div
                className="
                  px-4 py-3
                  border-t
                  border-[#25252D]
                  bg-[#111116]
                "
              >
                <p className="text-[11px] text-gray-500">
                  Las notificaciones desaparecen cuando resolvés la situación.
                </p>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  )
}