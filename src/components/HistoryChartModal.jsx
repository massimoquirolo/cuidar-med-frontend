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

  // 1. Filtramos el historial completo para quedarnos solo con ESTE medicamento
  const historialFiltrado = historial.filter(h => h.medicamentoNombre === medicamento.nombre);

  // 2. Preparamos los datos para el gráfico (tomamos los últimos 20 movimientos)
  const data = historialFiltrado
    .slice(0, 20) // Solo los últimos 20 para que no se sature el gráfico
    .map(log => ({
      fecha: new Date(log.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
      hora: new Date(log.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      movimiento: log.movimiento,
      tipo: log.tipo,
      fullDate: new Date(log.fecha).toLocaleString('es-AR') // Para el tooltip
    }))
    .reverse(); // Para que aparezcan en orden cronológico de izquierda a derecha

  return (
    // Fondo oscuro que cierra el modal al hacer clic
    <div className="modal-backdrop" onClick={onClose}>
      {/* Contenido del modal (evita que el clic se propague al fondo) */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-header">
          <h3>Movimientos de: {medicamento.nombre}</h3>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {data.length > 0 ? (
            <>
              <p>Últimos {data.length} movimientos registrados.</p>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" fontSize={12} />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          return payload[0].payload.fullDate;
                        }
                        return label;
                      }}
                      formatter={(value, name, props) => [
                        `${value > 0 ? '+' : ''}${value} unidades (${props.payload.tipo})`, 
                        'Movimiento'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="movimiento" name="Cambio de Stock">
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