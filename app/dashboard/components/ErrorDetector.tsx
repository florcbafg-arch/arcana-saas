'use client'

import { useEffect } from "react"

export default function ErrorDetector() {

useEffect(() => {

const handleError = (event: ErrorEvent) => {

const pagina = window.location.pathname
const error = event.message
const fecha = new Date().toLocaleDateString()
const hora = new Date().toLocaleTimeString()

const negocio = localStorage.getItem("activeBusinessId") || "desconocido"

const mensaje = `
⚠️ Error detectado en Arcana

Negocio ID: ${negocio}
Página: ${pagina}
Error: ${error}
Fecha: ${fecha}
Hora: ${hora}
`

const texto = encodeURIComponent(mensaje)

window.open(`https://t.me/arcana_soporte?text=${texto}`, "_blank")

}

window.addEventListener("error", handleError)

return () => {
window.removeEventListener("error", handleError)
}

}, [])

return null

}