import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Calculator, DollarSign, CreditCard, Wallet, Printer,
    CheckCircle, AlertTriangle, TrendingUp, TrendingDown, X, Loader2
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';
import { Button } from './atoms/Button';
import { toast } from 'sonner';

// ============================================================
// TIPOS
// ============================================================

interface SalesBreakdown {
    total: number;
    cash: number;
    card: number;
    mercadopago: number;
    transfer: number;
    orderCount: number;
}

interface BillCount {
    denomination: number;
    count: number;
    label: string;
}

interface CashClosingData {
    salesBreakdown: SalesBreakdown;
    expectedCash: number;
    countedCash: number;
    difference: number;
    billsDetail: BillCount[];
    notes: string;
}

// ============================================================
// CONSTANTES
// ============================================================

const BILLS: BillCount[] = [
    { denomination: 10000, count: 0, label: '$10.000' },
    { denomination: 5000, count: 0, label: '$5.000' },
    { denomination: 2000, count: 0, label: '$2.000' },
    { denomination: 1000, count: 0, label: '$1.000' },
    { denomination: 500, count: 0, label: '$500' },
    { denomination: 200, count: 0, label: '$200' },
    { denomination: 100, count: 0, label: '$100' },
    { denomination: 50, count: 0, label: '$50' },
    { denomination: 20, count: 0, label: '$20' },
    { denomination: 10, count: 0, label: '$10' },
];

// ============================================================
// COMPONENTE DE TICKET PARA IMPRIMIR
// ============================================================

