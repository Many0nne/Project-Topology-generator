import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/http';
import { useAuthStore } from '../store/useAuthStore';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();

  useEffect(() => {
    if (accessToken) navigate('/');
  }, [accessToken, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const resp = await api.post('/auth/register', { email, password });
      if (resp.data && resp.data.id) setMessage('Registered! Please login.');
    } catch (err: any) {
      const apiMsg = err?.response?.data?.error || 'Registration failed';
      setError(apiMsg);
    }
  }

  return (
    <div className="container">
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Register</h2>
        <div className="form-group">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn" type="submit">Register</button>
        {message ? <div className="alert success" role="status">{message}</div> : null}
        {error ? <div className="alert error" role="alert">{error}</div> : null}
      </form>
    </div>
  );
}
