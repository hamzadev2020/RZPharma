import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { FileCheck2, Truck, CheckCircle2 } from 'lucide-react';

export default function ChallansPage() {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState('');

  const { data: challans, isLoading } = useQuery({
    queryKey: ['delivery-challans'],
    queryFn: async () => {
      const res = await api.get('/dispatch/challans');
      return res.data.data;
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async (challanId) => {
      const key = `CONF-${Date.now()}`;
      return api.post('/dispatch/confirm-delivery', {
        challanId,
        receiverName: 'Authorized Store Incharge'
      }, {
        headers: { 'Idempotency-Key': key }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['delivery-challans']);
      queryClient.invalidateQueries(['distribution-orders']);
      queryClient.invalidateQueries(['stock-balances']);
      setNotification('Delivery confirmed! Stock cleared from inTransit.');
      setTimeout(() => setNotification(''), 4000);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Delivery Challans & Transit</h1>
        <p className="text-sm text-slate-500">
          Track inTransit goods, transporter info, and proof of delivery confirmation
        </p>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Challan #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Transporter</th>
                <th className="px-6 py-4">Vehicle #</th>
                <th className="px-6 py-4">Dispatch Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Loading delivery challans...</td>
                </tr>
              ) : challans?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">No active challans</td>
                </tr>
              ) : (
                challans?.map(ch => (
                  <tr key={ch._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{ch.challanNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{ch.vendorId?.name}</td>
                    <td className="px-6 py-4">{ch.transporterName || 'Self-Pickup'}</td>
                    <td className="px-6 py-4 font-mono text-xs">{ch.vehicleNumber || '—'}</td>
                    <td className="px-6 py-4 text-xs">
                      {ch.dispatchDate ? new Date(ch.dispatchDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {ch.status === 'DELIVERED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          DELIVERED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          IN TRANSIT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ch.status !== 'DELIVERED' && (
                        <button
                          onClick={() => confirmMutation.mutate(ch._id)}
                          disabled={confirmMutation.isPending}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium"
                        >
                          Confirm Delivery
                        </button>
                      )}
                    </td>
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
