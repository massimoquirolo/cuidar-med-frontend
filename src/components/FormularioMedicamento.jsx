// src/components/FormularioMedicamento.jsx
import { useState, useEffect } from 'react';
// [NUEVO] Importamos 'toast'
import toast from 'react-hot-toast';

const ESTADO_INICIAL = {
  nombre: '',
  dosis: '',
  stockActual: 0,
  stockMinimo: 5,
  fechaVencimiento: ''
};

function FormularioMedicamento({ medicamentoActual, onSubmitCompletado, onCancelarEdicion }) {
  
  const [formData, setFormData] = useState(ESTADO_INICIAL);
  const [horarios, setHorarios] = useState([]);
  const [horaActual, setHoraActual] = useState('09:00');
  
  // [ELIMINADO] Ya no necesitamos el 'useState' para 'mensaje'
  // const [mensaje, setMensaje] = useState(null); 
  
  const [isLoading, setIsLoading] = useState(false);

  const modoEdicion = !!medicamentoActual;

  useEffect(() => {
    // setMensaje(null); <-- [ELIMINADO]
    if (modoEdicion) {
      let fechaParaInput = '';
      if (medicamentoActual.fechaVencimiento) {
        fechaParaInput = new Date(medicamentoActual.fechaVencimiento).toISOString().split('T')[0];
      }
      setFormData({
        nombre: medicamentoActual.nombre,
        dosis: medicamentoActual.dosis,
        stockActual: medicamentoActual.stockActual,
        stockMinimo: medicamentoActual.stockMinimo,
        fechaVencimiento: fechaParaInput
      });
      setHorarios(medicamentoActual.horarios); 
    } else {
      setFormData(ESTADO_INICIAL);
      setHorarios([]);
    }
  }, [medicamentoActual, modoEdicion]);

  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleAnadirHora = () => {
    if (horaActual && !horarios.includes(horaActual)) {
      setHorarios([...horarios, horaActual].sort());
    }
  };

  const handleQuitarHora = (horaAQuitar) => {
    setHorarios(horarios.filter(h => h !== horaAQuitar));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setMensaje(null); <-- [ELIMINADO]
    setIsLoading(true);

    if (horarios.length === 0) {
      // [MODIFICADO] Usamos toast
      toast.error('Debes añadir al menos un horario.'); 
      setIsLoading(false);
      return;
    }

    const fechaAEnviar = formData.fechaVencimiento === '' ? null : formData.fechaVencimiento;
    const datosAEnviar = { ...formData, horarios: horarios, fechaVencimiento: fechaAEnviar };

    const url = modoEdicion 
      ? `https://cuidar-med-backend.vercel.app/api/medicamentos/${medicamentoActual._id}`
      : 'https://cuidar-med-backend.vercel.app/api/medicamentos';
      
    const method = modoEdicion ? 'PUT' : 'POST';

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error("No estás autenticado. Cierra sesión y vuelve a entrar.");
      }

      const response = await fetch(url, {
        method: method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(datosAEnviar),
      });

      const medicamentoGuardado = await response.json();

      if (!response.ok) {
        throw new Error(medicamentoGuardado.mensaje || (modoEdicion ? 'Error al actualizar' : 'Error al guardar'));
      }
      
      onSubmitCompletado(medicamentoGuardado);
      setFormData(ESTADO_INICIAL);
      setHorarios([]);
      
      // [MODIFICADO] Usamos toast
      toast.success(modoEdicion ? '¡Actualizado con éxito!' : '¡Guardado con éxito!');

    } catch (err) {
      console.error("Error al guardar:", err);
      // [MODIFICADO] Usamos toast
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="formulario-medicamento">
      <h2>{modoEdicion ? 'Editar Medicamento' : 'Agregar Nuevo Medicamento'}</h2>
      
      <fieldset disabled={isLoading}>
        {/* ... (Todo tu formulario: grid, campo-horarios, etc. no cambia) ... */}
        <div className="grid-formulario">
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

          <div className="campo-formulario">
            <label htmlFor="fechaVencimiento">Fecha de Vencimiento (Opcional):</label>
            <input type="date" name="fechaVencimiento" id="fechaVencimiento" value={formData.fechaVencimiento} onChange={handleChange} />
          </div>
        </div>

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
      </fieldset>

      <div className="botones-formulario">
        <button type="submit" className="btn-guardar" disabled={isLoading}>
          {isLoading ? (modoEdicion ? 'Actualizando...' : 'Guardando...') : (modoEdicion ? 'Actualizar Cambios' : 'Guardar Medicamento')}
        </button>
        
        {modoEdicion && (
          <button type="button" className="btn-cancelar" onClick={onCancelarEdicion} disabled={isLoading}>
            Cancelar Edición
          </button>
        )}
      </div>

      {/* [ELIMINADO] El bloque de 'mensaje' ya no es necesario */}
      
    </form>
  );
}

export default FormularioMedicamento;
