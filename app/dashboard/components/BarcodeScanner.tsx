'use client'

import { useEffect } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"

export default function BarcodeScanner({ onScan }: { onScan: (code:string)=>void }) {

useEffect(() => {

const scanner = new Html5QrcodeScanner(
"reader",
{ fps: 10, qrbox: 250 },
false
)

scanner.render(
(decodedText) => {
onScan(decodedText)
scanner.clear()
},
() => {}
)

return () => {
scanner.clear().catch(()=>{})
}

}, [])

return (
<div className="bg-black p-4 rounded-xl">
<div id="reader" />
</div>
)

}