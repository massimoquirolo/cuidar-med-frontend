// src/App.jsx

import { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast'; // Para notificaciones
import FormularioMedicamento from './components/FormularioMedicamento';
import LoginForm from './components/LoginForm';
import DashboardChart from './components/DashboardChart'; // Gráfico principal
import HistoryChartModal from './components/HistoryChartModal'; // ¡NUEVO! Modal de historial

function App() {
  // Estados de datos
  const [medicamentos, setMedicamentos] = useState([]);
  const [historial, setHistorial] = useState([]);

  // Estados de UI (interfaz)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'ascending' });
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  
  // Estados de Modales
  const [medicamentoAEditar, setMedicamentoAEditar] = useState(null);
  const [selectedMedHistorial, setSelectedMedHistorial] = useState(null); // <-- NUEVO (para el modal de gráfico)

  // Estado de Autenticación
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // --- 1. FUNCIONES DE AUTENTICACIÓN ---
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
    setMedicamentos([]);
    setHistorial([]);
    toast.success('Sesión cerrada');
  };

  // --- 2. LÓGICA PRINCIPAL DE DATOS (useEffect) ---
  useEffect(() => {
    // Si no hay "pase" (token), no hacemos nada.
    if (!token) {
      setIsLoading(false);
      setMedicamentos([]);
      setHistorial([]);
      return;
    }

    // Función para buscar todos los datos del backend
    const fetchDatos = async (isInitial = false) => {
      if (isInitial) setIsLoading(true);
      
      try {
        const commonHeaders = { 'Authorization': `Bearer ${token}` };

        // Petición 1: Medicamentos
        const responseMeds = await fetch('https://cuidar-med-backend.vercel.app/api/medicamentos', { headers: commonHeaders });

        // Chequeo de seguridad: si el token es malo, cerramos sesión
        if (responseMeds.status === 401 || responseMeds.status === 403) {
          throw new Error('Token inválido o expirado');
        }
        if (!responseMeds.ok) {
          if (responseMeds.status >= 500 && responseMeds.status <= 599) {
            throw new Error('El servidor está despertando... (Error 50x)');
          }
          throw new Error('La respuesta del servidor no fue OK');
        }
        
        const dataMeds = await responseMeds.json();
        setMedicamentos(dataMeds);
        setError(null); // Limpiamos errores si la carga fue exitosa

        // Petición 2: Historial
        const responseHistorial = await fetch('https://cuidar-med-backend.vercel.app/api/historial', { headers: commonHeaders });
        if (responseHistorial.ok) {
          const dataHistorial = await responseHistorial.json();
          setHistorial(dataHistorial);
        }

      } catch (err) {
        console.error("Error al buscar datos:", err);
        if (err.message === 'Token inválido o expirado') {
          setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
          handleLogout(); // Forzamos el cierre de sesión
        } else if (isInitial) {
          setError("Error al cargar datos. El servidor puede estar 'despertando'. Se reintentará automáticamente...");
        }
      } finally {
        if (isInitial) setIsLoading(false);
      }
    };

    fetchDatos(true); // Carga inicial
    
    // Auto-refresh cada 30 segundos
    const intervalId = setInterval(() => { fetchDatos(false); }, 30000);
    // Limpieza al desmontar
    return () => clearInterval(intervalId);

  }, [token]); // El 'useEffect' se re-ejecuta si el token cambia (al loguearse)

  
  // --- 3. FUNCIONES "HELPER" (Ayudantes de renderizado) ---

  // Devuelve un estilo CSS según la fecha de vencimiento
  const getEstiloVencimiento = (fechaVencimiento) => {
    if (!fechaVencimiento) return 'vencimiento-normal';
    const hoy = new Date();
    const fechaVenc = new Date(fechaVencimiento);
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + 30);
    hoy.setHours(0, 0, 0, 0);
    fechaVenc.setHours(0, 0, 0, 0);
    fechaLimite.setHours(0, 0, 0, 0);
    if (fechaVenc < hoy) return 'vencimiento-vencido';
    if (fechaVenc <= fechaLimite) return 'vencimiento-por-vencer';
    return 'vencimiento-normal';
  };

  // Memoriza la lista ordenada de medicamentos
  const sortedMedicamentos = useMemo(() => {
    let sortableMeds = [...medicamentos];
    if (sortConfig.key !== null) {
      sortableMeds.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableMeds;
  }, [medicamentos, sortConfig]);

  // Actualiza el estado de la configuración de orden
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // --- 4. FUNCIONES "HANDLER" (Manejadores de eventos) ---

  // Se llama cuando el Formulario (hijo) guarda o edita
  const onFormularioSubmit = (medicamentoGuardado) => {
    if (medicamentoAEditar) {
      // Actualiza un item en la lista
      setMedicamentos(meds => meds.map(med => med._id === medicamentoGuardado._id ? medicamentoGuardado : med));
      setMedicamentoAEditar(null);
    } else {
      // Añade un item nuevo a la lista
      setMedicamentos(meds => [...meds, medicamentoGuardado]);
    }
    
    // [IMPORTANTE] Refrescamos el historial después de un cambio
    fetch('https://cuidar-med-backend.vercel.app/api/historial', { 
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setHistorial(data))
      .catch(err => console.error("Error refrescando historial post-submit:", err));
  };

  // Maneja el clic en el botón "Eliminar"
  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este medicamento?")) return;

    try {
      const response = await fetch(`https://cuidar-med-backend.vercel.app/api/medicamentos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json(); // Leemos la respuesta (éxito o error)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error('Token inválido o expirado');
        throw new Error(data.mensaje || 'Error al eliminar');
      }

      // Actualizamos el estado local (quitamos el med de la lista)
      setMedicamentos(meds => meds.filter(med => med._id !== id));
      toast.success(data.mensaje || 'Medicamento eliminado'); // Notificación Toast

    } catch (err) {
      console.error("Error al eliminar:", err);
      if (err.message === 'Token inválido o expirado') {
        setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        handleLogout();
      } else {
        toast.error(err.message); // Notificación Toast de error
      }
    }
  };

  // --- 5. RENDERIZADO (El JSX que se dibuja) ---
  return (
    <div className="App">
      {/* Contenedor de Notificaciones Toast (invisible) */}
      <Toaster position="top-right" />

      {/* --- VISTA LOGIN O VISTA APP --- */}
      {!token ? (
        
        // VISTA 1: Usuario NO logueado
        <LoginForm setToken={setToken} />

      ) : (
        
        // VISTA 2: Usuario SÍ logueado
        <>
          {/* Cabecera con Título y botón Logout */}
          <div className="header-bar">
            <h1>Panel de Control de Medicamentos</h1>
            <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
          </div>

          {/* Botón para mostrar/ocultar historial */}
          <button onClick={() => setMostrarHistorial(!mostrarHistorial)} className="btn-toggle-historial">
            {mostrarHistorial ? 'Ocultar Historial' : 'Mostrar Historial de Movimientos'}
          </button>

          {/* Gráfico Principal (solo si no está cargando ni hay error) */}
          {!isLoading && !error && (
            <DashboardChart data={sortedMedicamentos} />
          )}

          {/* Tabla de Historial (movida arriba) */}
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

          {/* Mensajes de Carga y Error */}
          {isLoading && (
            <div className="mensaje-feedback loading">
              <p>Cargando medicamentos...</p>
              <p>(El servidor gratuito puede tardar 30-40 segundos en despertar...)</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="mensaje-feedback error">
              <p>{error}</p>
            </div>
          )}

          {/* Contenido Principal (Tabla de Meds y Formulario) */}
          {!isLoading && (
            <> 
              <table>
                <thead>
                  <tr>
                    <th>
                      <button type="button" onClick={() => requestSort('nombre')}>
                        Nombre {sortConfig.key === 'nombre' ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : ''}
                      </button>
                    </th>
                    <th>Dosis</th>
                    <th>
                      <button type="button" onClick={() => requestSort('stockActual')}>
                        Stock Actual {sortConfig.key === 'stockActual' ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : ''}
                      </button>
                    </th>
                    <th>
                      <button type="button" onClick={() => requestSort('diasRestantes')}>
                        Días Rest. {sortConfig.key === 'diasRestantes' ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : ''}
                      </button>
                    </th>
                    <th>Stock Mínimo</th>
                    <th>Horarios</th>
                    <th>Vencimiento</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMedicamentos.map(med => (
                    <tr key={med._id}>
                      {/* [NUEVO] Botón en el nombre para abrir el modal */}
                      <td className="td-clickable">
                        <button onClick={() => setSelectedMedHistorial(med)}>
                          {med.nombre}
                        </button>
                      </td>
                      <td>{med.dosis}</td>
                      <td style={{ color: med.stockActual <= med.stockMinimo ? '#d9534f' : 'inherit', fontWeight: med.stockActual <= med.stockMinimo ? 'bold' : 'normal', textAlign: 'center' }}>
                        {med.stockActual}
                      </td>
                      <td style={{ color: med.diasRestantes <= 10 ? '#d9534f' : 'inherit', fontWeight: med.diasRestantes <= 10 ? 'bold' : 'normal', textAlign: 'center' }}>
                        {med.diasRestantes}
                      </td>
                      <td style={{ textAlign: 'center' }}>{med.stockMinimo}</td>
                      <td>{med.horarios.join(', ')}</td>
                      <td className={getEstiloVencimiento(med.fechaVencimiento)}>
                        {med.fechaVencimiento ? new Date(med.fechaVencimiento).toLocaleDateString('es-AR') : 'N/A'}
                      </td>
                      <td>
                        <button className="btn-editar" onClick={() => setMedicamentoAEditar(med)} disabled={!!medicamentoAEditar}>Editar</button>
                        <button className="btn-eliminar" onClick={() => handleEliminar(med._id)} disabled={!!medicamentoAEditar}>Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <FormularioMedicamento
                medicamentoActual={medicamentoAEditar}
                onSubmitCompletado={onFormularioSubmit}
                onCancelarEdicion={() => setMedicamentoAEditar(null)}
              />
            </>
          )}

          {/* [NUEVO] Renderizado del Modal (se muestra cuando selectedMedHistorial no es null) */}
          {selectedMedHistorial && (
            <HistoryChartModal
              medicamento={selectedMedHistorial}
              historial={historial}
              onClose={() => setSelectedMedHistorial(null)}
            />
          )}

        </>
      )}
    </div>
  );
}

export default App;