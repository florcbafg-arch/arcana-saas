'use client'

export default function SupportButton() {

const reportarProblema = () => {

const pagina = window.location.pathname
const dispositivo = /Mobi|Android/i.test(navigator.userAgent) ? "Móvil" : "Desktop"
const navegador = navigator.userAgent

const fecha = new Date().toLocaleDateString()
const hora = new Date().toLocaleTimeString()

const negocio = localStorage.getItem("activeBusinessId") || "desconocido"

const mensaje = `
Hola Arcana 👋

Quiero reportar un problema.

Negocio ID: ${negocio}
Página: ${pagina}
Dispositivo: ${dispositivo}
Navegador: ${navegador}
Fecha: ${fecha}
Hora: ${hora}

Descripción del problema:
`

const texto = encodeURIComponent(mensaje)

window.open(`https://t.me/arcana_soporte?text=${texto}`, "_blank")

}

return (

<button
onClick={reportarProblema}
className="
fixed bottom-6 right-6
bg-gradient-to-r from-blue-600 to-indigo-600
hover:scale-110
text-white
px-5 py-3
rounded-full
shadow-xl
flex items-center gap-2
transition
z-50
"
>
💬 Soporte
</button>

)

}