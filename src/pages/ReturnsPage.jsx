import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { RotateCcw } from 'lucide-react';

export default function ReturnsPage() {
  const { data: returns, isLoading } = useQuery({
    queryKey: ['returns-list'],
    queryFn: async () => {
      const res = await api.get('/returns');
      return res.data.data;
    }
  });

  const formatPKR = (paisa = 0) => {
    return `PKR ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Returns & Damages Management</h1>
        <p className="text-sm text-slate-500">
          Delivery returns, transit damage claims, quarantine routing, and credit note issuance
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Return #</th>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total Value</th>
                <th className="px-6 py-4">Items Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Loading returns...</td>
                </tr>
              ) : returns?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No returns processed yet</td>
                </tr>
              ) : (
                returns?.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{r.returnNumber}</td>
                    <td className="px-6 py-4 font-mono text-xs">{r.distributionOrderId?.orderNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{r.vendorId?.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{formatPKR(r.grandTotalPaisa)}</td>
                    <td className="px-6 py-4 text-xs">{r.items?.length || 0} items</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
