// src/App.jsx

// 1. [NUEVO] Importamos 'useRef' para manejar el audio
import { useState, useEffect } from 'react';
//import FormularioMedicamento from './components/FormularioMedicamento';

// [NUEVO] Importamos el formulario
import FormularioMedicamento from './components/FormularioMedicamento';

// (Asegúrate de que tu CSS de App.jsx esté importado si lo tienes en un .css)
// import './App.css'; 

function App() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [error, setError] = useState(null);

  const [medicamentoAEditar, setMedicamentoAEditar] = useState(null);

  // --- LÓGICA DE DATOS ---

  // Este useEffect se encarga de buscar los medicamentos
  useEffect(() => {
  // 1. Definimos la función que busca los datos
  const fetchMedicamentos = async () => {
    try {
      // Usamos la URL correcta (la de 'cuidar-med-backend')
      const response = await fetch('https://cuidar-med-backend.onrender.com/api/medicamentos');

      if (!response.ok) {
        throw new Error('La respuesta del servidor no fue OK');
      }

      const data = await response.json();
      setMedicamentos(data); // ¡Guardamos los datos en nuestra "memoria"!

    } catch (err) {
      console.error("Error al buscar medicamentos:", err);
      setError(err.message);
    }
  };

  // 2. Buscamos los datos la PRIMERA VEZ (cuando carga la página)
  fetchMedicamentos();

  // 3. [NUEVO] Creamos un "poller" (un vigilante) que busca
  // los datos cada 30 segundos (30000 milisegundos)
  const intervalId = setInterval(() => {
    console.log("Auto-actualizando lista de medicamentos...");
    fetchMedicamentos();
  }, 30000);

  // 4. Limpiamos el intervalo cuando el componente se "desmonta"
  return () => clearInterval(intervalId);

}, []); // El [] vacío asegura que esto se configure UNA SOLA VEZ

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
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {/* La tabla no cambia */}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Dosis</th>
            <th>Stock Actual</th>
            <th>Stock Mínimo</th>
            <th>Horarios</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {medicamentos.map(med => (
            <tr key={med._id}>
              <td>{med.nombre}</td>
              <td>{med.dosis}</td>
              {/* [Estilo Opcional] Pinta el stock en rojo si está bajo */}
              <td style={{ 
                fontWeight: 'bold', 
                color: med.stockActual <= med.stockMinimo ? 'red' : 'inherit' 
              }}>
                {med.stockActual}
              </td>
              <td>{med.stockMinimo}</td>
              <td>{med.horarios.join(', ')}</td>
              <td>
                {/* [NUEVOS BOTONES] */}
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* [MODIFICADO] Pasamos los nuevos "props" al formulario:
        - 'medicamentoActual': el objeto a editar (o null si es nuevo)
        - 'onSubmitCompletado': la función a llamar cuando termina de guardar
        - 'onCancelarEdicion': para limpiar el modo edición
      */}
      <FormularioMedicamento
        medicamentoActual={medicamentoAEditar}
        onSubmitCompletado={onFormularioSubmit}
        onCancelarEdicion={() => setMedicamentoAEditar(null)}
      />
    </div>
  );
}

export default App;