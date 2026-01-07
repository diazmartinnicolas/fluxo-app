import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { logAction } from '../services/audit';
import { 
  Users, Search, Plus, Trash2, Edit, X, 
  Save, MapPin, Phone, UserCheck, RefreshCw 
} from 'lucide-react';

export default function Customers() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  // Formulario
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  // --- 1. LECTURA (Solo activos) ---
  const fetchClients = async () => {
    setLoading(true);
    try {
      // REGLA SUPABASE: String limpio sin comentarios
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('name');
        
      if (error) throw error;
      if (data) setClients(data);
    } catch (error) {
      console.error("Error cargando clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormData({ name: '', address: '', phone: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      address: client.address || '',
      phone: client.phone || ''
    });
    setIsModalOpen(true);
  };

  // --- 2. LOGICA DE GUARDADO INTELIGENTE ---
  const handleSave = async () => {
    if (!formData.name.trim()) return alert("El nombre es obligatorio.");

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("No usuario");

      if (editingClient) {
        // --- MODO EDICIÓN (Estándar) ---
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', editingClient.id);

        if (error) throw error;
        await logAction('EDITAR_CLIENTE', `Actualizado: ${formData.name}`, 'Clientes');

      } else {
        // --- MODO CREACIÓN (Con lógica de reactivación) ---
        
        // A. Buscar si ya existe (Activo o Inactivo) por nombre
        const { data: existingClients, error: searchError } = await supabase
            .from('clients')
            .select('*')
            .ilike('name', formData.name.trim()); // Case insensitive

        if (searchError) throw searchError;

        const match = existingClients && existingClients.length > 0 ? existingClients[0] : null;

        if (match) {
            // CASO A: Existe y está Activo
            if (match.is_active) {
                alert("⚠️ El cliente ya existe en la base de datos.");
                return;
            } 
            // CASO B: Existe pero está Borrado (Inactivo) -> REACTIVACIÓN
            else {
                const confirmRestore = confirm(`El cliente "${match.name}" estaba en la papelera.\n¿Deseas recuperarlo y actualizar sus datos?`);
                if (!confirmRestore) return;

                const { error: restoreError } = await supabase
                    .from('clients')
                    .update({
                        is_active: true, // Reactivamos
                        address: formData.address, // Actualizamos datos nuevos
                        phone: formData.phone,
                        user_id: user.id
                    })
                    .eq('id', match.id);

                if (restoreError) throw restoreError;
                await logAction('REACTIVAR_CLIENTE', `Recuperado: ${match.name}`, 'Clientes');
                alert("✅ Cliente recuperado exitosamente.");
            }
        } 
        // CASO C: No existe -> Crear Nuevo
        else {
            const { error: insertError } = await supabase
                .from('clients')
                .insert([{ ...formData, user_id: user.id }]);

            if (insertError) throw insertError;
            await logAction('CREAR_CLIENTE', `Nuevo: ${formData.name}`, 'Clientes');
        }
      }

      // Finalización
      fetchClients();
      setIsModalOpen(false);

    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  // --- 3. BORRADO LÓGICO (SOFT DELETE) ---
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar cliente "${name}"?\nSe ocultará de la lista pero se mantendrá el historial de sus pedidos.`)) return;

    try {
      // Actualizamos is_active a false en lugar de borrar la fila
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      
      await logAction('BORRAR_CLIENTE', `Archivado: ${name}`, 'Clientes');
      fetchClients(); // Recargamos la lista (el filtro is_active ocultará este item)
      
    } catch (error: any) {
      alert("Error eliminando: " + error.message);
    }
  };

  // --- FILTRADO LOCAL ---
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Users size={32} className="text-orange-600" /> Cartera de Clientes
          </h2>
          <p className="text-sm text-gray-500 mt-1">Administra la base de datos para delivery y reservas.</p>
        </div>
        <button 
          onClick={handleOpenCreate} 
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 font-bold transition-colors"
        >
          <Plus size={20}/> Nuevo Cliente
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={18} /></div>
            <input 
                type="text" 
                placeholder="Buscar por nombre o teléfono..." 
                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border">
            <UserCheck size={16}/>
            <span>{filteredClients.length} activos</span>
        </div>
      </div>

      {/* TABLA DE CLIENTES */}
      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-4 border-b pl-6">Nombre</th>
              <th className="p-4 border-b">Dirección</th>
              <th className="p-4 border-b">Teléfono</th>
              <th className="p-4 border-b text-right pr-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Cargando clientes...</td></tr>
            ) : filteredClients.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-400">No se encontraron clientes activos.</td></tr>
            ) : (
                filteredClients.map(client => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4 pl-6 font-bold text-gray-800">{client.name}</td>
                        <td className="p-4 text-gray-600">
                            {client.address ? (
                                <span className="flex items-center gap-2"><MapPin size={14} className="text-gray-400"/> {client.address}</span>
                            ) : <span className="text-gray-400 text-xs italic">Sin dirección</span>}
                        </td>
                        <td className="p-4 text-gray-600">
                            {client.phone ? (
                                <span className="flex items-center gap-2"><Phone size={14} className="text-gray-400"/> {client.phone}</span>
                            ) : <span className="text-gray-400 text-xs italic">Sin teléfono</span>}
                        </td>
                        <td className="p-4 text-right pr-6">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleOpenEdit(client)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar"><Edit size={18}/></button>
                                <button onClick={() => handleDelete(client.id, client.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Archivar"><Trash2 size={18}/></button>
                            </div>
                        </td>
                    </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                        <div className="relative">
                            <input 
                                autoFocus
                                type="text" 
                                className="w-full pl-10 p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Ej: Juan Pérez"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Users size={18} /></div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Dirección</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                className="w-full pl-10 p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Ej: Av. Siempreviva 742"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><MapPin size={18} /></div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Teléfono</label>
                        <div className="relative">
                            <input 
                                type="tel" 
                                className="w-full pl-10 p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="Ej: 11 2222 3333"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={18} /></div>
                        </div>
                    </div>

                    {!editingClient && (
                        <div className="bg-blue-50 p-3 rounded-lg flex gap-2 text-xs text-blue-700 border border-blue-100">
                            <RefreshCw size={16} className="flex-shrink-0 mt-0.5"/>
                            <p>Si ingresas el nombre de un cliente que fue borrado anteriormente, el sistema te ofrecerá restaurarlo.</p>
                        </div>
                    )}

                    <button 
                        onClick={handleSave} 
                        className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Save size={20}/> Guardar Cliente
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}