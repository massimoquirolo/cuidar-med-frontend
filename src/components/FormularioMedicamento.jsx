// src/components/FormularioMedicamento.jsx
import { useState, useEffect } from 'react'; // <--- Importamos useEffect

// Estado inicial vacío
const ESTADO_INICIAL = {
  nombre: '',
  dosis: '',
  stockActual: 0,
  stockMinimo: 5,
  horarios: '' // Seguiremos usando un string separado por comas
};

// Este componente recibe una "propiedad" (una función) desde App.jsx
// llamada 'onMedicamentoAgregado'.
function FormularioMedicamento({ medicamentoActual, onSubmitCompletado, onCancelarEdicion }) {
  
  const [formData, setFormData] = useState(ESTADO_INICIAL);

  // [NUEVO] Determinamos si estamos en modo edición
  const modoEdicion = !!medicamentoActual;

  // [NUEVO] Este "efecto" vigila si 'medicamentoActual' cambia
  useEffect(() => {
    if (modoEdicion) {
      // Si estamos en modo edición, llenamos el formulario con los datos
      setFormData({
        nombre: medicamentoActual.nombre,
        dosis: medicamentoActual.dosis,
        stockActual: medicamentoActual.stockActual,
        stockMinimo: medicamentoActual.stockMinimo,
        horarios: medicamentoActual.horarios.join(', ') // Convertimos array a string
      });
    } else {
      // Si no, reseteamos el formulario
      setFormData(ESTADO_INICIAL);
    }
  }, [medicamentoActual, modoEdicion]); // Se ejecuta si 'medicamentoActual' cambia

  // Esta función se activa cada vez que escribes en un input
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  // [MODIFICADO] handleSubmit ahora es para "Crear" o "Actualizar"
  const handleSubmit = async (e) => {
    e.preventDefault();

    const horariosArray = formData.horarios.split(',').map(h => h.trim()).filter(h => h);
    const datosAEnviar = { ...formData, horarios: horariosArray };

    // Definimos el método (POST o PUT) y la URL
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

      if (!response.ok) {
        throw new Error(modoEdicion ? 'Error al actualizar' : 'Error al guardar');
      }

      const medicamentoGuardado = await response.json();
      
      // Llamamos a la función del "padre" (App.jsx)
      onSubmitCompletado(medicamentoGuardado);

      // Limpiamos el formulario
      setFormData(ESTADO_INICIAL);

    } catch (err) {
      console.error("Error al guardar:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '2rem', borderTop: '2px solid #e0e0e0', paddingTop: '1.5rem' }}>
      {/* [NUEVO] Título dinámico */}
      <h2>{modoEdicion ? 'Editar Medicamento' : 'Agregar Nuevo Medicamento'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" required />
        <input type="text" name="dosis" value={formData.dosis} onChange={handleChange} placeholder="Dosis (ej: 50mg)" />
        <input type="number" name="stockActual" value={formData.stockActual} onChange={handleChange} placeholder="Stock Inicial" required />
        <input type="number" name="stockMinimo" value={formData.stockMinimo} onChange={handleChange} placeholder="Stock Mínimo" required />
        <input type="text" name="horarios" value={formData.horarios} onChange={handleChange} placeholder="Horarios (separados por coma, ej: 09:00, 21:00)" />
      </div>
      
      <button type="submit" style={{ marginTop: '1rem', backgroundColor: '#2ecc71' }}>
        {/* [NUEVO] Texto de botón dinámico */}
        {modoEdicion ? 'Actualizar Cambios' : 'Guardar Medicamento'}
      </button>

      {/* [NUEVO] Botón para Cancelar Edición */}
      {modoEdicion && (
        <button 
          type="button" 
          className="btn-cancelar" 
          onClick={() => onCancelarEdicion()}
        >
          Cancelar Edición
        </button>
      )}
    </form>
  );
}

export default FormularioMedicamento;