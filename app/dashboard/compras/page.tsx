'use client'

import { useState } from 'react'

export default function ComprasPage() {
  const [loading, setLoading] = useState(false)

  const handleTestPurchase = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          business_id: 'TU_BUSINESS_ID',
          supplier_id: null,
          notes: 'Compra desde UI',
          items: [
            {
              product_id: 'ID_DEL_PRODUCTO',
              quantity: 3,
              unit_cost: 2000
            }
          ]
        })
      })

      const data = await res.json()
      console.log(data)

      alert('Compra creada 🚀')

    } catch (error) {
      console.error(error)
      alert('Error en compra')
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Compras</h1>

      <button
        onClick={handleTestPurchase}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: '#1F6BFF',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer'
        }}
      >
        {loading ? 'Creando...' : 'Test Compra'}
      </button>
    </div>
  )
}