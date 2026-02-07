import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submitPassword(e) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/auth/login/password', { email, password });
      login({ token: data.token, user: data.user });
      navigate('/stock');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-4">Sign in</h2>
      <p className="text-sm text-slate-600 mb-4">Use password login or integrate webcam face capture with /auth/login/face endpoint.</p>
      <form onSubmit={submitPassword} className="space-y-3">
        <input className="w-full border rounded p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="w-full bg-slate-900 text-white py-2 rounded">Login</button>
      </form>
    </div>
  );
}
