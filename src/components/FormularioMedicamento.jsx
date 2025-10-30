// src/components/FormularioMedicamento.jsx
import { useState, useEffect } from 'react';

// Estado inicial vacío
const ESTADO_INICIAL = {
  nombre: '',
  dosis: '',
  stockActual: 0,
  stockMinimo: 5,
};

function FormularioMedicamento({ medicamentoActual, onSubmitCompletado, onCancelarEdicion }) {
  
  const [formData, setFormData] = useState(ESTADO_INICIAL);
  
  // --- MEJORA DE HORARIOS ---
  // Un estado separado para el array de horarios
  const [horarios, setHorarios] = useState([]);
  // Un estado para el input de la hora que se está por añadir
  const [horaActual, setHoraActual] = useState('09:00');
  // -------------------------

  // --- MEJORA DE FEEDBACK ---
  const [mensaje, setMensaje] = useState(null); // Para "Guardado!" o "Error"
  // -------------------------

  const modoEdicion = !!medicamentoActual;

  // Efecto para rellenar el formulario cuando se entra en modo edición
  useEffect(() => {
    // Limpiamos mensajes viejos
    setMensaje(null);

    if (modoEdicion) {
      setFormData({
        nombre: medicamentoActual.nombre,
        dosis: medicamentoActual.dosis,
        stockActual: medicamentoActual.stockActual,
        stockMinimo: medicamentoActual.stockMinimo,
      });
      // El 'horarios' (que era un string) ahora es un array
      setHorarios(medicamentoActual.horarios); 
    } else {
      // Reseteamos todo
      setFormData(ESTADO_INICIAL);
      setHorarios([]);
    }
  }, [medicamentoActual, modoEdicion]);

  
  // Manejador para los inputs de texto/número
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  // --- NUEVAS FUNCIONES PARA HORARIOS ---
  const handleAnadirHora = () => {
    // Evita duplicados
    if (horaActual && !horarios.includes(horaActual)) {
      setHorarios([...horarios, horaActual].sort()); // Los guarda ordenados
    }
  };

  const handleQuitarHora = (horaAQuitar) => {
    setHorarios(horarios.filter(h => h !== horaAQuitar));
  };
  // ------------------------------------

  
  // Manejador del submit (guardar o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje(null); // Limpiamos mensaje

    // Validamos que haya al menos un horario
    if (horarios.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Debes añadir al menos un horario.' });
      return;
    }

    const datosAEnviar = { ...formData, horarios: horarios }; // Ya es un array

    const url = modoEdicion 
      ? `https://cuidar-med-backend.onrender.com/api/medicamentos/${medicamentoActual._id}`
      : 'https://cuidar-med-backend.onrender.com/api/medicamentos';
      
    const method = modoEdicion ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosAEnviar),
      });

      const medicamentoGuardado = await response.json();

      if (!response.ok) {
        throw new Error(medicamentoGuardado.mensaje || (modoEdicion ? 'Error al actualizar' : 'Error al guardar'));
      }
      
      onSubmitCompletado(medicamentoGuardado);
      
      // Limpiamos el formulario y mostramos éxito
      setFormData(ESTADO_INICIAL);
      setHorarios([]);
      setMensaje({ tipo: 'exito', texto: modoEdicion ? '¡Actualizado con éxito!' : '¡Guardado con éxito!' });

    } catch (err) {
      console.error("Error al guardar:", err);
      setMensaje({ tipo: 'error', texto: err.message });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="formulario-medicamento">
      <h2>{modoEdicion ? 'Editar Medicamento' : 'Agregar Nuevo Medicamento'}</h2>
      
      <div className="grid-formulario">
        
        {/* MEJORA: Labels y Inputs */}
        <div className="campo-formulario">
          <label htmlFor="nombre">Nombre del Medicamento:</label>
          <input type="text" name="nombre" id="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Losartán" required />
        </div>
        
        <div className="campo-formulario">
          <label htmlFor="dosis">Dosis / MG:</label>
          <input type="text" name="dosis" id="dosis" value={formData.dosis} onChange={handleChange} placeholder="Ej: 50mg" />
        </div>

        <div className="campo-formulario">
          <label htmlFor="stockActual">Stock Inicial (unidades):</label>
          <input type="number" name="stockActual" id="stockActual" value={formData.stockActual} onChange={handleChange} min="0" required />
        </div>
        
        <div className="campo-formulario">
          <label htmlFor="stockMinimo">Aviso de Stock Mínimo:</label>
          <input type="number" name="stockMinimo" id="stockMinimo" value={formData.stockMinimo} onChange={handleChange} min="1" required />
        </div>
      </div>

      {/* MEJORA: Selector de Horarios */}
      <div className="campo-horarios">
        <label htmlFor="hora">Horarios de Toma (HH:MM):</label>
        <div className="input-horarios">
          <input type="time" id="hora" value={horaActual} onChange={(e) => setHoraActual(e.target.value)} />
          <button type="button" className="btn-anadir-hora" onClick={handleAnadirHora}>
            Añadir Hora
          </button>
        </div>
        <div className="lista-horarios">
          {horarios.length === 0 ? (
            <p>Aún no hay horarios añadidos.</p>
          ) : (
            horarios.map(h => (
              <span key={h} className="horario-pill">
                {h}
                <button type="button" onClick={() => handleQuitarHora(h)}>×</button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="botones-formulario">
        <button type="submit" className="btn-guardar">
          {modoEdicion ? 'Actualizar Cambios' : 'Guardar Medicamento'}
        </button>
        
        {modoEdicion && (
          <button type="button" className="btn-cancelar" onClick={onCancelarEdicion}>
            Cancelar Edición
          </button>
        )}
      </div>

      {/* MEJORA: Mensajes de Feedback */}
      {mensaje && (
        <p className={`mensaje-feedback ${mensaje.tipo === 'error' ? 'error' : 'exito'}`}>
          {mensaje.texto}
        </p>
      )}
    </form>
  );
}

export default FormularioMedicamento;