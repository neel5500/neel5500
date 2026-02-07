import { useEffect, useState } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setSummary(res.data));
  }, []);

  if (!summary) return <div>Loading dashboard...</div>;

  const chartData = [
    { name: 'Inward', qty: Number(summary.inward_outward.inward) },
    { name: 'Outward', qty: Number(summary.inward_outward.outward) }
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Total Inward" value={summary.total_inward} />
        <Stat label="Overdue Jobs" value={summary.overdue_jobs} />
        <Stat label="Low Stock Alerts" value={summary.low_stock_items.length} />
      </div>
      <div className="bg-white p-4 rounded-xl shadow h-72">
        <h3 className="font-semibold mb-2">Inward vs Outward</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="qty" fill="#1e40af" /></BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return <div className="bg-white shadow rounded-xl p-4"><p className="text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>;
}
