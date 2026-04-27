'use client'

import { useState } from 'react'



export default function ComprasPage() {
    const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="p-8 text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">📦 Compras</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestiona ingresos de mercadería, proveedores y costos.
          </p>
        </div>

        <button
  onClick={() => setIsOpen(true)}
  className="bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl px-5 py-3 font-semibold"
>
  + Nueva compra
</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#11131A] border border-[#242838] rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Compras del mes</p>
          <h2 className="text-2xl font-bold mt-2">0</h2>
        </div>

        <div className="bg-[#11131A] border border-[#242838] rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Total invertido</p>
          <h2 className="text-2xl font-bold mt-2">$0</h2>
        </div>

        <div className="bg-[#11131A] border border-[#242838] rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Productos ingresados</p>
          <h2 className="text-2xl font-bold mt-2">0</h2>
        </div>

        <div className="bg-[#11131A] border border-[#242838] rounded-2xl p-5">
          <p className="text-slate-400 text-sm">Última compra</p>
          <h2 className="text-lg font-bold mt-2">Sin registros</h2>
        </div>
      </div>

      <div className="bg-[#11131A] border border-[#242838] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#242838]">
          <h2 className="font-semibold">Historial de compras</h2>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-[#0B0D13] text-slate-400">
            <tr>
              <th className="text-left p-4">Fecha</th>
              <th className="text-left p-4">Proveedor</th>
              <th className="text-left p-4">Productos</th>
              <th className="text-left p-4">Total</th>
              <th className="text-left p-4">Estado</th>
              <th className="text-left p-4">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-t border-[#242838]">
              <td className="p-4 text-slate-400">—</td>
              <td className="p-4 text-slate-400">Sin compras registradas</td>
              <td className="p-4 text-slate-400">—</td>
              <td className="p-4 text-slate-400">$0</td>
              <td className="p-4">
                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs">
                  Pendiente
                </span>
              </td>
              <td className="p-4 text-slate-500">—</td>
            </tr>
          </tbody>
        </table>

{isOpen && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-[#11131A] border border-[#242838] rounded-2xl w-full max-w-2xl p-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Nueva compra</h2>
          <p className="text-sm text-slate-400">
            Registra productos comprados y actualiza stock.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-sm text-slate-300">Proveedor</label>
          <select className="mt-2 w-full bg-[#0B0D13] border border-[#242838] rounded-xl px-4 py-3 outline-none">
            <option>Seleccionar proveedor</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-slate-300">Fecha</label>
          <input
            type="date"
            className="mt-2 w-full bg-[#0B0D13] border border-[#242838] rounded-xl px-4 py-3 outline-none"
          />
        </div>
      </div>

      <div className="border border-[#242838] rounded-2xl p-4 mb-5">
        <h3 className="font-semibold mb-4">Productos comprados</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select className="bg-[#0B0D13] border border-[#242838] rounded-xl px-3 py-3 outline-none">
            <option>Producto</option>
          </select>

          <input
            type="number"
            placeholder="Cantidad"
            className="bg-[#0B0D13] border border-[#242838] rounded-xl px-3 py-3 outline-none"
          />

          <input
            type="number"
            placeholder="Costo unitario"
            className="bg-[#0B0D13] border border-[#242838] rounded-xl px-3 py-3 outline-none"
          />

          <button className="bg-[#242838] hover:bg-[#30364A] rounded-xl px-3 py-3 font-semibold">
            + Agregar
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-lg font-bold">Total: $0</p>

        <div className="flex gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="bg-[#242838] hover:bg-[#30364A] rounded-xl px-5 py-3 font-semibold"
          >
            Cancelar
          </button>

          <button className="bg-[#1F6BFF] hover:bg-[#2E7BFF] rounded-xl px-5 py-3 font-semibold">
            Guardar compra
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  )
}