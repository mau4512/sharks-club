'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface EjercicioBiblioteca {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  subcategoria: string | null;
  objetivos: string | null;
  materiales: string[];
  duracion: number | null;
  intensidad: string | null;
  nivel: string | null;
  series: number | null;
  repeticiones: string | null;
  descanso: string | null;
  instrucciones: string | null;
  videoUrl: string | null;
  imagenUrl: string | null;
  consejos: string[];
  variantes: string[];
  esPublico: boolean;
  creadoPor: {
    id: string;
    nombre: string;
    apellidos: string;
  };
}

interface SelectorEjerciciosBibliotecaProps {
  onSeleccionar: (ejercicio: EjercicioBiblioteca) => void;
  onCerrar: () => void;
}

const CATEGORIAS = [
  'Tiro',
  'Defensa',
  'Físico',
  'Técnico',
  'Táctico',
  'Bote',
  'Pase',
  'Rebote',
  'Movilidad',
  'Condicional',
];

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado'];

export default function SelectorEjerciciosBiblioteca({
  onSeleccionar,
  onCerrar,
}: SelectorEjerciciosBibliotecaProps) {
  const [ejercicios, setEjercicios] = useState<EjercicioBiblioteca[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    cargarEjercicios();
  }, [filtroCategoria, filtroNivel]);

  const cargarEjercicios = async () => {
    try {
      setLoading(true);
      let url = '/api/ejercicios-biblioteca?esPublico=true';
      
      if (filtroCategoria) {
        url += `&categoria=${filtroCategoria}`;
      }
      if (filtroNivel) {
        url += `&nivel=${filtroNivel}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setEjercicios(data);
    } catch (error) {
      console.error('Error al cargar ejercicios:', error);
    } finally {
      setLoading(false);
    }
  };

  const ejerciciosFiltrados = ejercicios.filter((ejercicio) => {
    if (!busqueda) return true;
    const terminoBusqueda = busqueda.toLowerCase();
    return (
      ejercicio.nombre.toLowerCase().includes(terminoBusqueda) ||
      (ejercicio.descripcion && ejercicio.descripcion.toLowerCase().includes(terminoBusqueda)) ||
      ejercicio.categoria.toLowerCase().includes(terminoBusqueda)
    );
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Seleccionar Ejercicio de la Biblioteca
            </h2>
            <button
              onClick={onCerrar}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Filtros y búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Buscar</label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todas las categorías</option>
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nivel</label>
              <select
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Todos los niveles</option>
                {NIVELES.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de ejercicios */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">Cargando ejercicios...</div>
          ) : ejerciciosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron ejercicios con los filtros seleccionados
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ejerciciosFiltrados.map((ejercicio) => (
                <div
                  key={ejercicio.id}
                  className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => onSeleccionar(ejercicio)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800">
                      {ejercicio.nombre}
                    </h3>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex gap-2 flex-wrap">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {ejercicio.categoria}
                      </span>
                      {ejercicio.nivel && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                          {ejercicio.nivel}
                        </span>
                      )}
                      {ejercicio.intensidad && (
                        <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs">
                          {ejercicio.intensidad}
                        </span>
                      )}
                    </div>

                    {ejercicio.descripcion && (
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {ejercicio.descripcion}
                      </p>
                    )}

                    <div className="space-y-1 text-xs text-gray-500">
                      {ejercicio.duracion && (
                        <p>⏱️ {ejercicio.duracion} minutos</p>
                      )}

                      {ejercicio.series && (
                        <p>
                          🔢 {ejercicio.series} series
                          {ejercicio.repeticiones && ` × ${ejercicio.repeticiones}`}
                        </p>
                      )}

                      {ejercicio.materiales.length > 0 && (
                        <p>🎯 {ejercicio.materiales.slice(0, 3).join(', ')}</p>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-2">
                      Creado por: {ejercicio.creadoPor.nombre}{' '}
                      {ejercicio.creadoPor.apellidos}
                    </p>
                  </div>

                  <Button className="w-full text-sm py-2">
                    Seleccionar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-end">
            <Button onClick={onCerrar} className="bg-gray-500">
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
