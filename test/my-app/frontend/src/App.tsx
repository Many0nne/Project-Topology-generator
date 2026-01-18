import './App.css'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import { useAuthStore, setAccessToken, clearAuth } from './store/useAuthStore'
import { useEffect } from 'react'
import axios from 'axios'
import api from './api/http'
import Login from './pages/Login'
import Register from './pages/Register'

function Home() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return (
    <div className="card">
      <h2>Welcome</h2>
      <p>Use the links below to test auth:</p>
      <ul>
        <li><Link to="/auth/login">Login</Link></li>
        <li><Link to="/auth/register">Register</Link></li>
      </ul>
      {accessToken ? (
        <div className="alert success">Vous êtes bien authentifié.</div>
      ) : null}
    </div>
  )
}

export default function App() {
  useEffect(() => {
    (async () => {
      try {
        const resp = await axios.post((import.meta.env.VITE_API_BASE_URL || '') + '/auth/refresh', {}, { withCredentials: true });
        if (resp?.data?.accessToken) setAccessToken(resp.data.accessToken);
      } catch (_) {
        // ignore: not logged or refresh invalid
      }
    })();
  }, []);
  const accessToken = useAuthStore((s) => s.accessToken);
  async function onLogout() {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
  }
  return (
    <div style={{ padding: 16 }}>
      <div className="topbar">
        <div className="brand">Auth Demo</div>
        {accessToken ? (
          <button className="btn outline" onClick={onLogout}>Logout</button>
        ) : null}
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
