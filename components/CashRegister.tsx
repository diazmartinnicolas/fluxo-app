import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Calculator, Printer, CheckCircle, AlertTriangle,
    TrendingUp, TrendingDown, Loader2, Banknote, CreditCard, Smartphone,
    Coins, FileSpreadsheet
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// ============================================================
// TIPOS
// ============================================================

interface SalesBreakdown {
    total: number;
    cash: number;
    card: number;
    transfer: number;
    orderCount: number;
}

// ============================================================
// TICKET DE IMPRESIÓN
// ============================================================

const CashClosingTicket = React.forwardRef<HTMLDivElement, {
    salesBreakdown: SalesBreakdown;
    initialCash: number;
    expenses: number;
    otherExpenses: number;
    expectedCash: number;
    countedCash: number;
    difference: number;
    notes: string;
    companyName: string;
    userName: string;
    closingDate: Date;
}>(({ salesBreakdown, initialCash, expenses, otherExpenses, expectedCash, countedCash, difference, notes, companyName, userName, closingDate }, ref) => {
    const fmt = (val: number) => new Intl.NumberFormat('es-AR', {
        style: 'currency', currency: 'ARS', maximumFractionDigits: 0
    }).format(val);

    return (
        <div ref={ref} className="hidden print:block p-4 bg-white text-black font-mono text-sm w-[80mm] mx-auto">
            <div className="text-center mb-4 border-b-2 border-black pb-2">
                <h2 className="font-black text-xl uppercase">{companyName}</h2>
                <p className="text-xs mt-1">CIERRE DE CAJA</p>
                <p className="text-[10px] mt-1">
                    {closingDate.toLocaleDateString('es-AR')} - {closingDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-[10px]">Cajero: {userName}</p>
            </div>

            <div className="mb-4 border-b border-dashed border-black pb-2">
                <p className="font-bold text-center mb-2">RESUMEN DE CAJA</p>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Fondo Inicial:</span>
                        <span>{fmt(initialCash)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-1">
                        <span>(+) Ventas Efectivo:</span>
                        <span>{fmt(salesBreakdown.cash)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                        <span>(-) Gastos:</span>
                        <span>{fmt(expenses)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 border-b border-gray-300 pb-1">
                        <span>(-) Otros Gastos:</span>
                        <span>{fmt(otherExpenses)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base mt-2">
                        <span>EFECTIVO ESPERADO:</span>
                        <span>{fmt(expectedCash)}</span>
                    </div>
                </div>
            </div>

            <div className="mb-4 border-b border-dashed border-black pb-2">
                <p className="font-bold text-center mb-2">OTROS MÉTODOS</p>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Tarjeta:</span>
                        <span>{fmt(salesBreakdown.card)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Transferencia:</span>
                        <span>{fmt(salesBreakdown.transfer)}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-gray-300 pt-1 mt-1">
                        <span>TOTAL VENTAS:</span>
                        <span>{fmt(salesBreakdown.total)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500">
                        <span>Total Órdenes:</span>
                        <span>{salesBreakdown.orderCount}</span>
                    </div>
                </div>
            </div>

            <div className="mb-4 border-b border-dashed border-black pb-2">
                <p className="font-bold text-center mb-2">CUADRE FINAL</p>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Esperado:</span>
                        <span>{fmt(expectedCash)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Contado (Real):</span>
                        <span>{fmt(countedCash)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                        <span>Diferencia:</span>
                        <span>{difference >= 0 ? '+' : ''}{fmt(difference)}</span>
                    </div>
                </div>
            </div>

            {notes && (
                <div className="mb-4 text-xs">
                    <p className="font-bold">Observaciones:</p>
                    <p className="mt-1">{notes}</p>
                </div>
            )}

            <div className="text-center text-[10px] border-t-2 border-black pt-2 mt-4">
                <p>*** FIN DE CIERRE ***</p>
                <p className="mt-1">Generado por Fluxo</p>
            </div>
        </div>
    );
});

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function CashRegister() {
    const { userProfile, session } = useApp();
    const [loading, setLoading] = useState(true);
    const [salesBreakdown, setSalesBreakdown] = useState<SalesBreakdown>({
        total: 0, cash: 0, card: 0, transfer: 0, orderCount: 0
    });

    // Estados para caja
    const [initialCash, setInitialCash] = useState<string>('20000');
    const [expenses, setExpenses] = useState<string>('0');
    const [otherExpenses, setOtherExpenses] = useState<string>('0');

    const [countedCash, setCountedCash] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [closed, setClosed] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ contentRef: printRef });

    const companyId = userProfile?.company_id || (userProfile as any)?.companies?.id;
    const companyName = (userProfile as any)?.companies?.name || 'Fluxo';

    // Cálculos
    const initialCashNum = parseFloat(initialCash) || 0;
    const expensesNum = parseFloat(expenses) || 0;
    const otherExpensesNum = parseFloat(otherExpenses) || 0;
    const countedCashNum = parseFloat(countedCash) || 0;

    // Efectivo esperado = Caja Inicial + Ventas Efectivo - Gastos
    const expectedCash = initialCashNum + salesBreakdown.cash - (expensesNum + otherExpensesNum);

    const difference = countedCashNum - expectedCash;

    const formatPrice = (val: number) => new Intl.NumberFormat('es-AR', {
        style: 'currency', currency: 'ARS', maximumFractionDigits: 0
    }).format(val);

    // ----------------------------------------------------------
    // CARGAR VENTAS DEL DÍA
    // ----------------------------------------------------------

    useEffect(() => {
        const fetchTodaySales = async () => {
            // Si ya cerró, no recargar (para mantener el estado visual)
            if (closed) return;

            if (!companyId) { setLoading(false); return; }

            setLoading(true);
            try {
                const today = new Date();
                const startOfDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00`;

                const { data: orders, error } = await supabase
                    .from('orders')
                    .select('total, payment_type')
                    .eq('company_id', companyId)
                    .gte('created_at', startOfDay)
                    .neq('status', 'cancelado');

                if (error) throw error;

                let cash = 0, card = 0, transfer = 0, total = 0;

                orders?.forEach(order => {
                    const amount = order.total || 0;
                    total += amount;

                    switch (order.payment_type?.toLowerCase()) {
                        case 'cash':
                        case 'efectivo':
                            cash += amount;
                            break;
                        case 'card':
                        case 'tarjeta':
                            card += amount;
                            break;
                        case 'transfer':
                        case 'transferencia':
                            transfer += amount;
                            break;
                        default:
                            cash += amount;
                    }
                });

                setSalesBreakdown({ total, cash, card, transfer, orderCount: orders?.length || 0 });
            } catch (err: any) {
                console.error('Error fetching sales:', err);
                toast.error('Error al cargar ventas del día');
            } finally {
                setLoading(false);
            }
        };

        fetchTodaySales();
    }, [companyId, closed]);

    // ----------------------------------------------------------
    // EXPORTAR A EXCEL
    // ----------------------------------------------------------

    const exportToExcel = () => {
        const today = new Date();
        const dateStr = today.toLocaleDateString('es-AR').replace(/\//g, '-');

        const data = [
            ["REPORTE DE CIERRE DE CAJA"],
            ["Empresa:", companyName],
            ["Fecha:", dateStr],
            ["Cajero:", userProfile?.full_name || session?.user?.email],
            [],
            ["RESUMEN FINANCIERO"],
            ["(+) Fondo Inicial:", initialCashNum],
            ["(+) Ventas Efectivo:", salesBreakdown.cash],
            ["(+) Ventas Tarjeta:", salesBreakdown.card],
            ["(+) Ventas Transferencia:", salesBreakdown.transfer],
            ["(=) Total Ventas:", salesBreakdown.total],
            [],
            ["EGRESOS DE CAJA"],
            ["(-) Gastos del día:", expensesNum],
            ["(-) Otros gastos:", otherExpensesNum],
            [],
            ["CUADRE DE CAJA"],
            ["(=) Efectivo Esperado:", expectedCash],
            ["(=) Efectivo Contado:", countedCashNum],
            ["(=) Diferencia:", difference],
            [],
            ["OBSERVACIONES"],
            [notes]
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cierre Caja");

        // Guardar archivo
        XLSX.writeFile(wb, `Cierre_Caja_${dateStr}.xlsx`);
    };

    // ----------------------------------------------------------
    // GUARDAR CIERRE
    // ----------------------------------------------------------

    const handleSaveClosing = async () => {
        setSaving(true);
        try {
            // Preparamos info extra en notas para no romper esquema DB
            const extraData = `
--- DETALLES ADICIONALES ---
Fondo Inicial: ${formatPrice(initialCashNum)}
Gastos Diarios: ${formatPrice(expensesNum)}
Otros Gastos: ${formatPrice(otherExpensesNum)}
Efectivo Esperado: ${formatPrice(expectedCash)}
            `.trim();

            const finalNotes = notes ? `${notes}\n\n${extraData}` : extraData;

            const closingData = {
                company_id: companyId,
                user_id: session?.user?.id,
                closed_at: new Date().toISOString(),
                total_sales: salesBreakdown.total,
                cash_sales: salesBreakdown.cash,
                card_sales: salesBreakdown.card,
                transfer_sales: salesBreakdown.transfer,
                order_count: salesBreakdown.orderCount,
                expected_cash: expectedCash, // Guardamos el nuevo esperado (calculado)
                counted_cash: countedCashNum,
                difference: difference,
                notes: finalNotes // Guardamos gastos y fondo inicial aquí
            };

            const { error } = await supabase
                .from('cash_closings')
                .insert([closingData]);

            if (error) throw error;

            toast.success('Cierre guardado. Descargando Excel...');

            // Descargar Excel
            exportToExcel();

            setClosed(true);

            setTimeout(() => handlePrint(), 1000);
        } catch (err: any) {
            console.error('Error saving closing:', err);
            toast.error('Error al guardar cierre: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    // ----------------------------------------------------------
    // RENDER
    // ----------------------------------------------------------

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-orange-500" size={48} />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6 bg-gray-50">
            {/* Ticket oculto para impresión */}
            <div className="hidden">
                <CashClosingTicket
                    ref={printRef}
                    salesBreakdown={salesBreakdown}
                    initialCash={initialCashNum}
                    expenses={expensesNum}
                    otherExpenses={otherExpensesNum}
                    expectedCash={expectedCash}
                    countedCash={countedCashNum}
                    difference={difference}
                    notes={notes}
                    companyName={companyName}
                    userName={userProfile?.full_name || session?.user?.email || 'Usuario'}
                    closingDate={new Date()}
                />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Calculator size={28} className="text-orange-500" />
                    Cierre de Caja
                </h2>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('es-AR', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </div>
            </div>

            {/* Ya cerrado */}
            {closed && (
                <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle size={24} className="text-green-600" />
                    <div>
                        <p className="font-bold text-green-800">Cierre guardado exitosamente</p>
                        <p className="text-sm text-green-600">Se descargó el Excel y se envió el ticket a imprimir.</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 transition-colors"
                        >
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                        <button
                            onClick={() => handlePrint()}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                        >
                            <Printer size={16} /> Reimprimir
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUMNA IZQUIERDA: Configuración Inicial + Resumen del día */}
                <div className="space-y-4">

                    {/* 1. CONFIGURACIÓN DE CAJA (Inputs editables) */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Coins size={20} className="text-orange-500" /> Apertura y Gastos
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">FONDO INICIAL (CAJA)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={initialCash}
                                        onChange={e => setInitialCash(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg font-bold text-gray-800 focus:ring-2 focus:ring-orange-200 outline-none"
                                        disabled={closed}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">GASTOS DEL DÍA</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={expenses}
                                        onChange={e => setExpenses(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-red-100 bg-red-50 rounded-lg font-bold text-red-700 focus:ring-2 focus:ring-red-200 outline-none"
                                        disabled={closed}
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">OTROS GASTOS (Varios)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={otherExpenses}
                                        onChange={e => setOtherExpenses(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 border border-red-100 bg-red-50 rounded-lg font-bold text-red-700 focus:ring-2 focus:ring-red-200 outline-none"
                                        disabled={closed}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. VENTAS DEL DÍA */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-5 shadow-lg flex justify-between items-center">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Ventas Totales</p>
                            <p className="text-3xl font-black mt-1">{formatPrice(salesBreakdown.total)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-orange-100 text-sm font-medium">Órdenes</p>
                            <p className="text-2xl font-bold">{salesBreakdown.orderCount}</p>
                        </div>
                    </div>

                    {/* Desglose por método */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">Desglose de Ingresos</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {/* Efectivo */}
                            <div className="flex items-center gap-3 p-4">
                                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                    <Banknote size={20} className="text-green-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">Efectivo</p>
                                    <p className="text-xs text-gray-400">Ingreso por ventas</p>
                                </div>
                                <p className="font-bold text-gray-800 text-lg">{formatPrice(salesBreakdown.cash)}</p>
                            </div>

                            {/* Tarjeta */}
                            <div className="flex items-center gap-3 p-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <CreditCard size={20} className="text-blue-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">Tarjeta</p>
                                    <p className="text-xs text-gray-400">Débito / Crédito</p>
                                </div>
                                <p className="font-bold text-gray-800 text-lg">{formatPrice(salesBreakdown.card)}</p>
                            </div>

                            {/* Transferencia */}
                            <div className="flex items-center gap-3 p-4">
                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                    <Smartphone size={20} className="text-purple-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-800">Transferencia</p>
                                    <p className="text-xs text-gray-400">MercadoPago / Alias</p>
                                </div>
                                <p className="font-bold text-gray-800 text-lg">{formatPrice(salesBreakdown.transfer)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Cuadre de efectivo + Confirmar */}
                <div className="space-y-4">
                    {/* RESUMEN MATEMÁTICO */}
                    <div className="bg-gray-800 text-gray-300 rounded-xl p-5 shadow-lg text-sm space-y-2">
                        <div className="flex justify-between">
                            <span>Fondo Inicial:</span>
                            <span className="font-mono text-white"> {formatPrice(initialCashNum)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>(+) Ventas Efectivo:</span>
                            <span className="font-mono text-green-400"> {formatPrice(salesBreakdown.cash)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>(-) Gastos del día:</span>
                            <span className="font-mono text-red-400">-{formatPrice(expensesNum)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>(-) Otros Gastos:</span>
                            <span className="font-mono text-red-400">-{formatPrice(otherExpensesNum)}</span>
                        </div>
                        <div className="border-t border-gray-600 pt-2 flex justify-between text-base font-bold text-white mt-1">
                            <span>EFECTIVO ESPERADO:</span>
                            <span>{formatPrice(expectedCash)}</span>
                        </div>
                    </div>

                    {/* INPUT DE CONTEO */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Banknote size={20} className="text-green-500" />
                            ¿Cuánto hay en caja?
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Contá el dinero físico en el cajón y escribí el total abajo.
                        </p>

                        <div className="relative mb-4">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400 font-bold">$</span>
                            <input
                                type="number"
                                value={countedCash}
                                onChange={(e) => setCountedCash(e.target.value)}
                                placeholder="0"
                                className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-3xl font-black text-center focus:ring-4 focus:ring-orange-100 focus:border-orange-400 outline-none transition-all"
                                disabled={closed}
                            />
                        </div>

                        {/* Diferencia */}
                        {countedCash !== '' && (
                            <div className={`rounded-xl p-4 flex items-center gap-3 ${difference === 0
                                ? 'bg-green-50 border border-green-200'
                                : difference > 0
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-red-50 border border-red-200'
                                }`}>
                                {difference === 0 && <CheckCircle size={24} className="text-green-500" />}
                                {difference > 0 && <TrendingUp size={24} className="text-blue-500" />}
                                {difference < 0 && <TrendingDown size={24} className="text-red-500" />}
                                <div>
                                    <p className={`font-bold ${difference === 0 ? 'text-green-700' : difference > 0 ? 'text-blue-700' : 'text-red-700'
                                        }`}>
                                        {difference === 0
                                            ? 'Caja cuadrada perfectamente ✓'
                                            : difference > 0
                                                ? `Sobrante: ${formatPrice(difference)}`
                                                : `Faltante: ${formatPrice(Math.abs(difference))}`
                                        }
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Observaciones */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-800 mb-3">Observaciones</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Notas sobre el cierre, explicaciones de diferencias, etc..."
                            rows={3}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none outline-none text-sm"
                            disabled={closed}
                        />
                    </div>

                    {/* Botón de cierre */}
                    {!closed && (
                        <button
                            onClick={handleSaveClosing}
                            disabled={saving || countedCash === ''}
                            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg shadow-lg"
                        >
                            {saving ? (
                                <><Loader2 size={20} className="animate-spin" /> Guardando...</>
                            ) : (
                                <><Printer size={20} /> Cerrar Caja</>
                            )}
                        </button>
                    )}

                    {/* Advertencia si hay faltante */}
                    {countedCash !== '' && difference < 0 && !closed && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-700">
                                Se registrará el faltante de {formatPrice(Math.abs(difference))} en el cierre.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
