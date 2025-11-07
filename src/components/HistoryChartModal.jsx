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
    .map(log => {
      const d = new Date(log.fecha);
      return {
        // [CAMBIO 1] Creamos una llave única para el eje X
        ejeX: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + 
              ' ' + 
              d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        movimiento: log.movimiento,
        tipo: log.tipo,
        fechaCompleta: d.toLocaleString('es-AR')
      }
    })
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
              {/* [CAMBIO 2] Aumentamos la altura para dar espacio a los labels */}
              <div style={{ width: '100%', height: 350 }}> 
                <ResponsiveContainer>
                  <BarChart
                    data={data}
                    // [CAMBIO 3] Damos más margen inferior para los labels inclinados
                    margin={{ top: 20, right: 30, left: 0, bottom: 80 }} 
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    
                    {/* [CAMBIO 4] Actualizamos el Eje X */}
                    <XAxis 
                      dataKey="ejeX" 
                      fontSize={11} 
                      angle={-45}       // Los inclinamos
                      textAnchor="end"  // Alineamos al final
                      interval={0}      // Forzamos a mostrar todos
                    />
                    
                    <YAxis allowDecimals={false} />
                    
                    <Tooltip 
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          return `Fecha: ${payload[0].payload.fechaCompleta}`;
                        }
                        return label;
                      }}
                      formatter={(value, name, props) => {
                        const tipo = props.payload.tipo;
                        const valor = value > 0 ? `+${value}` : value;
                        return [`${valor} unidades (${tipo})`, 'Movimiento'];
                      }}
                    />
                    
                    <Legend />
                    <Bar dataKey="movimiento" name="Movimiento">
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
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