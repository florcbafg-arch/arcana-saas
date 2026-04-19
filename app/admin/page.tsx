'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminPanel() {

const [stats,setStats] = useState({
businesses:0,
users:0,
products:0,
sales:0
})

useEffect(()=>{

const loadStats = async () => {

const { count: businesses } = await supabase
.from("businesses")
.select("*",{ count:"exact", head:true })

const { count: users } = await supabase
.from("profiles")
.select("*",{ count:"exact", head:true })

const { count: products } = await supabase
.from("products")
.select("*",{ count:"exact", head:true })

const { count: sales } = await supabase
.from("sales")
.select("*",{ count:"exact", head:true })

setStats({
businesses: businesses || 0,
users: users || 0,
products: products || 0,
sales: sales || 0
})

}

loadStats()

},[])

return (

<div className="p-8 text-white">

<h1 className="text-2xl font-bold mb-6">
Panel interno Arcana
</h1>

<div className="grid grid-cols-4 gap-6">

<div className="bg-[#111118] p-6 rounded-xl border border-[#1F1F24]">
<p className="text-gray-400 text-sm">Negocios</p>
<p className="text-2xl font-bold">{stats.businesses}</p>
</div>

<div className="bg-[#111118] p-6 rounded-xl border border-[#1F1F24]">
<p className="text-gray-400 text-sm">Usuarios</p>
<p className="text-2xl font-bold">{stats.users}</p>
</div>

<div className="bg-[#111118] p-6 rounded-xl border border-[#1F1F24]">
<p className="text-gray-400 text-sm">Productos</p>
<p className="text-2xl font-bold">{stats.products}</p>
</div>

<div className="bg-[#111118] p-6 rounded-xl border border-[#1F1F24]">
<p className="text-gray-400 text-sm">Ventas</p>
<p className="text-2xl font-bold">{stats.sales}</p>
</div>

</div>

</div>

)

}