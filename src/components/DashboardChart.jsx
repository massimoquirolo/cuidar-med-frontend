// src/components/DashboardChart.jsx

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell // <-- Importamos 'Cell' para poder colorear cada barra
} from 'recharts';

// Función "ayudante" para decidir el color de la barra
const getBarColor = (stock, minStock) => {
  // Si el stock es 0 o está por debajo del mínimo, rojo
  if (stock <= minStock || stock === 0) {
    return '#d9534f'; // Rojo (peligro)
  }
  // Si el stock está "cerca" del mínimo (ej: 50% por encima), amarillo
  if (stock <= minStock * 1.5) { 
    return '#f0ad4e'; // Naranja/Amarillo (advertencia)
  }
  // Si no, verde
  return '#2ecc71'; // Verde (seguro)
};

// El componente del gráfico
// Recibe la lista de medicamentos como un "prop" llamado 'data'
function DashboardChart({ data }) {

  // No mostramos el gráfico si no hay datos
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="chart-container">
      <h2>Resumen Visual del Stock</h2>
      {/* ResponsiveContainer hace que el gráfico se adapte al tamaño de la pantalla */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart 
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {/* Eje X (horizontal): los nombres de los medicamentos */}
          <XAxis 
            dataKey="nombre"
            // Hacemos la letra un poco más chica por si hay muchos
            tick={{ fontSize: 12 }} 
            // Mostramos todos los nombres, sin saltarnos
            interval={0} 
          />
          {/* Eje Y (vertical): la cantidad */}
          <YAxis />
          {/* Tooltip: lo que aparece cuando pasas el mouse por encima */}
          <Tooltip />
          
          {/* Las Barras */}
          <Bar dataKey="stockActual" name="Stock Actual" fill="#8884d8">
            {/* Aquí está la magia: Mapeamos los datos y le damos
              a cada "Celda" (barra) un color individual
            */}
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.stockActual, entry.stockMinimo)} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DashboardChart;
