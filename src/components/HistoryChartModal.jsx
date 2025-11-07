// src/components/HistoryChartModal.jsx
import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Bar,
  Cell
} from 'recharts';

function HistoryChartModal({ medicamento, historial, onClose }) {

  // Procesamos los datos del historial para el gráfico
  const data = historial
    .slice(0, 30) // Tomamos los últimos 30 movimientos
    .map(log => ({
      // Formateamos la fecha para que sea legible en el eje X
      fecha: new Date(log.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
      movimiento: log.movimiento,
      tipo: log.tipo,
      // Guardamos la fecha completa para el tooltip
      fechaCompleta: new Date(log.fecha).toLocaleString('es-AR')
    }))
    .reverse(); // Lo damos vuelta para que muestre de más viejo a más nuevo

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h3>Movimientos de: {medicamento.nombre}</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {data.length > 0 ? (
            <>
              <p>Mostrando los últimos {data.length} movimientos.</p>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" fontSize={12} />
                    <YAxis allowDecimals={false} />
                    
                    {/* --- AQUÍ ESTÁ LA CORRECCIÓN --- */}
                    <Tooltip 
                      // 1. LabelFormatter (para el título del tooltip)
                      labelFormatter={(label, payload) => {
                        // 'label' es la fecha (e.g., "07/11")
                        // 'payload' es el array de datos de la barra
                        // Usamos la fecha completa que guardamos
                        if (payload && payload.length > 0) {
                          return `Fecha: ${payload[0].payload.fechaCompleta}`;
                        }
                        return label;
                      }}
                      // 2. Formatter (para el contenido del tooltip)
                      formatter={(value, name, props) => {
                        // value = el número (e.g., 30 o -1)
                        // props.payload = el objeto de datos de ESA barra
                        const tipo = props.payload.tipo;
                        const valor = value > 0 ? `+${value}` : value;
                        // [Valor formateado], [Nombre de la leyenda]
                        return [`${valor} unidades (${tipo})`, 'Movimiento'];
                      }}
                    />
                    {/* --- FIN DE LA CORRECCIÓN --- */}
                    
                    <Legend />
                    <Bar dataKey="movimiento" name="Movimiento">
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          // El color depende del valor del movimiento
                          fill={entry.movimiento > 0 ? '#2ecc71' : '#d9534f'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <p className="no-data-msg">Aún no hay movimientos registrados para este medicamento.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryChartModal;