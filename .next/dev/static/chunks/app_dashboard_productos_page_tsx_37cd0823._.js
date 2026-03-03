(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/dashboard/productos/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductosPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function ProductosPage() {
    _s();
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [newProductName, setNewProductName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [newStock, setNewStock] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [newMinStock, setNewMinStock] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [newUnit, setNewUnit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('unidad');
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [newPrice, setNewPrice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [newActive, setNewActive] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [editingId, setEditingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedBusinessId, setSelectedBusinessId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProductosPage.useEffect": ()=>{
            const id = localStorage.getItem('activeBusinessId');
            console.log("ID desde localStorage:", id);
            if (id) {
                setSelectedBusinessId(id);
            } else {
                console.log("No hay business activo");
            }
        }
    }["ProductosPage.useEffect"], []);
    const fetchProducts = async ()=>{
        if (!selectedBusinessId) return;
        setLoading(true);
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('products').select('*').eq('business_id', selectedBusinessId).order('created_at', {
            ascending: false
        });
        setProducts(data || []);
        setLoading(false);
    };
    const createProduct = async ()=>{
        if (!newProductName.trim()) {
            setToast({
                type: "error",
                message: "Ingresá un nombre válido"
            });
            return;
        }
        try {
            if (editingId) {
                const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('products').update({
                    name: newProductName,
                    unit: newUnit,
                    stock_quantity: newStock,
                    min_stock_yellow: newMinStock,
                    min_stock_red: Math.max(1, Math.floor(newMinStock / 2)),
                    price: newPrice,
                    active: newActive
                }).eq('id', editingId);
                if (error) throw error;
                setToast({
                    type: "success",
                    message: "Producto actualizado correctamente"
                });
                setEditingId(null);
            } else {
                const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('products').insert({
                    name: newProductName,
                    business_id: selectedBusinessId,
                    unit: newUnit,
                    stock_quantity: newStock,
                    min_stock_yellow: newMinStock,
                    min_stock_red: Math.max(1, Math.floor(newMinStock / 2)),
                    price: newPrice,
                    active: newActive
                });
                if (error) throw error;
                setToast({
                    type: "success",
                    message: "Producto creado correctamente"
                });
            }
            setNewProductName('');
            setNewUnit('unidad');
            setNewStock(0);
            setNewMinStock(1);
            setNewPrice(0);
            setNewActive(true);
            setIsOpen(false);
            fetchProducts();
        } catch (err) {
            setToast({
                type: "error",
                message: err.message || "Error al guardar producto"
            });
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProductosPage.useEffect": ()=>{
            if (selectedBusinessId) {
                fetchProducts();
            }
        }
    }["ProductosPage.useEffect"], [
        selectedBusinessId
    ]);
    const updatePrice = async (id, newPrice)=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('products').update({
            price: newPrice
        }).eq('id', id);
        fetchProducts();
    };
    const handleDelete = async (id)=>{
        if (!confirm("¿Eliminar producto?")) return;
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('products').delete().eq('id', id);
        fetchProducts();
    };
    const handleEdit = (product)=>{
        setEditingId(product.id);
        setNewProductName(product.name);
        setNewPrice(product.price);
        setNewStock(product.stock_quantity);
        setNewMinStock(product.min_stock_yellow);
        setNewUnit(product.unit);
        setNewActive(product.active);
        setIsOpen(true);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProductosPage.useEffect": ()=>{
            if (!toast) return;
            const timer = setTimeout({
                "ProductosPage.useEffect.timer": ()=>{
                    setToast(null);
                }
            }["ProductosPage.useEffect.timer"], 2500);
            return ({
                "ProductosPage.useEffect": ()=>clearTimeout(timer)
            })["ProductosPage.useEffect"];
        }
    }["ProductosPage.useEffect"], [
        toast
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-6 space-y-8",
        children: [
            toast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `mb-4 p-4 rounded-xl text-sm font-medium
      ${toast.type === "success" ? "bg-green-900 text-green-400 border border-green-700" : "bg-red-900 text-red-400 border border-red-700"}`,
                children: toast.message
            }, void 0, false, {
                fileName: "[project]/app/dashboard/productos/page.tsx",
                lineNumber: 176,
                columnNumber: 3
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-2xl font-semibold text-white",
                                children: "📦 Productos"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/productos/page.tsx",
                                lineNumber: 190,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 mt-1",
                                children: "Gestioná tu catálogo y stock."
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/productos/page.tsx",
                                lineNumber: 193,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/productos/page.tsx",
                        lineNumber: 189,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setIsOpen(true),
                        className: "bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl px-5 py-3 font-semibold",
                        children: "➕ Nuevo producto"
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/productos/page.tsx",
                        lineNumber: 198,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/productos/page.tsx",
                lineNumber: 188,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex justify-between items-center mb-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    type: "text",
                    placeholder: "Buscar producto...",
                    className: "bg-[#0B0B10] border border-[#2A2A32] rounded-xl px-4 py-2 text-white w-64 focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40",
                    onChange: (e)=>setSearchTerm(e.target.value)
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/productos/page.tsx",
                    lineNumber: 208,
                    columnNumber: 3
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/dashboard/productos/page.tsx",
                lineNumber: 207,
                columnNumber: 1
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[#14141A] border border-[#1F1F24] rounded-2xl overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-h-[500px] overflow-y-auto",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                            className: "w-full text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                    className: "bg-[#0F0F14] text-gray-400",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        className: "text-left",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "p-4",
                                                children: "Producto"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/productos/page.tsx",
                                                lineNumber: 223,
                                                columnNumber: 5
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "p-4",
                                                children: "Precio"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/productos/page.tsx",
                                                lineNumber: 224,
                                                columnNumber: 5
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "p-4",
                                                children: "Stock"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/productos/page.tsx",
                                                lineNumber: 225,
                                                columnNumber: 5
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "p-4",
                                                children: "Estado"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/productos/page.tsx",
                                                lineNumber: 226,
                                                columnNumber: 5
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                className: "p-4 text-center",
                                                children: "Acciones"
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/productos/page.tsx",
                                                lineNumber: 227,
                                                columnNumber: 5
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/dashboard/productos/page.tsx",
                                        lineNumber: 222,
                                        columnNumber: 3
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                    lineNumber: 221,
                                    columnNumber: 9
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                    children: products.filter((p)=>p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p)=>{
                                        let estado = 'Disponible';
                                        let color = 'green';
                                        if (p.stock_quantity === 0) {
                                            estado = 'Agotado';
                                            color = 'red';
                                        } else if (p.stock_quantity <= p.min_stock_yellow) {
                                            estado = 'Bajo stock';
                                            color = 'yellow';
                                        }
                                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            className: "border-t border-[#1F1F24] hover:bg-[#101018] transition",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "p-4 text-white font-medium",
                                                    children: p.name
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 254,
                                                    columnNumber: 16
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "p-4 font-semibold text-[#1F6BFF]",
                                                    children: [
                                                        "$",
                                                        Number(p.price).toLocaleString()
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 258,
                                                    columnNumber: 1
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "p-4 font-bold text-lg text-white",
                                                    children: p.stock_quantity
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 262,
                                                    columnNumber: 1
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "p-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: `px-3 py-1 rounded-full text-xs ${color === 'green' ? 'bg-green-500/10 text-green-400' : color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`,
                                                        children: estado
                                                    }, void 0, false, {
                                                        fileName: "[project]/app/dashboard/productos/page.tsx",
                                                        lineNumber: 267,
                                                        columnNumber: 3
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 1
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                    className: "p-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex gap-3 justify-center",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>handleEdit(p),
                                                                className: "text-blue-400 hover:text-blue-300 transition text-sm",
                                                                children: "✏️ Editar"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/productos/page.tsx",
                                                                lineNumber: 282,
                                                                columnNumber: 5
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: ()=>handleDelete(p.id),
                                                                className: "text-red-400 hover:text-red-300 transition text-sm",
                                                                children: "🗑 Eliminar"
                                                            }, void 0, false, {
                                                                fileName: "[project]/app/dashboard/productos/page.tsx",
                                                                lineNumber: 289,
                                                                columnNumber: 5
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/app/dashboard/productos/page.tsx",
                                                        lineNumber: 281,
                                                        columnNumber: 3
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 1
                                                }, this)
                                            ]
                                        }, p.id, true, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 250,
                                            columnNumber: 15
                                        }, this);
                                    })
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                    lineNumber: 231,
                                    columnNumber: 9
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/productos/page.tsx",
                            lineNumber: 219,
                            columnNumber: 5
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/productos/page.tsx",
                        lineNumber: 218,
                        columnNumber: 3
                    }, this),
                    products.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-6 text-gray-400",
                        children: "No hay productos cargados."
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/productos/page.tsx",
                        lineNumber: 308,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/productos/page.tsx",
                lineNumber: 217,
                columnNumber: 5
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-[#14141A] border border-[#1F1F24] rounded-2xl p-8 w-full max-w-md space-y-6",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-2xl font-semibold text-white",
                            children: "Nuevo producto"
                        }, void 0, false, {
                            fileName: "[project]/app/dashboard/productos/page.tsx",
                            lineNumber: 318,
                            columnNumber: 7
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-sm text-gray-400",
                                            children: "Nombre del producto"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 326,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: newProductName,
                                            onChange: (e)=>setNewProductName(e.target.value),
                                            className: "w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white   focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 329,
                                            columnNumber: 11
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                    lineNumber: 325,
                                    columnNumber: 9
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-sm text-gray-400",
                                            children: "Unidad de venta"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 339,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: newUnit,
                                            onChange: (e)=>setNewUnit(e.target.value),
                                            className: "w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white   focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "unidad",
                                                    children: "Unidad"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 348,
                                                    columnNumber: 13
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "kg",
                                                    children: "Kilo"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 349,
                                                    columnNumber: 13
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "litro",
                                                    children: "Litro"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 350,
                                                    columnNumber: 13
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "pack",
                                                    children: "Pack"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 351,
                                                    columnNumber: 13
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 342,
                                            columnNumber: 11
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                    lineNumber: 338,
                                    columnNumber: 9
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-sm text-gray-400",
                                            children: "Precio de venta"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 357,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
                                                    children: "$"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 362,
                                                    columnNumber: 13
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "number",
                                                    placeholder: "Ej: 15000",
                                                    value: newPrice,
                                                    onChange: (e)=>setNewPrice(Number(e.target.value)),
                                                    className: "w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl    p-3 pl-8 text-white   focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                                    lineNumber: 366,
                                                    columnNumber: 13
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 361,
                                            columnNumber: 11
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                    lineNumber: 356,
                                    columnNumber: 9
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-sm text-gray-400",
                                            children: "Stock inicial"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 380,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "number",
                                            placeholder: "Cantidad disponible al cargar",
                                            value: newStock,
                                            onChange: (e)=>setNewStock(Number(e.target.value)),
                                            className: "w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white   focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 383,
                                            columnNumber: 11
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                    lineNumber: 379,
                                    columnNumber: 9
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-sm text-gray-400",
                                            children: "Stock mínimo (alerta)"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 395,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "number",
                                            min: 1,
                                            placeholder: "Ej: 5",
                                            value: newMinStock,
                                            onChange: (e)=>setNewMinStock(Math.max(1, Number(e.target.value))),
                                            className: "w-full bg-[#0B0B10] border border-[#2A2A32] rounded-xl p-3 text-white   focus:outline-none focus:ring-2 focus:ring-[#1F6BFF]/40 transition"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 398,
                                            columnNumber: 11
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                    lineNumber: 394,
                                    columnNumber: 9
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 pt-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "checkbox",
                                            checked: newActive,
                                            onChange: (e)=>setNewActive(e.target.checked)
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 413,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "text-sm text-gray-400",
                                            children: "Producto activo"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/productos/page.tsx",
                                            lineNumber: 418,
                                            columnNumber: 11
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                    lineNumber: 412,
                                    columnNumber: 9
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/productos/page.tsx",
                            lineNumber: 322,
                            columnNumber: 7
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-end gap-4 pt-4",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setIsOpen(false),
                                    className: "px-4 py-2 rounded-xl border border-[#1F1F24] hover:bg-[#1A1A22] transition",
                                    children: "Cancelar"
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                    lineNumber: 427,
                                    columnNumber: 9
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: createProduct,
                                    className: "bg-[#1F6BFF] hover:bg-[#2E7BFF] transition px-5 py-2 rounded-xl font-semibold",
                                    children: "Guardar"
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/productos/page.tsx",
                                    lineNumber: 434,
                                    columnNumber: 9
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/dashboard/productos/page.tsx",
                            lineNumber: 426,
                            columnNumber: 7
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/dashboard/productos/page.tsx",
                    lineNumber: 316,
                    columnNumber: 5
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/dashboard/productos/page.tsx",
                lineNumber: 315,
                columnNumber: 3
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/dashboard/productos/page.tsx",
        lineNumber: 173,
        columnNumber: 3
    }, this);
}
_s(ProductosPage, "UZo2h0I8lmmDjt2vwKO7JYUjZ9c=");
_c = ProductosPage;
var _c;
__turbopack_context__.k.register(_c, "ProductosPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_dashboard_productos_page_tsx_37cd0823._.js.map