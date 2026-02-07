import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function StockPage() {
  const [stock, setStock] = useState([]);
  const [form, setForm] = useState({ product_name: '', item_category: 'raw', quantity: 0, unit: 'pieces', party_name: '' });

  async function load() {
    const { data } = await api.get('/stock');
    setStock(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createInward(e) {
    e.preventDefault();
    await api.post('/stock/inward', form);
    setForm({ product_name: '', item_category: 'raw', quantity: 0, unit: 'pieces', party_name: '' });
    load();
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <form onSubmit={createInward} className="bg-white p-4 rounded-xl shadow space-y-2">
        <h3 className="font-semibold">Stock Inward Entry</h3>
        <input className="w-full border p-2 rounded" placeholder="Product" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
        <input className="w-full border p-2 rounded" placeholder="Party" value={form.party_name} onChange={(e) => setForm({ ...form, party_name: e.target.value })} />
        <input className="w-full border p-2 rounded" type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
        <select className="w-full border p-2 rounded" value={form.item_category} onChange={(e) => setForm({ ...form, item_category: e.target.value })}>
          <option value="raw">Raw</option>
          <option value="finished">Finished</option>
          <option value="job_work">Job Work</option>
        </select>
        <button className="w-full bg-blue-700 text-white py-2 rounded">Save Inward</button>
      </form>

      <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-3">Current Stock</h3>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th>Product</th><th>Party</th><th>Inward</th><th>Dispatched</th><th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((row) => (
                <tr key={row.id} className="border-b">
                  <td>{row.product_name}</td>
                  <td>{row.party_name}</td>
                  <td>{row.quantity}</td>
                  <td>{row.dispatched}</td>
                  <td>{row.remaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
