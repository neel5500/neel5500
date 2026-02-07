import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AppLayout() {
  const { session, logout } = useAuth();
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="font-semibold">PVD Stock Manager</h1>
        <div className="flex gap-4 text-sm">
          <Link to="/stock">Stock</Link>
          {isAdmin && <Link to="/dashboard">Dashboard</Link>}
          {isAdmin && <Link to="/users">Users</Link>}
          <button onClick={logout}>Logout</button>
        </div>
      </nav>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
