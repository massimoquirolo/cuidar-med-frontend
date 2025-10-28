// src/App.jsx

// 1. [NUEVO] Importamos 'useRef' para manejar el audio
import { useState, useEffect, useRef } from 'react';
//import FormularioMedicamento from './components/FormularioMedicamento';
import ModalAlarma from './components/ModalAlarma'; // <-- 1. [NUEVO] Importamos el Modal
// [NUEVO] Importamos el formulario
import FormularioMedicamento from './components/FormularioMedicamento';

// (Asegúrate de que tu CSS de App.jsx esté importado si lo tienes en un .css)
// import './App.css'; 

function App() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [error, setError] = useState(null);
  const [alarmaActiva, setAlarmaActiva] = useState(null);

  // [NUEVO] Estados para controlar las alarmas ya confirmadas
  // Guardamos el último minuto que revisamos
  const [ultimoMinutoRevisado, setUltimoMinutoRevisado] = useState(null);
  // Guardamos los IDs de las alarmas que ya confirmamos en este minuto
  const [idsConfirmadosEnMinuto, setIdsConfirmadosEnMinuto] = useState([]);

  const [medicamentoAEditar, setMedicamentoAEditar] = useState(null);

  // 3. [NUEVO] Referencia al elemento de audio
  // Usamos useRef para poder darle "play" o "pause" desde código
  const audioRef = useRef(null);

  // --- LÓGICA DE DATOS ---

  // Este useEffect (fetchMedicamentos) no cambia
  useEffect(() => {
    const fetchMedicamentos = async () => {
      try {
        const response = await fetch('https://cuidarmed-backend.onrender.com/api/medicamentos');
        if (!response.ok) {
          throw new Error('La respuesta del servidor no fue OK');
        }
        const data = await response.json();
        setMedicamentos(data);
      } catch (err) {
        console.error("Error al buscar medicamentos:", err);
        setError(err.message);
      }
    };
    fetchMedicamentos();
  }, []);


  // 4. [NUEVO] El "VIGILANTE" - Este es el corazón de las alarmas
  useEffect(() => {
    // Inicia un intervalo que se ejecuta cada segundo
    const intervalId = setInterval(() => {
      // Obtenemos la hora y minuto actual
      const ahora = new Date();
      const horaActual = ahora.getHours().toString().padStart(2, '0');
      const minutoActual = ahora.getMinutes().toString().padStart(2, '0');
      const tiempoActual = `${horaActual}:${minutoActual}`; // Formato "HH:MM"

      // [NUEVO] Si el minuto cambió, reiniciamos la lista de "confirmados"
      if (tiempoActual !== ultimoMinutoRevisado) {
        setUltimoMinutoRevisado(tiempoActual);
        setIdsConfirmadosEnMinuto([]); // Limpiamos la lista
      }

      // Si ya hay una alarma sonando, no hacemos nada.
      if (alarmaActiva) {
        return;
      }

      // [MODIFICADO] Buscamos un medicamento que:
      // 1. Tenga un horario que coincida
      // 2. NO esté en nuestra lista de confirmados de este minuto
      const medicamentoQueSuena = medicamentos.find(med =>
        med.horarios.includes(tiempoActual) && 
        !idsConfirmadosEnMinuto.includes(med._id) // <--- ¡La lógica clave!
      );

      // Si encontramos uno...
      if (medicamentoQueSuena) {
        setAlarmaActiva(medicamentoQueSuena); // ¡Activamos la alarma!
        audioRef.current?.play();
      }

    }, 1000); // Se sigue ejecutando cada segundo

    return () => clearInterval(intervalId);

  // [MODIFICADO] Añadimos las nuevas dependencias al useEffect
  }, [medicamentos, alarmaActiva, ultimoMinutoRevisado, idsConfirmadosEnMinuto]);


  // --- FUNCIONES DE MANEJO (Handlers) ---

  // 5. [MODIFICADO] handleConfirmarToma
  const handleConfirmarToma = async (id) => {
    if (medicamentoAEditar) return;
    
    // Detenemos la alarma
    if (alarmaActiva) {
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
      setAlarmaActiva(null);
    }

    // [NUEVO] Añadimos el ID de este medicamento a la lista de "confirmados"
    // para que el vigilante no lo vuelva a encontrar en este minuto.
    setIdsConfirmadosEnMinuto(prevIds => [...prevIds, id]);

    // El resto de la lógica de API es la misma
    try {
      const response = await fetch('https://cuidarmed-backend.onrender.com/api/tomas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicamentoId: id }),
      });

      if (!response.ok) {
        throw new Error('Error al confirmar la toma');
      }

      const medicamentoActualizado = await response.json();

      setMedicamentos(medicamentosAnteriores =>
        medicamentosAnteriores.map(med =>
          med._id === id ? medicamentoActualizado : med
        )
      );

    } catch (err) {
      console.error("Error al confirmar toma:", err);
      setError(err.message);
    }
  };

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
      const response = await fetch(`https://cuidarmed-backend.onrender.com/api/medicamentos/${id}`, {
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

      {/* 6. [NUEVO] El modal de la alarma
          Esto es un "renderizado condicional":
          Solo si 'alarmaActiva' NO es null, se mostrará el modal. */}
      {alarmaActiva && (
        <ModalAlarma 
          medicamento={alarmaActiva} 
          // Le pasamos la función para que el botón del modal la ejecute
          onConfirmar={() => handleConfirmarToma(alarmaActiva._id)} 
        />
      )}

      {/* 7. [NUEVO] El elemento de audio
          Está oculto ('hidden') pero nuestra 'audioRef' lo puede controlar.
          'loop' hace que suene sin parar.
          Uso un sonido genérico de Google, puedes cambiarlo. */}
      <audio 
        ref={audioRef} 
        src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" 
        loop 
        hidden 
      />
      
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
                <button onClick={() => handleConfirmarToma(med._id)} disabled={!!medicamentoAEditar}>
                  Confirmar Toma
                </button>

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