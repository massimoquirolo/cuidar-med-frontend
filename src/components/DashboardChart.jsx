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
  Cell
} from 'recharts';

// Función "ayudante" para decidir el color de la barra
const getBarColor = (stock, minStock) => {
  if (stock <= minStock || stock === 0) {
    return '#d9534f'; // Rojo (peligro)
  }
  if (stock <= minStock * 1.5) { 
    return '#f0ad4e'; // Naranja/Amarillo (advertencia)
  }
  return '#2ecc71'; // Verde (seguro)
};

function DashboardChart({ data }) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="chart-container">
      <h2>Resumen Visual del Stock</h2>
      
      {/* CAMBIO 1: Aumentamos la altura total para dar más espacio */}
      <ResponsiveContainer width="100%" height={500}>
        <BarChart 
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 0,
            bottom: 100, // <-- CAMBIO 2: Añadimos más margen inferior para los nombres
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          
          {/* CAMBIO 3: Inclinamos los nombres */}
          <XAxis 
            dataKey="nombre"
            tick={{ fontSize: 12 }} 
            interval={0} 
            angle={-45}       // <-- Inclinamos el texto
            textAnchor="end"  // <-- Anclamos el texto al final
          />
          
          <YAxis />
          <Tooltip />
          
          <Bar dataKey="stockActual" name="Stock Actual" fill="#8884d8">
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

