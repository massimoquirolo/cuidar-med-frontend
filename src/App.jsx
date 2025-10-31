// src/App.jsx

import { useState, useEffect, useMemo } from 'react';
//import FormularioMedicamento from './components/FormularioMedicamento';

// [NUEVO] Importamos el formulario
import FormularioMedicamento from './components/FormularioMedicamento';

// (Asegúrate de que tu CSS de App.jsx esté importado si lo tienes en un .css)
// import './App.css'; 

function App() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [medicamentoAEditar, setMedicamentoAEditar] = useState(null);

  // [NUEVO] Estado para guardar el orden. Por defecto, ordenamos por nombre A-Z
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'ascending' });

  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false); // Para el botón

  // --- LÓGICA DE DATOS ---

  // Este useEffect se encarga de buscar los medicamentos
  useEffect(() => {

  // 1. Definimos la función que busca los datos
  // (isInitial) nos dice si es la primera carga o un auto-refresh
  const fetchMedicamentos = async (isInitial = false) => {

    // Solo mostramos "Cargando..." en la carga inicial
    if (isInitial) {
      setIsLoading(true);
    }

    try {
      const response = await fetch('https://cuidar-med-backend.onrender.com/api/medicamentos');

      if (!response.ok) {
        // Si el servidor está despertando, da un error 50x
        if (response.status >= 500 && response.status <= 599) {
          throw new Error('El servidor está despertando... (Error 50x)');
        }
        throw new Error('La respuesta del servidor no fue OK');
      }

      const data = await response.json();
      setMedicamentos(data); // ¡Guardamos los datos!
      setError(null); // ¡Éxito! Limpiamos cualquier error anterior

      // Buscamos también el historial
      const responseHistorial = await fetch('https://cuidar-med-backend.onrender.com/api/historial');
      if (responseHistorial.ok) {
        const dataHistorial = await responseHistorial.json();
        setHistorial(dataHistorial);
      }

    } catch (err) {
      console.error("Error al buscar medicamentos:", err);

      // Solo mostramos el error si es la carga inicial.
      // Si es un auto-refresh, simplemente mantenemos los datos viejos
      // y evitamos un parpadeo de error.
      if (isInitial) {
        setError("Error al cargar datos. El servidor puede estar 'despertando'. Se reintentará automáticamente en 30 segundos...");
      }
    } finally {
      // Solo dejamos de "cargar" en la carga inicial
      if (isInitial) {
        setIsLoading(false);
      }
    }
  };

  // 2. Buscamos los datos la PRIMERA VEZ (marcado como 'true')
  fetchMedicamentos(true);

  // 3. Creamos el "poller" (auto-refresh)
  // Esta vez, llamamos a fetchMedicamentos con 'false'
  const intervalId = setInterval(() => {
    console.log("Auto-actualizando lista de medicamentos...");
    fetchMedicamentos(false); // 'false' = no es la carga inicial
  }, 30000);

  // 4. Limpiamos el intervalo
  return () => clearInterval(intervalId);

}, []); // El [] vacío asegura que esto se configure UNA SOLA VEZ

  // [NUEVO] Lógica de Ordenamiento
  // 'useMemo' es un "hook" de React que memoriza la lista ordenada
  // y solo la vuelve a calcular si 'medicamentos' o 'sortConfig' cambian.
  const sortedMedicamentos = useMemo(() => {
    let sortableMeds = [...medicamentos]; // Creamos una copia

    if (sortConfig.key !== null) {
      sortableMeds.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Tratamiento especial para strings (para que 'Z' no venga antes de 'a')
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        // La lógica de comparación
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0; // Son iguales
      });
    }
    return sortableMeds;
  }, [medicamentos, sortConfig]); // Dependencias: re-ordenar si esto cambia

