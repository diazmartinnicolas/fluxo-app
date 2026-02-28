import { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { logAction } from '../services/audit';
import { z } from 'zod';
import { ProductSchema } from '../schemas/products';
import {
  Package, Plus, Search, Edit, Trash2, X,
  Save, AlertCircle, CheckCircle, Filter, Upload, RefreshCw
} from 'lucide-react';
import { TableRowSkeleton } from './ui/Skeleton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Categorías del sistema
const CATEGORIES = [
  'Pizzas', 'Mitades', 'Milanesas', 'Hamburguesas',
  'Empanadas', 'Ensaladas', 'Bebidas', 'Postres', 'Otros'
];

// 👇 1. Definimos que este componente acepta una función de aviso
interface InventoryProps {
  onProductUpdate?: () => void;
}

export default function Inventory({ onProductUpdate }: InventoryProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Pizzas',
    price: 0,
    active: true,
    is_favorite: false
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Filtramos explícitamente los no borrados para asegurar la consistencia
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({ name: '', category: 'Pizzas', price: 0, active: true, is_favorite: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      active: product.active,
      is_favorite: product.is_favorite || false
    });
    setIsModalOpen(true);
  };

  // Búscala dentro de src/components/Inventory.tsx y reemplázala por esta versión:

  const handleSave = async () => {
    try {
      // 1. Validación de formulario
      ProductSchema.parse(formData);

      if (editingProduct) {
        // --- MODO EDICIÓN (Normal) ---
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        await logAction('EDITAR_PROD', `Producto: ${formData.name}`, 'Inventario');
        toast.success("Producto actualizado");

      } else {
        // --- MODO CREACIÓN (Con Truco de Reciclaje) ---

        // Paso A: Verificamos si ya existe ese nombre (incluso si está borrado)
        const { data: existingProduct, error: searchError } = await supabase
          .from('products')
          .select('*')
          .eq('name', formData.name) // Buscamos coincidencia exacta de nombre
          .maybeSingle(); // Usamos maybeSingle para que no de error si no encuentra nada

        if (searchError) throw searchError;

        if (existingProduct) {
          // Paso B: Si existe...
          if (existingProduct.deleted_at) {
            // ...y está borrado: ¡LO REVIVIMOS! 🧟‍♂️
            // Confirmamos si el usuario quiere restaurarlo o lo hacemos silencioso
            // Aquí lo hacemos automático para mejor experiencia:
            const { error } = await supabase
              .from('products')
              .update({
                ...formData,       // Ponemos los nuevos datos (precio, cat, etc)
                deleted_at: null,  // Quitamos la marca de borrado
                active: true       // Lo activamos
              })
              .eq('id', existingProduct.id);

            if (error) throw error;
            await logAction('RESTAURAR_PROD', `Restaurado: ${formData.name}`, 'Inventario');
            toast.info(`♻️ El producto "${formData.name}" existía en la papelera y ha sido recuperado.`);

          } else {
            // ...y está activo: Es un duplicado real. Error.
            toast.error("¡Ya existe un producto activo con este nombre!");
            return; // Salir de la función si hay un duplicado activo
          }
        } else {
          // Paso C: No existe nada, creamos uno nuevo (Normal)
          const { error } = await supabase
            .from('products')
            .insert([formData]);

          if (error) throw error;
          await logAction('CREAR_PROD', `Nuevo: ${formData.name}`, 'Inventario');
          toast.success("Producto creado con éxito");
        }
      }

      // Finalizar: Recargamos todo
      fetchProducts();
      setIsModalOpen(false);

      // Avisamos a App.tsx
      if (onProductUpdate) onProductUpdate();

    } catch (error: any) {
      // Manejo de errores
      if (error instanceof z.ZodError) {
        toast.error("⚠️ Validación: " + error.issues[0].message);
      } else {
        console.error("Error guardando:", error);
        // Si el error es de duplicado (por si acaso falló nuestra lógica anterior), lo traducimos
        if (error.message.includes('unique constraint') || error.code === '23505') {
          toast.error("⚠️ Error: Ya existe un producto con ese nombre exacto.");
        } else {
          toast.error("Error: " + error.message);
        }
      }
    }
  };

  // --- SOFT DELETE CORREGIDO ---
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;

    // 👇 3. ACTUALIZACIÓN OPTIMISTA (VISUAL INSTANTÁNEA)
    // Borramos el item de la lista visualmente ANTES de que termine la base de datos.
    // Esto hace que se sienta super rápido y arregla el "no se borra".
    setProducts(current => current.filter(p => p.id !== id));

    try {
      const { error } = await supabase
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      await logAction('BORRAR_PROD', `Eliminado (Soft): ${name}`, 'Inventario');
      toast.success("Producto eliminado");

      // 👇 4. AVISAMOS A LA APP PRINCIPAL
      if (onProductUpdate) onProductUpdate();

    } catch (error: any) {
      toast.error("Error eliminando: " + error.message);
      // Si falló, volvemos a cargar la lista real para deshacer el cambio visual
      fetchProducts();
    }
  };

  // --- IMPORTADOR DE PRECIOS DESDE HTML ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      const extractedItems: { title: string, desc: string, prices: number[], originalText: string, category: string }[] = [];
      let currentCategory = "General";

      const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null);
      let node;
      while ((node = walker.nextNode() as Element)) {
        if (node.tagName.startsWith('H') || node.classList.contains('section-title') || node.classList.contains('empanadas-title')) {
          currentCategory = node.textContent?.trim().toLowerCase() || currentCategory;
          continue;
        }

        if (node.classList.contains('menu-item') || node.classList.contains('item-row')) {
          const nameEl = node.querySelector('.item-name');
          if (!nameEl) continue;

          const name = nameEl.textContent?.trim() || "";
          let desc = "";
          const descEl = node.closest('.menu-item')?.querySelector('.item-desc') || node.querySelector('.item-desc');
          if (descEl) desc = descEl.textContent?.trim() || "";

          const prices: number[] = [];
          const priceContainer = node.querySelector('.item-prices');
          if (priceContainer) {
            const tw = document.createTreeWalker(priceContainer, NodeFilter.SHOW_TEXT, null);
            let tn;
            while ((tn = tw.nextNode())) {
              const txt = tn.nodeValue || "";
              const matches = [...txt.matchAll(/\d{1,3}(?:\.\d{3})+/g)];
              for (const m of matches) prices.push(parseInt(m[0].replace(/\./g, ''), 10));
            }
          } else {
            const txt = nameEl.parentElement?.textContent || "";
            const m = txt.match(/\d{1,3}(?:\.\d{3})+/);
            if (m && !name.includes(m[0])) prices.push(parseInt(m[0].replace(/\./g, ''), 10));
          }

          if (prices.length > 0) {
            if (!extractedItems.some(i => i.title === name && i.category === currentCategory)) {
              extractedItems.push({ title: name, desc, prices, originalText: name.toLowerCase(), category: currentCategory });
            }
          }
        }
      }

      // 2. Extraer empanadas separadas por comas (.empanadas-list)
      doc.querySelectorAll('.empanadas-box').forEach(box => {
        let cat = "empanadas";
        const titleEl = box.querySelector('.empanadas-title') || box.querySelector('div[style*="font-weight: 700"]');
        if (titleEl) cat = titleEl.textContent?.trim().toLowerCase() || cat;

        box.querySelectorAll('.empanadas-list').forEach(listEl => {
          let prices: number[] = [];
          let next = listEl.nextElementSibling;
          while (next) {
            if (next.classList.contains('empanadas-prices')) {
              const tw = document.createTreeWalker(next, NodeFilter.SHOW_TEXT, null);
              let tn;
              while ((tn = tw.nextNode())) {
                const txt = tn.nodeValue || "";
                const matches = [...txt.matchAll(/\d{1,3}(?:\.\d{3})+/g)];
                for (const m of matches) prices.push(parseInt(m[0].replace(/\./g, ''), 10));
              }
              break;
            }
            next = next.nextElementSibling;
          }

          if (prices.length > 0) {
            const items = (listEl.textContent || "").split(/[,y]/).map(s => s.trim()).filter(s => s.length > 3);
            items.forEach(iName => {
              extractedItems.push({ title: iName, desc: '', prices, originalText: iName.toLowerCase(), category: cat });
            });
          }
        });
      });

      const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

      const updates: { id: string, name: string, oldPrice: number, newPrice: number }[] = [];

      for (const product of products) {
        const pDbName = normalize(product.name);
        if (!pDbName) continue;

        const pDbOrig = product.name.toLowerCase();
        const pCat = (product.category || "").toLowerCase();

        let bestMatch = null;
        let bestScore = 0;

        for (const ext of extractedItems) {
          const eExtName = normalize(ext.title);
          const eExtDesc = normalize(ext.desc);
          const eCat = normalize(ext.category);

          // Validar Categorías
          let catOk = false;
          if (pCat.includes('bebida') && (eCat.includes('bebida') || eCat.includes('cerveza') || eCat.includes('vino'))) catOk = true;
          if (pCat.includes('pizza') && (eCat.includes('tradicionales') || eCat.includes('especiales') || eCat.includes('rellenas'))) catOk = true;
          if (pCat.includes('empanada') && (eCat.includes('empanada') || eCat.includes('canastita') || eCat.includes('clasicas'))) catOk = true;
          if (pCat.includes('milanesa') || pCat.includes('comida') || pCat.includes('hamburguesa') || pCat.includes('burger')) {
            if (eCat.includes('comida') || eCat.includes('burger') || eCat.includes('panini')) catOk = true;
          }
          if (!catOk && eCat !== "general") continue;

          let score = 0;

          // Checkeo de Tokens
          // Checkeo de Tokens
          const pTokens = pDbOrig.replace(/[^a-záéíóúñ0-9\s]/g, "").split(/\s+/).filter(w => w.length > 3);
          let subMatches = 0;
          pTokens.forEach(t => { if (eExtName.includes(normalize(t))) subMatches++; });
          score += subMatches * 15;

          // Inclusión Directa
          if (pDbName.includes(eExtName) || eExtName.includes(pDbName)) {
            score += 50;
            if (pDbName === eExtName) score += 100;
          }

          // Penalizaciones y Premios Estrictos de Tamaño
          const pIsGde = pDbOrig.includes('gde') || pDbOrig.includes('grande') || pDbOrig.includes('fami');
          const extIsGde = eExtName.includes('gde') || eExtName.includes('grande') || eExtDesc.includes('gde') || eExtDesc.includes('grande');

          const pIsChica = pDbOrig.includes('indiv') || pDbOrig.includes('chica') || pDbOrig.includes('peque') || pDbOrig.includes('med');
          const extIsChica = eExtName.includes('indiv') || eExtName.includes('chica') || eExtDesc.includes('indiv') || eExtDesc.includes('chica') || eExtName.includes('med');

          // "Doble" es una variante, no un tamaño (Pizza Muzzarella vs Pizza Muzzarella Doble)
          const pIsDoble = pDbOrig.includes('doble');
          const extIsDoble = eExtName.includes('doble') || eExtDesc.includes('doble');
          if (pIsDoble && extIsDoble) score += 150;
          if (pIsDoble && !extIsDoble) score -= 150;
          if (!pIsDoble && extIsDoble) score -= 150;

          if (pIsGde && extIsGde) score += 200;
          if (pIsGde && extIsChica) score -= 200;
          if (pIsChica && extIsChica) score += 200;
          if (pIsChica && extIsGde) score -= 200;

          const pIs1L = pDbOrig.includes('1l') || pDbOrig.includes('1 l') || pDbOrig.includes('1 litro');
          const extIs1L = eExtName.includes('1l') || eExtName.includes('1 l') || eExtName.includes('1 litro');
          const pIsLata = pDbOrig.includes('lata');
          const extIsLata = eExtName.includes('lata');
          const pIs15 = pDbOrig.includes('1.5') || pDbOrig.includes('1,5');
          const extIs15 = eExtName.includes('1.5') || eExtName.includes('15') || eExtName.includes('1 5');

          if (pIs1L && extIs1L) score += 200;
          if (pIs1L && !extIs1L) score -= 200;
          if (pIsLata && extIsLata) score += 200;
          if (pIsLata && !extIsLata) score -= 200;
          if (pIs15 && extIs15) score += 200;
          if (pIs15 && !extIs15) score -= 200;

          if (score > 30 && score > bestScore) {
            bestScore = score;
            bestMatch = ext;
          }
        }

        if (bestMatch && bestMatch.prices.length > 0) {
          let newPrice = bestMatch.prices[0];

          if (bestMatch.prices.length >= 2) {
            if (pDbOrig.includes('gde') || pDbOrig.includes('grande') || pDbOrig.includes('fami')) {
              newPrice = bestMatch.prices[1];
            } else {
              // Default para 'mediana', 'individual', o sin especificar (ej: 'Muzzarella Doble')
              newPrice = bestMatch.prices[0];
            }

            // Si la propia base de datos no especifica tamaño pero es Pizza/Empanada
            if (bestMatch.prices.length === 3) {
              if (pDbOrig.includes('docena') && !pDbOrig.includes('media') && !pDbOrig.includes('1/2')) newPrice = bestMatch.prices[2];
              else if (pDbOrig.includes('media') || pDbOrig.includes('1/2')) newPrice = bestMatch.prices[1];
              else newPrice = bestMatch.prices[0];
            }
          }

          if (newPrice > 0 && newPrice !== product.price) {
            updates.push({ id: product.id, name: product.name, oldPrice: product.price, newPrice });
          }
        }
      }

      if (updates.length > 0) {
        const confirmMsg = updates.slice(0, 10).map(u => `${u.name}: $${u.oldPrice} ➔ $${u.newPrice}`).join('\n');
        const extraMsg = updates.length > 10 ? `\n... y ${updates.length - 10} más.` : '';

        if (confirm(`Se encontraron ${updates.length} actualizaciones de precio en el archivo HTML:\n\n${confirmMsg}${extraMsg}\n\n¿Deseas aplicar estos nuevos precios al Inventario?`)) {
          let successCount = 0;
          for (const upd of updates) {
            const { error } = await supabase.from('products').update({ price: upd.newPrice }).eq('id', upd.id);
            if (!error) successCount++;
          }
          toast.success(`Se actualizaron ${successCount} precios correctamente.`);
          await logAction('EDITAR_PROD', `Importación HTML masiva: ${successCount} precios`, 'Inventario');
          fetchProducts();
        } else {
          toast.info('Actualización cancelada');
        }
      } else {
        toast.warning('No se encontraron productos coincidentes o todos los precios ya están actualizados.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Error al procesar el archivo HTML: ' + e.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- FILTRADO Y PAGINACIÓN ---
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Volver a la página 1 si busco algo
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <Package size={32} className="text-orange-500" /> Inventario de Productos
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gestiona tu carta, precios y disponibilidad.</p>
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            accept=".html"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 font-bold transition-colors disabled:opacity-50"
            title="Sube el archivo HTML de tu carta web para actualizar precios automáticamente"
          >
            {importing ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
            <span className="hidden sm:inline">Importar Carta HTML</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2 font-bold transition-colors"
          >
            <Plus size={20} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={18} /></div>
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border">
          <Filter size={16} />
          <span>{filteredProducts.length} productos</span>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="p-4 border-b">Nombre</th>
              <th className="p-4 border-b">Categoría</th>
              <th className="p-4 border-b">Precio</th>
              <th className="p-4 border-b text-center">Estado</th>
              <th className="p-4 border-b text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <>
                <TableRowSkeleton cols={5} />
                <TableRowSkeleton cols={5} />
                <TableRowSkeleton cols={5} />
                <TableRowSkeleton cols={5} />
                <TableRowSkeleton cols={5} />
              </>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-medium italic">Sin productos.</td></tr>
            ) : (
              <AnimatePresence mode="popLayout">
                {paginatedProducts.map((p) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    <td className="p-4 font-medium text-gray-800">{p.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-bold text-gray-600 border border-gray-200">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-700">${p.price}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${p.active ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                        {p.active ? 'Activo' : 'Pausado'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(p.id, p.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table >
      </div >

      {/* CONTROLES DE PAGINACIÓN */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                // Simple windowing logic
                if (totalPages > 5) {
                  if (currentPage > 3) pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                }
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-orange-600 text-white' : 'hover:bg-gray-100'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {
        isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Producto</label>
                  <input
                    autoFocus
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Pizza Muzzarella"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Categoría</label>
                    <select
                      className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Precio</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                      <input
                        type="number"
                        className="w-full pl-8 p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      checked={formData.active}
                      onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-700">Disponible para venta</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-500"
                      checked={formData.is_favorite}
                      onChange={e => setFormData({ ...formData, is_favorite: e.target.checked })}
                    />
                    <span className="text-sm font-medium text-gray-700">Destacado (Estrella)</span>
                  </label>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full mt-4 bg-gray-900 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Guardar Producto
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}