// src/components/LoginForm.jsx
import { useState } from 'react';

function LoginForm({ setToken }) {
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(false);
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
        body: JSON.stringify({
          password: password,
          recordarme: recordarme
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Contraseña incorrecta');
      }

      localStorage.setItem('authToken', data.token);
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

        <div className="campo-formulario-checkbox" style={{flexDirection: 'row', alignItems: 'center', gap: '0.5rem', margin: '1rem 0', display: 'flex'}}>
          <input
            type="checkbox"
            id="recordarme"
            checked={recordarme}
            onChange={(e) => setRecordarme(e.target.checked)}
            disabled={isLoading}
            style={{width: 'auto'}}
          />
          <label htmlFor="recordarme" style={{marginBottom: 0, cursor: 'pointer'}}>
            Mantener sesión iniciada por 30 días
          </label>
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