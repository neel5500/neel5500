import { useState } from 'react';
import { api } from '../api/client';

export default function UsersPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'MANAGER' });
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    const { data } = await api.post('/admin/users', form);
    setMessage(`Created user ${data.email}`);
    setForm({ full_name: '', email: '', password: '', role: 'MANAGER' });
  }

  return (
    <div className="max-w-xl bg-white p-4 rounded-xl shadow">
      <h3 className="font-semibold mb-2">User Management</h3>
      <form onSubmit={submit} className="space-y-2">
        <input className="w-full border p-2 rounded" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className="w-full border p-2 rounded" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Temporary Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="w-full border p-2 rounded" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button className="bg-slate-900 text-white px-4 py-2 rounded">Create User</button>
      </form>
      {message && <p className="text-green-700 mt-3">{message}</p>}
    </div>
  );
}
