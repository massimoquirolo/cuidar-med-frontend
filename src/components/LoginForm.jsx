// src/components/LoginForm.jsx
import { useState } from 'react';

// Recibe la función 'setToken' desde App.jsx
function LoginForm({ setToken }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('https://cuidar-med-backend.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Contraseña incorrecta');
      }

      // ¡Éxito! Guardamos el "pase" en el localStorage
      localStorage.setItem('authToken', data.token);
      // Y actualizamos el estado en App.jsx para que muestre el dashboard
      setToken(data.token);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Iniciar Sesión</h2>
      <p>Esta aplicación es privada. Por favor, ingrese la contraseña.</p>
      <form onSubmit={handleSubmit}>
        <div className="campo-formulario">
          <label htmlFor="password">Contraseña Maestra:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" className="btn-guardar" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
        {error && (
          <p className="mensaje-feedback error" style={{marginTop: '1rem'}}>{error}</p>
        )}
      </form>
    </div>
  );
}

export default LoginForm;
