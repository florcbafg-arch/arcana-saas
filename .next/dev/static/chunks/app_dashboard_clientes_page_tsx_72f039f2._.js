(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/dashboard/clientes/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ClientesPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function ClientesPage() {
    _s();
    // ================= ESTADOS =================
    const [customers, setCustomers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [selectedCustomer, setSelectedCustomer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [newCustomerName, setNewCustomerName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [amount, setAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [movements, setMovements] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingCustomers, setLoadingCustomers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loadingMovements, setLoadingMovements] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [newLimit, setNewLimit] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // ⚠️ por ahora hardcodeado (después lo conectamos bien)
    const [selectedBusinessId, setSelectedBusinessId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ClientesPage.useEffect": ()=>{
            const id = localStorage.getItem('activeBusinessId');
            setSelectedBusinessId(id);
        }
    }["ClientesPage.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ClientesPage.useEffect": ()=>{
            if (toast) {
                const timer = setTimeout({
                    "ClientesPage.useEffect.timer": ()=>{
                        setToast(null);
                    }
                }["ClientesPage.useEffect.timer"], 3000);
                return ({
                    "ClientesPage.useEffect": ()=>clearTimeout(timer)
                })["ClientesPage.useEffect"];
            }
        }
    }["ClientesPage.useEffect"], [
        toast
    ]);
    // ================= DATA =================
    const fetchCustomers = async ()=>{
        if (!selectedBusinessId) return;
        setLoadingCustomers(true);
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('customers').select('*').eq('business_id', selectedBusinessId).order('created_at', {
            ascending: false
        });
        setCustomers(data || []);
        setLoadingCustomers(false);
    };
    const fetchMovements = async (customerId)=>{
        if (!selectedBusinessId) return;
        setLoadingMovements(true);
        const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('customer_movements').select('*').eq('customer_id', customerId).eq('business_id', selectedBusinessId) // 🔐 filtro por negocio
        .order('created_at', {
            ascending: false
        });
        setMovements(data || []);
        setLoadingMovements(false);
    };
    const updateDebt = async (type)=>{
        if (!selectedCustomer || amount <= 0 || !selectedBusinessId) return;
        const newDebt = type === 'add' ? selectedCustomer.debt_amount + amount : Math.max(0, selectedCustomer.debt_amount - amount);
        // 🔒 Validación contra el límite de crédito
        if (type === 'add' && selectedCustomer.credit_limit && newDebt > selectedCustomer.credit_limit) {
            alert('⚠️ Supera el límite de crédito del cliente');
            return;
        }
        const { error: updateError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('customers').update({
            debt_amount: newDebt
        }).eq('id', selectedCustomer.id).eq('business_id', selectedBusinessId);
        if (updateError) {
            setToast({
                type: 'error',
                message: 'Error actualizando deuda'
            });
            return;
        } // 🔒 protección extra
        const { error: movementError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('customer_movements').insert({
            customer_id: selectedCustomer.id,
            business_id: selectedBusinessId,
            amount,
            type
        });
        if (movementError) {
            setToast({
                type: 'error',
                message: 'Error registrando movimiento'
            });
            return;
        }
        setToast({
            type: 'success',
            message: type === 'add' ? 'Deuda actualizada correctamente' : 'Pago registrado correctamente'
        });
        setSelectedCustomer({
            ...selectedCustomer,
            debt_amount: newDebt
        });
        setAmount(0);
        fetchMovements(selectedCustomer.id);
        fetchCustomers();
    };
    const createCustomer = async ()=>{
        if (!newCustomerName || !selectedBusinessId) return;
        if (selectedCustomer) {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('customers').update({
                name: newCustomerName,
                credit_limit: newLimit
            }).eq('id', selectedCustomer.id).eq('business_id', selectedBusinessId);
            if (error) {
                setToast({
                    type: 'error',
                    message: 'Error actualizando cliente'
                });
                return;
            }
            setToast({
                type: 'success',
                message: 'Cliente actualizado correctamente'
            });
            setSelectedCustomer(null);
        } else {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('customers').insert({
                name: newCustomerName,
                business_id: selectedBusinessId,
                credit_limit: newLimit || 0,
                debt_amount: 0
            });
            if (error) {
                setToast({
                    type: 'error',
                    message: 'Error creando cliente'
                });
                return;
            }
            setToast({
                type: 'success',
                message: 'Cliente creado correctamente'
            });
        }
        setNewCustomerName('');
        setNewLimit(0);
        fetchCustomers();
    };
    const updateCreditLimit = async ()=>{
        if (!selectedCustomer || !selectedBusinessId) return;
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('customers').update({
            credit_limit: newLimit
        }).eq('id', selectedCustomer.id).eq('business_id', selectedBusinessId);
        if (error) {
            setToast({
                type: 'error',
                message: 'Error guardando límite'
            });
            return;
        }
        setToast({
            type: 'success',
            message: 'Límite actualizado correctamente'
        });
        setSelectedCustomer({
            ...selectedCustomer,
            credit_limit: newLimit
        });
        fetchCustomers();
    };
    const handleEdit = (customer)=>{
        setSelectedCustomer(customer);
        setNewCustomerName(customer.name);
        setNewLimit(customer.credit_limit || 0);
    };
    const handleDelete = async (id)=>{
        if (!confirm('¿Eliminar cliente?')) return;
        if (!selectedBusinessId) return;
        try {
            // 1️⃣ eliminar movimientos del cliente
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('customer_movements').delete().eq('customer_id', id).eq('business_id', selectedBusinessId);
            // 2️⃣ buscar ventas asociadas
            const { data: sales } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('sales').select('id').eq('customer_id', id).eq('business_id', selectedBusinessId);
            if (sales && sales.length > 0) {
                const saleIds = sales.map((s)=>s.id);
                // 3️⃣ eliminar sale_items primero
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('sale_items').delete().in('sale_id', saleIds);
                // 4️⃣ eliminar ventas
                await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('sales').delete().eq('customer_id', id).eq('business_id', selectedBusinessId);
            }
            // 5️⃣ eliminar cliente
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('customers').delete().eq('id', id).eq('business_id', selectedBusinessId);
            if (error) throw error;
            setToast({
                type: 'success',
                message: 'Cliente eliminado correctamente'
            });
            if (selectedCustomer?.id === id) {
                setSelectedCustomer(null);
            }
            fetchCustomers();
        } catch (err) {
            setToast({
                type: 'error',
                message: 'Error eliminando cliente'
            });
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ClientesPage.useEffect": ()=>{
            if (selectedBusinessId) {
                fetchCustomers();
            }
        }
    }["ClientesPage.useEffect"], [
        selectedBusinessId
    ]);
    const getRiskStatus = (debt, limit)=>{
        if (!limit || limit === 0) return {
            label: 'Sin límite',
            color: 'gray'
        };
        const usage = debt / limit * 100;
        if (usage >= 100) return {
            label: 'Riesgo alto',
            color: 'red'
        };
        if (usage >= 70) return {
            label: 'Riesgo medio',
            color: 'yellow'
        };
        return {
            label: 'Confiable',
            color: 'green'
        };
    };
    // ================= UI =================
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            toast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `p-4 rounded-xl text-sm font-medium ${toast.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`,
                children: toast.message
            }, void 0, false, {
                fileName: "[project]/app/dashboard/clientes/page.tsx",
                lineNumber: 307,
                columnNumber: 3
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl font-semibold text-white",
                        children: "👥 Clientes"
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 320,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-gray-400 text-sm",
                        children: "Gestión de cuentas y riesgo financiero."
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 323,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/clientes/page.tsx",
                lineNumber: 319,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6 space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: "text-white font-medium",
                        children: "Agregar cliente"
                    }, void 0, false, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 331,
                        columnNumber: 3
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-3 gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                placeholder: "Nombre del cliente",
                                value: newCustomerName,
                                onChange: (e)=>setNewCustomerName(e.target.value),
                                className: "bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 334,
                                columnNumber: 5
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                placeholder: "Límite de crédito",
                                value: newLimit,
                                onChange: (e)=>setNewLimit(Number(e.target.value)),
                                className: "bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 342,
                                columnNumber: 5
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: createCustomer,
                                className: "bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl p-3 font-medium",
                                children: selectedCustomer ? 'Guardar cambios' : 'Crear cliente'
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 350,
                                columnNumber: 5
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 333,
                        columnNumber: 3
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/clientes/page.tsx",
                lineNumber: 330,
                columnNumber: 1
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[#14141A] border border-[#1F1F24] rounded-2xl overflow-hidden mt-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-h-[450px] overflow-y-auto pr-2 sales-scroll",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                        className: "w-full text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                className: "bg-[#101018] text-gray-400 sticky top-0",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "p-4 text-left",
                                            children: "Cliente"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/clientes/page.tsx",
                                            lineNumber: 365,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "p-4 text-right",
                                            children: "Deuda"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/clientes/page.tsx",
                                            lineNumber: 366,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "p-4 text-right",
                                            children: "Límite"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/clientes/page.tsx",
                                            lineNumber: 367,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "p-4 text-center",
                                            children: "Riesgo"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/clientes/page.tsx",
                                            lineNumber: 368,
                                            columnNumber: 11
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                            className: "p-4 text-center",
                                            children: "Acciones"
                                        }, void 0, false, {
                                            fileName: "[project]/app/dashboard/clientes/page.tsx",
                                            lineNumber: 369,
                                            columnNumber: 11
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/dashboard/clientes/page.tsx",
                                    lineNumber: 364,
                                    columnNumber: 9
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 363,
                                columnNumber: 7
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                children: customers.map((c)=>{
                                    const risk = getRiskStatus(c.debt_amount, c.credit_limit || 0);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                        onClick: ()=>{
                                            setSelectedCustomer(c);
                                            setNewLimit(c.credit_limit || 0);
                                            fetchMovements(c.id);
                                        },
                                        className: "border-t border-[#1F1F24] hover:bg-[#101018] transition cursor-pointer",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "p-4 text-white font-medium",
                                                children: c.name
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                lineNumber: 390,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: `p-4 text-right font-semibold tabular-nums ${c.debt_amount > 0 ? 'text-red-400' : 'text-green-400'}`,
                                                children: [
                                                    "$",
                                                    Number(c.debt_amount).toLocaleString()
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                lineNumber: 394,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "p-4 text-right tabular-nums text-gray-300",
                                                children: [
                                                    "$",
                                                    Number(c.credit_limit || 0).toLocaleString()
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                lineNumber: 402,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "p-4 text-center",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex gap-3 justify-center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: (e)=>{
                                                                e.stopPropagation();
                                                                handleEdit(c);
                                                            },
                                                            className: "text-blue-400 hover:text-blue-300 transition text-sm",
                                                            children: "✏️ Editar"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                            lineNumber: 409,
                                                            columnNumber: 5
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: (e)=>{
                                                                e.stopPropagation();
                                                                handleDelete(c.id);
                                                            },
                                                            className: "text-red-400 hover:text-red-300 transition text-sm",
                                                            children: "🗑 Eliminar"
                                                        }, void 0, false, {
                                                            fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                            lineNumber: 419,
                                                            columnNumber: 5
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                    lineNumber: 407,
                                                    columnNumber: 3
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                lineNumber: 406,
                                                columnNumber: 1
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                className: "p-4 text-center",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `px-3 py-1 rounded-full text-xs ${risk.color === 'red' ? 'bg-red-500/10 text-red-400' : risk.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`,
                                                    children: risk.label
                                                }, void 0, false, {
                                                    fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                    lineNumber: 433,
                                                    columnNumber: 17
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                lineNumber: 432,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, c.id, true, {
                                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                                        lineNumber: 381,
                                        columnNumber: 13
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 373,
                                columnNumber: 7
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 362,
                        columnNumber: 5
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/dashboard/clientes/page.tsx",
                    lineNumber: 361,
                    columnNumber: 3
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/dashboard/clientes/page.tsx",
                lineNumber: 360,
                columnNumber: 1
            }, this),
            selectedCustomer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-[#14141A] border border-[#1F1F24] rounded-2xl p-6 space-y-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-semibold text-white",
                                children: selectedCustomer.name
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 458,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 text-sm",
                                children: "Estado financiero"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 461,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 457,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 text-sm",
                                children: "Deuda actual"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 468,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-3xl font-semibold text-red-400",
                                children: [
                                    "$",
                                    Number(selectedCustomer.debt_amount).toLocaleString()
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 471,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 467,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 text-sm mb-2",
                                children: "Límite de crédito"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 478,
                                columnNumber: 3
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "number",
                                        value: newLimit,
                                        onChange: (e)=>setNewLimit(Number(e.target.value)),
                                        placeholder: "Ej: 15000",
                                        className: "w-full bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                                        lineNumber: 483,
                                        columnNumber: 5
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: updateCreditLimit,
                                        className: "w-full bg-[#1F6BFF] hover:bg-[#2E7BFF] transition rounded-xl p-3 font-medium",
                                        children: "Guardar límite"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                                        lineNumber: 491,
                                        columnNumber: 5
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 482,
                                columnNumber: 3
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 477,
                        columnNumber: 1
                    }, this),
                    selectedCustomer.credit_limit || 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 text-sm mb-2",
                                children: "Uso del crédito"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 504,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full bg-[#101018] rounded-full h-3",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `h-3 rounded-full ${selectedCustomer.debt_amount / (selectedCustomer?.credit_limit || 1) >= 1 ? 'bg-red-500' : selectedCustomer.debt_amount / (selectedCustomer?.credit_limit || 1) >= 0.7 ? 'bg-yellow-500' : 'bg-green-500'}`,
                                    style: {
                                        width: `${selectedCustomer.debt_amount / (selectedCustomer?.credit_limit || 1) * 100}%`
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/app/dashboard/clientes/page.tsx",
                                    lineNumber: 509,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 508,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 503,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: amount,
                                onChange: (e)=>setAmount(Number(e.target.value)),
                                placeholder: "Monto",
                                className: "w-full bg-[#101018] border border-[#1F1F24] rounded-xl p-3 text-white"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 534,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>updateDebt('add'),
                                        className: "flex-1 bg-red-500 hover:bg-red-600 transition rounded-xl p-3 font-medium",
                                        children: "Sumar deuda"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                                        lineNumber: 545,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>updateDebt('pay'),
                                        className: "flex-1 bg-green-500 hover:bg-green-600 transition rounded-xl p-3 font-medium",
                                        children: "Registrar pago"
                                    }, void 0, false, {
                                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                                        lineNumber: 552,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 544,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 533,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm text-gray-400 mb-3",
                                children: "Movimientos recientes"
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 563,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2 max-h-[250px] overflow-y-auto pr-2 sales-scroll",
                                children: movements.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex justify-between bg-[#101018] p-3 rounded-xl text-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `px-2 py-1 rounded-md text-xs font-medium ${m.type === 'add' ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`,
                                                children: m.type === 'add' ? '➕ Nueva deuda' : '➖ Pago'
                                            }, void 0, false, {
                                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                lineNumber: 573,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: m.type === 'add' ? 'text-red-400' : 'text-green-400',
                                                children: [
                                                    "$",
                                                    m.amount
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                                lineNumber: 582,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, m.id, true, {
                                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                                        lineNumber: 569,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/dashboard/clientes/page.tsx",
                                lineNumber: 567,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/dashboard/clientes/page.tsx",
                        lineNumber: 562,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/dashboard/clientes/page.tsx",
                lineNumber: 455,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/dashboard/clientes/page.tsx",
        lineNumber: 304,
        columnNumber: 3
    }, this);
}
_s(ClientesPage, "0L32WcpiO+7Xx2EKJmJ+PeqU774=");
_c = ClientesPage;
var _c;
__turbopack_context__.k.register(_c, "ClientesPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_dashboard_clientes_page_tsx_72f039f2._.js.map