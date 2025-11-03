// src/App.jsx

import { useState, useEffect, useMemo } from 'react';
import FormularioMedicamento from './components/FormularioMedicamento';
import LoginForm from './components/LoginForm';
// 1. Importamos el Toaster y el toast
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
// 2. Importamos el nuevo gráfico
import DashboardChart from './components/DashboardChart';

function App() {
  // Estados de datos
  const [medicamentos, setMedicamentos] = useState([]);
  const [historial, setHistorial] = useState([]);
  
  // Estados de UI (interfaz de usuario)
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [medicamentoAEditar, setMedicamentoAEditar] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'ascending' });
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  
  // Estado de Autenticación
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // --- Funciones de Autenticación ---
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
    // Limpiamos los datos al cerrar sesión
    setMedicamentos([]);
    setHistorial([]);
  };

  // --- Lógica Principal de Carga de Datos ---
  useEffect(() => {
    
    // Si no hay "pase" (token), no hacemos nada.
    if (!token) {
      setIsLoading(false);
      setMedicamentos([]);
      setHistorial([]);
      return;
    }

    // Función para buscar datos (se usa en la carga inicial y en el refresh)
    const fetchMedicamentos = async (isInitial = false) => {
      if (isInitial) setIsLoading(true);
      
      try {
        // Añadimos el "pase" (token) a todas las peticiones
        const commonHeaders = {
          'Authorization': `Bearer ${token}`
        };

        // Petición 1: Medicamentos
        const response = await fetch('https://cuidar-med-backend.onrender.com/api/medicamentos', { 
          headers: commonHeaders 
        });

        // Chequeo de seguridad: si el token es malo, cerramos sesión
        if (response.status === 401 || response.status === 403) {
          throw new Error('Token inválido o expirado');
        }
        if (!response.ok) {
          if (response.status >= 500 && response.status <= 599) {
            throw new Error('El servidor está despertando... (Error 50x)');
          }
          throw new Error('La respuesta del servidor no fue OK');
        }
        
        const data = await response.json();
        setMedicamentos(data);
        setError(null); // Limpiamos errores si la carga fue exitosa

        // Petición 2: Historial
        const responseHistorial = await fetch('https://cuidar-med-backend.onrender.com/api/historial', { 
          headers: commonHeaders 
        });

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
          // Solo mostramos error en la carga inicial
          setError("Error al cargar datos. El servidor puede estar 'despertando'. Se reintentará automáticamente...");
        }
      } finally {
        if (isInitial) setIsLoading(false);
      }
    };

    fetchMedicamentos(true); // Carga inicial
    
    // Auto-refresh cada 30 segundos
    const intervalId = setInterval(() => {
      console.log("Auto-actualizando lista de medicamentos...");
      fetchMedicamentos(false);
    }, 30000);

    // Limpiamos el intervalo al salir
    return () => clearInterval(intervalId);

  }, [token]); // El 'useEffect' DEPENDE del token

  
  // --- Funciones Helpers (para Vencimiento y Ordenamiento) ---
  const getEstiloVencimiento = (fechaVencimiento) => {
    if (!fechaVencimiento) return 'vencimiento-normal';
    const hoy = new Date();
    const fechaVenc = new Date(fechaVencimiento);
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + 30);
    // Reseteamos horas para comparar solo días
    hoy.setHours(0, 0, 0, 0);
    fechaVenc.setHours(0, 0, 0, 0);
    fechaLimite.setHours(0, 0, 0, 0);
    if (fechaVenc < hoy) return 'vencimiento-vencido';
    if (fechaVenc <= fechaLimite) return 'vencimiento-por-vencer';
    return 'vencimiento-normal';
  };

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

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // --- Funciones Handlers (para Formularios y Botones) ---
  const onFormularioSubmit = (medicamentoGuardado) => {
    // Esta función la llama el componente 'FormularioMedicamento'
    if (medicamentoAEditar) {
      setMedicamentos(meds => meds.map(med => med._id === medicamentoGuardado._id ? medicamentoGuardado : med));
      setMedicamentoAEditar(null);
    } else {
      setMedicamentos(meds => [...meds, medicamentoGuardado]);
    }
    // También refrescamos el historial
    fetch('https://cuidar-med-backend.onrender.com/api/historial', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setHistorial(data));
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este medicamento?")) return;

    try {
      const response = await fetch(`https://cuidar-med-backend.onrender.com/api/medicamentos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw new Error('Token inválido o expirado');
        throw new Error('Error al eliminar');
      }

      setMedicamentos(meds => meds.filter(med => med._id !== id));
      toast.success('Medicamento eliminado'); // Notificación Toast

    } catch (err) {
      console.error("Error al eliminar:", err);
      if (err.message === 'Token inválido o expirado') {
        setError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        handleLogout();
      } else {
        toast.error(err.message); // Notificación Toast
      }
    }
  };

  // --- RENDERIZADO (Lo que se dibuja en pantalla) ---
  return (
    <div className="App">
      
      {/* Contenedor de Notificaciones Toast */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#333', color: '#fff' },
        }}
      />

      {/* LÓGICA DE VISTA PRINCIPAL: O LOGIN O LA APP */}
      
      {!token ? (
        // 1. Si NO hay token, mostramos el Login
        <LoginForm setToken={setToken} />
      
      ) : (
        
        // 2. Si SÍ hay token, mostramos la App
        <>
          <div className="header-bar">
            <h1>Panel de Control de Medicamentos</h1>
            <button onClick={handleLogout} className="btn-logout">Cerrar Sesión</button>
          </div>

          <button onClick={() => setMostrarHistorial(!mostrarHistorial)} className="btn-toggle-historial">
            {mostrarHistorial ? 'Ocultar Historial' : 'Mostrar Historial de Movimientos'}
          </button>

          {/* --- AQUÍ VA EL GRÁFICO NUEVO --- */}
          {!isLoading && !error && (
            <DashboardChart data={sortedMedicamentos} />
          )}

          {/* Lógica de Carga y Error */}
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

          {/* Contenido Principal de la App (Tablas y Form) */}
          {!isLoading && (
            <> 
              {/* --- Tabla Principal de Medicamentos --- */}
              <table>
                <thead>
                  <tr>
                    <th>
                      <button type="button" onClick={() => requestSort('nombre')}>
                        Nombre 
                        {sortConfig.key === 'nombre' ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : ''}
                      </button>
                    </th>
                    <th>Dosis</th>
                    <th>
                      <button type="button" onClick={() => requestSort('stockActual')}>
                        Stock Actual
                        {sortConfig.key === 'stockActual' ? (sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽') : ''}
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
                      <td>{med.nombre}</td>
                      <td>{med.dosis}</td>
                      <td style={{ 
                        color: med.stockActual <= med.stockMinimo ? '#d9534f' : 'inherit',
                        fontWeight: med.stockActual <= med.stockMinimo ? 'bold' : 'normal'
                      }}>
                        {med.stockActual}
                      </td>
                      <td>{med.stockMinimo}</td>
                      <td>{med.horarios.join(', ')}</td>
                      <td className={getEstiloVencimiento(med.fechaVencimiento)}>
                        {med.fechaVencimiento 
                          ? new Date(med.fechaVencimiento).toLocaleDateString('es-AR') 
                          : 'N/A'
                        }
                      </td>
                      <td>
                        <button 
                          className="btn-editar" 
                          onClick={() => setMedicamentoAEditar(med)}
                          disabled={!!medicamentoAEditar}
                        >
                          Editar
                        </button>
                        <button 
                          className="btn-eliminar" 
                          onClick={() => handleEliminar(med._id)}
                          disabled={!!medicamentoAEditar}
                        >
                          Eliminar
                        </button>
                        {/* Aquí puedes añadir el botón de Recargar Stock 
                          que implementamos en el Nivel 2. 
                          Tendrías que añadir la función 'handleRecargarStock' arriba.
                        */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* --- Formulario de Agregar/Editar --- */}
              <FormularioMedicamento
                medicamentoActual={medicamentoAEditar}
                onSubmitCompletado={onFormularioSubmit}
                onCancelarEdicion={() => setMedicamentoAEditar(null)}
              />
            </>
          )}

          {/* --- Tabla de Historial (Condicional) --- */}
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
        </>
      )}
    </div>
  );
}

export default App;

