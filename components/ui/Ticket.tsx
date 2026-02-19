import React, { forwardRef } from 'react';

export interface TicketProps {
    order: any;
    companyName?: string;
    table?: any;
}

export const Ticket = forwardRef<HTMLDivElement, TicketProps>(({ order, companyName, table }, ref) => {
    if (!order) return null;

    const paymentMethod = order.payment_type ? order.payment_type.toUpperCase() : 'EFECTIVO';

    // Sort items for consistency
    const sortedItems = [...(order.order_items || [])].sort((a: any, b: any) => {
        const catA = a.product?.category || '';
        const catB = b.product?.category || '';
        const nameA = a.product?.name || '';
        const nameB = b.product?.name || '';

        // Primary sort by category
        const catComparison = catA.localeCompare(catB);
        if (catComparison !== 0) return catComparison;

        // Secondary sort by name
        return nameA.localeCompare(nameB);
    });

    return (
        <div ref={ref} className="hidden print:block p-2 bg-white text-black font-mono text-[12px] w-[58mm] mx-auto leading-normal">
            <style>{`
        @page { 
          margin: 0; 
          size: 58mm auto;
        }
        @media print {
          body { 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          .ticket-dashed {
            border-bottom: 1px dashed black;
          }
        }
      `}</style>

            {/* Header */}
            <div className="text-center mb-2">
                <h2 className="font-bold text-base uppercase leading-tight">
                    {companyName || 'FLUXO'}
                </h2>
                <p className="text-[10px]">
                    {new Date().toLocaleDateString('es-AR')} - {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>

            <div className="border-b-[1px] border-black border-double mb-2"></div>

            {/* Ticket Number */}
            <div className="flex justify-between font-bold text-sm mb-1 uppercase">
                <span>TICKET:</span>
                <span>#{order.ticket_number}</span>
            </div>

            <div className="border-b border-black border-dashed mb-1"></div>

            {/* Type & Payment Info */}
            <div className="mb-1 text-sm font-bold uppercase">
                {order.order_type === 'delivery' ? '[DELIVERY]' : order.order_type === 'takeaway' ? '[P/LLEVAR]' : '[MESA]'}
                {' '}[{paymentMethod}]
            </div>

            <div className="border-b-[1px] border-black border-double mb-2"></div>

            {/* Table info */}
            {(table || order.table) && (
                <div className="mb-2">
                    <p className="font-bold uppercase">MESA: {(table || order.table).name || (table || order.table).id}</p>
                    <div className="border-b border-black border-dashed mt-1"></div>
                </div>
            )}

            {/* Cliente / Dirección */}
            <div className="text-xs uppercase mb-2">
                <p className="font-bold">CLIENTE / DIRECCION:</p>
                <p className="text-sm font-black">{order.client?.name || order.clients?.name || 'Mostrador'}</p>

                {order.delivery_address && (
                    <p className="text-xs mt-0.5 font-bold leading-tight">📍 {order.delivery_address}</p>
                )}

                {(order.delivery_phone || order.client?.phone) && (
                    <div className="mt-1">
                        <p className="font-bold">TELEFONO:</p>
                        <p className="text-sm">{order.delivery_phone || order.client?.phone}</p>
                    </div>
                )}
            </div>

            <div className="border-b-[1px] border-black border-double mb-2"></div>

            {/* Items */}
            <div className="mb-2">
                <ul className="space-y-2">
                    {sortedItems.map((item: any, index: number) => (
                        <li key={index} className="flex flex-col">
                            <div className="flex gap-1 items-start">
                                <span className="font-black text-sm">{item.quantity}</span>
                                <span className="mx-0.5">x</span>
                                <span className="flex-1 text-sm font-black uppercase">
                                    {item.item_name || item.product?.name || item.products?.name || 'Item'}
                                </span>
                            </div>
                            {item.notes && (
                                <span className="text-[10px] ml-6 italic block">
                                    ({item.notes})
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="border-b-[1px] border-black border-double mb-2 mt-2"></div>

            {/* Total */}
            <div className="flex justify-between items-center py-1 font-black text-base">
                <span>TOTAL:</span>
                <span>${Number(order.total || 0).toLocaleString('es-AR')}</span>
            </div>

            <div className="border-b-[1px] border-black border-double mb-3"></div>

            {/* Observaciones (Box for handwritten notes) */}
            <div className="mb-4">
                <p className="text-[10px] font-bold mb-1">OBSERVACIONES:</p>
                <div className="w-full h-16 border border-black border-dashed rounded flex items-center justify-center">
                    {/* Espacio para escribir a mano */}
                </div>
            </div>

            <div className="border-b border-black border-dashed mb-2"></div>

            <div className="text-center font-bold text-[10px] mt-2 pb-8">
                <p>*** FIN DE ORDEN ***</p>
            </div>
        </div>
    );
});

Ticket.displayName = 'Ticket';