const CashClosingTicket = React.forwardRef<HTMLDivElement, {
    data: CashClosingData;
    companyName: string;
    userName: string;
    closingDate: Date;
}>(({ data, companyName, userName, closingDate }, ref) => {
    const formatPrice = (val: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (
        <div ref={ref} className="hidden print:block p-4 bg-white text-black font-mono text-sm w-[80mm] mx-auto">
            {/* Header */}
            <div className="text-center mb-4 border-b-2 border-black pb-2">
                <h2 className="font-black text-xl uppercase">{companyName}</h2>
                <p className="text-xs mt-1">CIERRE DE CAJA</p>
                <p className="text-[10px] mt-1">
                    {closingDate.toLocaleDateString()} - {closingDate.toLocaleTimeString()}
                </p>
                <p className="text-[10px]">Cajero: {userName}</p>
            </div>

            {/* Resumen de Ventas */}
            <div className="mb-4 border-b border-dashed border-black pb-2">
                <p className="font-bold text-center mb-2">RESUMEN DE VENTAS</p>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Total Órdenes:</span>
                        <span className="font-bold">{data.salesBreakdown.orderCount}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-300 pt-1">
                        <span>💵 Efectivo:</span>
                        <span>{formatPrice(data.salesBreakdown.cash)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>💳 Tarjeta:</span>
                        <span>{formatPrice(data.salesBreakdown.card)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>📱 MercadoPago:</span>
                        <span>{formatPrice(data.salesBreakdown.mercadopago)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>🏦 Transferencia:</span>
                        <span>{formatPrice(data.salesBreakdown.transfer)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t-2 border-black pt-1 mt-2">
                        <span>TOTAL VENTAS:</span>
                        <span>{formatPrice(data.salesBreakdown.total)}</span>
                    </div>
                </div>
            </div>

            {/* Cuadre de Caja */}
            <div className="mb-4 border-b border-dashed border-black pb-2">
                <p className="font-bold text-center mb-2">CUADRE DE CAJA</p>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                        <span>Efectivo Esperado:</span>
                        <span>{formatPrice(data.expectedCash)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Efectivo Contado:</span>
                        <span>{formatPrice(data.countedCash)}</span>
                    </div>
                    <div className={`flex justify-between font-bold text-sm pt-1 border-t border-gray-300 ${data.difference >= 0 ? '' : 'text-black'
                        }`}>
                        <span>Diferencia:</span>
                        <span>{data.difference >= 0 ? '+' : ''}{formatPrice(data.difference)}</span>
                    </div>
                </div>
            </div>

            {/* Notas */}
            {data.notes && (
                <div className="mb-4 text-xs">
                    <p className="font-bold">Observaciones:</p>
                    <p className="mt-1">{data.notes}</p>
                </div>
            )}

            {/* Footer */}
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
    const [step, setStep] = useState<'summary' | 'counting' | 'review'>('summary');
    const [salesBreakdown, setSalesBreakdown] = useState<SalesBreakdown>({
        total: 0,
        cash: 0,
        card: 0,
        mercadopago: 0,
        transfer: 0,
        orderCount: 0
    });
    const [bills, setBills] = useState<BillCount[]>(BILLS.map(b => ({ ...b })));
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({ contentRef: printRef });

    // Obtener la compañía del usuario
    const companyId = userProfile?.company_id || (userProfile as any)?.companies?.id;
    const companyName = (userProfile as any)?.companies?.name || 'Fluxo';

    // Calcular el efectivo contado
    const countedCash = bills.reduce((sum, bill) => sum + (bill.denomination * bill.count), 0);
    const expectedCash = salesBreakdown.cash;
    const difference = countedCash - expectedCash;

    // Cargar datos de ventas del día
    useEffect(() => {
        const fetchTodaySales = async () => {
            if (!companyId) {
                setLoading(false);
                return;
            }

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

                // Calcular breakdown por tipo de pago
                let cash = 0, card = 0, mercadopago = 0, transfer = 0, total = 0;

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
                        case 'mercadopago':
                        case 'mp':
                            mercadopago += amount;
                            break;
                        case 'transfer':
                        case 'transferencia':
                            transfer += amount;
                            break;
                        default:
                            cash += amount; // Default a efectivo
                    }
                });

                setSalesBreakdown({
                    total,
                    cash,
                    card,
                    mercadopago,
                    transfer,
                    orderCount: orders?.length || 0
                });
            } catch (err: any) {
                console.error('Error fetching sales:', err);
                toast.error('Error al cargar ventas del día');
            } finally {
                setLoading(false);
            }
        };

        fetchTodaySales();
    }, [companyId]);

    // Formatear precio
    const formatPrice = (val: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        }).format(val);
    };

    // Actualizar conteo de billetes
    const updateBillCount = (index: number, value: string) => {
        const count = parseInt(value) || 0;
        const newBills = [...bills];
        newBills[index] = { ...newBills[index], count: Math.max(0, count) };
        setBills(newBills);
    };

    // Guardar cierre
    const handleSaveClosing = async () => {
        setSaving(true);
        try {
            const closingData = {
                company_id: companyId,
                user_id: session?.user?.id,
                closed_at: new Date().toISOString(),
                total_sales: salesBreakdown.total,
                cash_sales: salesBreakdown.cash,
                card_sales: salesBreakdown.card,
                mercadopago_sales: salesBreakdown.mercadopago,
                transfer_sales: salesBreakdown.transfer,
                order_count: salesBreakdown.orderCount,
                expected_cash: expectedCash,
                counted_cash: countedCash,
                difference: difference,
                bills_detail: bills.filter(b => b.count > 0),
                notes: notes
            };

            const { error } = await supabase
                .from('cash_closings')
                .insert([closingData]);

            if (error) throw error;

            toast.success('Cierre de caja guardado correctamente');

            // Imprimir automáticamente
            setTimeout(() => {
                handlePrint();
            }, 500);

        } catch (err: any) {
            console.error('Error saving closing:', err);
            toast.error('Error al guardar cierre: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-orange-500" size={48} />
            </div>
        );
    }

    return (
        <div className="p-6 h-full overflow-y-auto bg-gray-50">
            {/* Ticket oculto para impresión */}
            <div className="hidden">
                <CashClosingTicket
                    ref={printRef}
                    data={{
                        salesBreakdown,
                        expectedCash,
                        countedCash,
                        difference,
                        billsDetail: bills,
                        notes
                    }}
                    companyName={companyName}
                    userName={userProfile?.full_name || session?.user?.email || 'Usuario'}
                    closingDate={new Date()}
                />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <Calculator size={32} className="text-orange-500" />
                    Cierre de Caja
                </h2>
                <div className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('es-AR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </div>
            </div>

            {/* Pasos */}
            <div className="flex gap-2 mb-6">
                {['Resumen', 'Conteo', 'Confirmar'].map((label, idx) => {
                    const stepKeys = ['summary', 'counting', 'review'] as const;
                    const isActive = step === stepKeys[idx];
                    const isPast = stepKeys.indexOf(step) > idx;

                    return (
                        <button
                            key={label}
                            onClick={() => setStep(stepKeys[idx])}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${isActive
                                    ? 'bg-orange-500 text-white shadow-lg'
                                    : isPast
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-white text-gray-400 border'
                                }`}
                        >
                            {isPast && <CheckCircle size={16} className="inline mr-1" />}
                            {idx + 1}. {label}
                        </button>
                    );
                })}
            </div>

            {/* PASO 1: Resumen de Ventas */}
            {step === 'summary' && (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-4 shadow-lg">
                            <p className="text-green-100 text-sm">Total Ventas</p>
                            <p className="text-2xl font-bold">{formatPrice(salesBreakdown.total)}</p>
                            <p className="text-green-100 text-xs mt-1">{salesBreakdown.orderCount} órdenes</p>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow border">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                <DollarSign size={16} className="text-green-500" />
                                Efectivo
                            </div>
                            <p className="text-xl font-bold text-gray-800">{formatPrice(salesBreakdown.cash)}</p>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow border">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                <CreditCard size={16} className="text-blue-500" />
                                Tarjeta
                            </div>
                            <p className="text-xl font-bold text-gray-800">{formatPrice(salesBreakdown.card)}</p>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow border">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                <Wallet size={16} className="text-cyan-500" />
                                MercadoPago
                            </div>
                            <p className="text-xl font-bold text-gray-800">{formatPrice(salesBreakdown.mercadopago)}</p>
                        </div>
                    </div>

                    {/* Desglose detallado */}
                    <div className="bg-white rounded-xl p-6 shadow border">
                        <h3 className="font-bold text-lg mb-4">Desglose por Método de Pago</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Efectivo', amount: salesBreakdown.cash, icon: '💵', color: 'bg-green-500' },
                                { label: 'Tarjeta', amount: salesBreakdown.card, icon: '💳', color: 'bg-blue-500' },
                                { label: 'MercadoPago', amount: salesBreakdown.mercadopago, icon: '📱', color: 'bg-cyan-500' },
                                { label: 'Transferencia', amount: salesBreakdown.transfer, icon: '🏦', color: 'bg-purple-500' },
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="flex-1 text-gray-700">{item.label}</span>
                                    <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full ${item.color}`}
                                            style={{ width: `${salesBreakdown.total > 0 ? (item.amount / salesBreakdown.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <span className="font-bold text-gray-800 w-28 text-right">{formatPrice(item.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={() => setStep('counting')}
                    >
                        Continuar al Conteo →
                    </Button>
                </div>
            )}

            {/* PASO 2: Conteo de Efectivo */}
            {step === 'counting' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl p-6 shadow border">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <DollarSign className="text-green-500" />
                            Conteo de Billetes
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {bills.map((bill, index) => (
                                <div key={bill.denomination} className="bg-gray-50 rounded-lg p-3 border">
                                    <label className="text-sm font-bold text-gray-700 block mb-1">
                                        {bill.label}
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={bill.count || ''}
                                        onChange={(e) => updateBillCount(index, e.target.value)}
                                        placeholder="0"
                                        className="w-full p-2 border rounded-lg text-center text-lg font-bold focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                    />
                                    <p className="text-xs text-gray-400 mt-1 text-center">
                                        = {formatPrice(bill.denomination * bill.count)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resumen del conteo */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl p-6 shadow-lg">
                        <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                                <p className="text-gray-400 text-sm">Esperado (Sistema)</p>
                                <p className="text-2xl font-bold text-green-400">{formatPrice(expectedCash)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Contado</p>
                                <p className="text-2xl font-bold">{formatPrice(countedCash)}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm">Diferencia</p>
                                <p className={`text-2xl font-bold flex items-center justify-center gap-1 ${difference === 0 ? 'text-green-400' : difference > 0 ? 'text-blue-400' : 'text-red-400'
                                    }`}>
                                    {difference > 0 && <TrendingUp size={20} />}
                                    {difference < 0 && <TrendingDown size={20} />}
                                    {difference === 0 && <CheckCircle size={20} />}
                                    {difference >= 0 ? '+' : ''}{formatPrice(difference)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="secondary" size="lg" onClick={() => setStep('summary')}>
                            ← Volver
                        </Button>
                        <Button variant="primary" size="lg" fullWidth onClick={() => setStep('review')}>
                            Revisar Cierre →
                        </Button>
                    </div>
                </div>
            )}

            {/* PASO 3: Confirmación */}
            {step === 'review' && (
                <div className="space-y-6">
                    {/* Alerta de diferencia */}
                    {difference !== 0 && (
                        <div className={`rounded-xl p-4 flex items-start gap-3 ${difference > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'
                            }`}>
                            <AlertTriangle className={difference > 0 ? 'text-blue-500' : 'text-red-500'} size={24} />
                            <div>
                                <p className={`font-bold ${difference > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                                    {difference > 0 ? 'Sobrante detectado' : 'Faltante detectado'}
                                </p>
                                <p className={`text-sm ${difference > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                    Hay una diferencia de {formatPrice(Math.abs(difference))}
                                    {difference > 0 ? ' de más' : ' de menos'} en caja.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Resumen final */}
                    <div className="bg-white rounded-xl p-6 shadow border">
                        <h3 className="font-bold text-lg mb-4">Resumen del Cierre</h3>

                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-600">Total Ventas del Día</span>
                                <span className="font-bold">{formatPrice(salesBreakdown.total)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-600">Órdenes Procesadas</span>
                                <span className="font-bold">{salesBreakdown.orderCount}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-600">Efectivo según Sistema</span>
                                <span className="font-bold">{formatPrice(expectedCash)}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <span className="text-gray-600">Efectivo Contado</span>
                                <span className="font-bold">{formatPrice(countedCash)}</span>
                            </div>
                            <div className={`flex justify-between py-2 font-bold text-lg ${difference === 0 ? 'text-green-600' : difference > 0 ? 'text-blue-600' : 'text-red-600'
                                }`}>
                                <span>Diferencia</span>
                                <span>{difference >= 0 ? '+' : ''}{formatPrice(difference)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="bg-white rounded-xl p-6 shadow border">
                        <h3 className="font-bold text-lg mb-4">Observaciones</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Agregar notas sobre el cierre de caja (opcional)..."
                            rows={3}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        <Button variant="secondary" size="lg" onClick={() => setStep('counting')}>
                            ← Volver
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onClick={handleSaveClosing}
                            isLoading={saving}
                        >
                            <Printer size={18} className="mr-2" />
                            Confirmar e Imprimir
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