// [NUEVO] Función que se llamará al hacer clic en una cabecera
const requestSort = (key) => {
  let direction = 'ascending';
  // Si hacemos clic en la misma columna, invertimos el orden
  if (sortConfig.key === key && sortConfig.direction === 'ascending') {
    direction = 'descending';
  }
  setSortConfig({ key, direction });
};

  // --- FUNCIONES DE MANEJO (Handlers) ---

  // [MODIFICADO] handleMedicamentoAgregado - Ahora se llama onFormularioSubmit
  // Esta función ahora maneja tanto "Crear" como "Actualizar"
  const onFormularioSubmit = (medicamentoGuardado) => {
    if (medicamentoAEditar) {
      // Estábamos EDITANDO
      setMedicamentos(medicamentosAnteriores =>
        medicamentosAnteriores.map(med =>
          med._id === medicamentoGuardado._id ? medicamentoGuardado : med
        )
      );
      setMedicamentoAEditar(null); // Limpiamos el modo edición
    } else {
      // Estábamos CREANDO
      setMedicamentos(medicamentosAnteriores => [
        ...medicamentosAnteriores,
        medicamentoGuardado
      ]);
    }
  };

  // [NUEVO] Función para ELIMINAR
  const handleEliminar = async (id) => {
    // Pedimos confirmación
    if (!window.confirm("¿Estás seguro de que quieres eliminar este medicamento?")) {
      return;
    }

    try {
      const response = await fetch(`https://cuidar-med-backend.onrender.com/api/medicamentos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar');
      }

      // Eliminamos el medicamento de nuestra "memoria" (estado)
      setMedicamentos(medicamentosAnteriores =>
        medicamentosAnteriores.filter(med => med._id !== id)
      );

    } catch (err) {
      console.error("Error al eliminar:", err);
      setError(err.message);
    }
  };

  // --- RENDERIZADO (Lo que se dibuja) ---
  return (
    <div className="App">
      <h1>Panel de Control de Medicamentos</h1>

      <button onClick={() => setMostrarHistorial(!mostrarHistorial)} className="btn-toggle-historial">
        {mostrarHistorial ? 'Ocultar Historial' : 'Mostrar Historial de Movimientos'}
      </button>

      {/* --- NUEVA LÓGICA DE CARGA Y ERROR --- */}

      {/* 1. Si está en la CARGA INICIAL... */}
      {isLoading && (
        <div className="mensaje-feedback loading">
          <p>Cargando medicamentos...</p>
          <p>(El servidor gratuito puede tardar 30-40 segundos en despertar...)</p>
        </div>
      )}

      {/* 2. Si hubo un ERROR en la CARGA INICIAL... */}
      {error && isLoading === false && (
        <div className="mensaje-feedback error">
          <p>{error}</p>
        </div>
      )}

      {/* 3. Si NO está cargando y NO hay error, mostramos la app */}
      {/* Usamos un "fragment" (<>) para agrupar la tabla y el form */}
      {!isLoading && (
        <> 
          <table>
            <thead>
              <tr>
                <th>
                  {/* Botón para ordenar por Nombre */}
                  <button type="button" onClick={() => requestSort('nombre')}>
                    Nombre 
                    {/* Símbolo de flecha 🔼 🔽 */}
                    {sortConfig.key === 'nombre' ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : ''}
                  </button>
                </th>
                <th>Dosis</th>
                <th>
                  {/* Botón para ordenar por Stock */}
                  <button type="button" onClick={() => requestSort('stockActual')}>
                    Stock Actual
                    {sortConfig.key === 'stockActual' ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : ''}
                  </button>
                </th>
                <th>Stock Mínimo</th>
                <th>Horarios</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Usamos la lista ORDENADA (sortedMedicamentos) */}
              {sortedMedicamentos.map(med => (
                <tr key={med._id}>
                  {/* Celda Nombre */}
                  <td>{med.nombre}</td>
                  
                  {/* Celda Dosis */}
                  <td>{med.dosis}</td>
                  
                  {/* Celda Stock Actual (con estilo condicional) */}
                  <td style={{ 
                    color: med.stockActual <= med.stockMinimo ? '#d9534f' : 'inherit',
                    fontWeight: med.stockActual <= med.stockMinimo ? 'bold' : 'normal'
                  }}>
                    {med.stockActual}
                  </td>
                  
                  {/* Celda Stock Mínimo */}
                  <td>{med.stockMinimo}</td>
                  
                  {/* Celda Horarios */}
                  <td>{med.horarios.join(', ')}</td>
                  
                  {/* Celda Acciones (SIN el botón "Confirmar Toma") */}
                  <td>
                    <button 
                      className="btn-editar" 
                      onClick={() => setMedicamentoAEditar(med)}
                      disabled={!!medicamentoAEditar} // Deshabilitar si ya estamos editando
                    >
                      Editar
                    </button>
                    <button 
                      className="btn-eliminar" 
                      onClick={() => handleEliminar(med._id)}
                      disabled={!!medicamentoAEditar} // Deshabilitar si estamos editando
                    >
                      Eliminar
                    </button>
                    {/* Aquí puedes añadir el botón de Recargar Stock si lo implementamos */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* El formulario para Agregar/Editar */}
          <FormularioMedicamento
            medicamentoActual={medicamentoAEditar}
            onSubmitCompletado={onFormularioSubmit}
            onCancelarEdicion={() => setMedicamentoAEditar(null)}
          />
        </>
      )}
      {/* --- FIN DE LA LÓGICA DE CARGA --- */}

      {/* [NUEVA TABLA DE HISTORIAL] */}
      {/* Solo se muestra si mostrarHistorial es true */}
      {mostrarHistorial && !isLoading && (
        <div className="historial-container">
          <h2>Últimos Movimientos de Stock</h2>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Medicamento</th>
                <th>Movimiento</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {historial.map(log => (
                <tr key={log._id}>
                  <td>{new Date(log.fecha).toLocaleString('es-AR')}</td>
                  <td>{log.medicamentoNombre}</td>
                  <td style={{ color: log.movimiento > 0 ? 'green' : '#d9534f', fontWeight: 'bold' }}>
                    {log.movimiento > 0 ? `+${log.movimiento}` : log.movimiento}
                  </td>
                  <td>{log.tipo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;