import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { startOfDay, endOfDay } from 'date-fns';
import { 
  BarChart3, Calendar, DollarSign, ShoppingBag, 
  TrendingUp, PieChart as PieIcon, Award 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';

// Colores para el gráfico de torta
const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default: HOY
  const [rawData, setRawData] = useState<any[]>([]);

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
    fetchDailyReport();
  }, [selectedDate]);

  const fetchDailyReport = async () => {
    setLoading(true);
    setRawData([]); // Limpiar estado anterior al cambiar fecha

    try {
      // Calcular rango de fecha local
      const [year, month, day] = selectedDate.split('-').map(Number);
      // Creamos la fecha localmente para asegurar 00:00 a 23:59 del día seleccionado
      const start = new Date(year, month - 1, day, 0, 0, 0).toISOString();
      const end = new Date(year, month - 1, day, 23, 59, 59).toISOString();

      // CONSULTA SUPABASE (Sin comentarios internos)
      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(quantity, price_at_moment, product:products(name, category))`)
        .eq('status', 'completado')
        .gte('created_at', start)
        .lte('created_at', end);

      if (error) throw error;
      if (data) setRawData(data);

    } catch (error) {
      console.error("Error cargando reportes:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. PROCESAMIENTO DE MÉTRICAS (Calculados en cliente) ---
  const metrics = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;

    // A. KPIs Generales
    const totalSales = rawData.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = rawData.length;
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // B. Ventas por Hora (Hora Pico)
    // Inicializamos array de 24hs
    const salesByHourArray = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      sales: 0,
      count: 0
    }));

    rawData.forEach(order => {
      const date = new Date(order.created_at);
      const hour = date.getHours(); // 0 a 23
      if (salesByHourArray[hour]) {
        salesByHourArray[hour].sales += order.total;
        salesByHourArray[hour].count += 1;
      }
    });

    // C. Mix de Pagos (Pie Chart)
    const paymentMap: Record<string, number> = {};
    rawData.forEach(order => {
      const type = order.payment_type ? order.payment_type.toUpperCase() : 'EFECTIVO';
      paymentMap[type] = (paymentMap[type] || 0) + order.total;
    });
    
    const paymentData = Object.keys(paymentMap).map(key => ({
      name: key,
      value: paymentMap[key]
    }));

    // D. Ranking de Productos
    const productMap: Record<string, any> = {};
    
    rawData.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const prodName = item.product?.name || 'Producto eliminado';
        const category = item.product?.category || 'General';
        const qty = item.quantity || 0;
        const total = (item.price_at_moment || 0) * qty;

        if (!productMap[prodName]) {
          productMap[prodName] = { name: prodName, category, quantity: 0, total: 0 };
        }
        productMap[prodName].quantity += qty;
        productMap[prodName].total += total;
      });
    });

    const rankingData = Object.values(productMap)
      .sort((a: any, b: any) => b.quantity - a.quantity) // Ordenar por cantidad desc
      .slice(0, 10); // Top 10

    return {
      totalSales,
      totalOrders,
      avgTicket,
      salesByHourArray,
      paymentData,
      rankingData
    };

  }, [rawData]);

  // --- RENDERIZADO ---
  return (
    <div className="h-full w-full bg-gray-50 overflow-y-auto p-6 animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-orange-600" size={32}/> Reportes y Estadísticas
          </h1>
          <p className="text-gray-500 mt-1">Visión general del rendimiento diario.</p>
        </div>
        
        <div className="bg-white p-2 px-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3">
          <Calendar className="text-gray-400" size={20}/>
          <span className="text-sm font-bold text-gray-600">Fecha:</span>
          <input 
            type="date" 
            className="outline-none font-medium text-gray-800 bg-transparent cursor-pointer"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400">
          <div className="animate-spin mb-4"><BarChart3 size={48} className="opacity-50"/></div>
          <p>Procesando datos...</p>
        </div>
      ) : !metrics || rawData.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 mt-10">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-gray-300"/>
          </div>
          <h3 className="text-xl font-bold text-gray-800">No hay ventas registradas</h3>
          <p className="text-gray-500 mt-1">No se encontraron órdenes completadas para la fecha seleccionada.</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. TARJETAS SUPERIORES (KPIs) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Vendido */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Venta Total</p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">
                  $ {metrics.totalSales.toLocaleString('es-AR')}
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-full text-green-600">
                <DollarSign size={24} />
              </div>
            </div>

            {/* Pedidos */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Pedidos Totales</p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">
                  {metrics.totalOrders}
                </h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                <ShoppingBag size={24} />
              </div>
            </div>

            {/* Ticket Promedio */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Ticket Promedio</p>
                <h3 className="text-3xl font-black text-gray-800 mt-1">
                  $ {Math.round(metrics.avgTicket).toLocaleString('es-AR')}
                </h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>

          {/* 2. GRÁFICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Mix de Pagos (Pie) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <PieIcon size={20} className="text-orange-500"/> Medios de Pago
              </h3>
              <div className="h-64 w-full text-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {metrics.paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => `$ ${value.toLocaleString()}`} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ventas por Hora (Bar) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500"/> Ventas por Hora (Horas Pico)
              </h3>
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.salesByHourArray} margin={{top: 5, right: 20, bottom: 5, left: 0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`}/>
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [
                        name === 'sales' ? `$ ${value.toLocaleString()}` : value, 
                        name === 'sales' ? 'Venta' : 'Pedidos'
                      ]}
                      labelStyle={{color: '#374151', fontWeight: 'bold'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} name="sales" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 3. RANKING DE PRODUCTOS (Tabla) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Award size={20} className="text-yellow-500"/> Top Productos Vendidos
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="p-4 pl-6 w-16 text-center">#</th>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4 text-center">Cantidad</th>
                    <th className="p-4 text-right pr-6">Total Generado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {metrics.rankingData.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 pl-6 text-center font-mono text-gray-400">{index + 1}</td>
                      <td className="p-4 font-bold text-gray-800">{item.name}</td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs border border-gray-200">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6 font-bold text-gray-700">
                        $ {item.total.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}