// src/components/ModalAlarma.jsx

import React from 'react';
import './ModalAlarma.css'; // Importaremos estilos que crearemos

// Este componente recibe el medicamento que está sonando y la función a ejecutar
function ModalAlarma({ medicamento, onConfirmar }) {
  return (
    // El "backdrop" es el fondo oscuro semitransparente
    <div className="modal-backdrop">
      <div className="modal-contenido">
        <h2>¡HORA DE LA TOMA!</h2>
        <p>Es el momento de administrar:</p>
        <div className="medicamento-info">
          <span className="nombre">{medicamento.nombre}</span>
          <span className="dosis">{medicamento.dosis}</span>
        </div>
        <p>Stock restante: {medicamento.stockActual}</p>
        <button className="confirmar-alarma-btn" onClick={onConfirmar}>
          Confirmar Toma (Descontar 1)
        </button>
      </div>
    </div>
  );
}

export default ModalAlarma;