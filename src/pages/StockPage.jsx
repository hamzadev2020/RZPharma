import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Warehouse, PackageCheck, ArrowRightLeft, Plus, X, CheckCircle2 } from 'lucide-react';

export default function StockPage() {
  const queryClient = useQueryClient();
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const [receiptForm, setReceiptForm] = useState({
    productId: '',
    warehouseId: '',
    quantity: 50,
    unitCostPKR: 2800,
    reason: 'Routine Restock'
  });

  const { data: balances, isLoading } = useQuery({
    queryKey: ['stock-balances'],
    queryFn: async () => {
      const res = await api.get('/stock/balances');
      return res.data.data;
    }
  });

  const { data: products } = useQuery({
    queryKey: ['products-dropdown'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data.data;
    }
  });

  const receiptMutation = useMutation({
    mutationFn: async (payload) => {
      const idempotencyKey = `GR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      return api.post('/stock/goods-receipt', payload, {
        headers: { 'Idempotency-Key': idempotencyKey }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stock-balances']);
      setIsReceiptModalOpen(false);
      setNotification('Goods Receipt recorded and stock updated atomically!');
      setTimeout(() => setNotification(''), 4000);
    }
  });

  const handleReceipt = (e) => {
    e.preventDefault();
    receiptMutation.mutate({
      productId: receiptForm.productId,
      warehouseId: receiptForm.warehouseId,
      quantity: Number(receiptForm.quantity),
      unitCostPaisa: Math.round(Number(receiptForm.unitCostPKR) * 100),
      reason: receiptForm.reason
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warehouse Stock & Inventory</h1>
          <p className="text-sm text-slate-500">
            Real-time multi-warehouse balances with strict atomic reservation control
          </p>
        </div>
        <button
          onClick={() => {
            if (products?.length && balances?.length) {
              setReceiptForm({
                productId: products[0]._id,
                warehouseId: balances[0]?.warehouseId?._id || '',
                quantity: 50,
                unitCostPKR: 2800,
                reason: 'Goods Receipt'
              });
            }
            setIsReceiptModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center space-x-2 shadow-sm transition-all"
        >
          <PackageCheck className="w-4 h-4" />
          <span>Goods Receipt (Stock In)</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Balances Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Product SKU</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">On Hand</th>
                <th className="px-6 py-4">Reserved</th>
                <th className="px-6 py-4 text-emerald-700 font-bold">Available</th>
                <th className="px-6 py-4">In Transit</th>
                <th className="px-6 py-4 text-rose-600">Quarantine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading stock balances...</td>
                </tr>
              ) : balances?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No stock records found</td>
                </tr>
              ) : (
                balances?.map(b => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">{b.warehouseId?.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{b.productId?.sku}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{b.productId?.name}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{b.onHand}</td>
                    <td className="px-6 py-4 text-amber-600 font-medium">{b.reserved}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {b.available}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-blue-600 font-medium">{b.inTransit}</td>
                    <td className="px-6 py-4 font-medium text-rose-600">{b.quarantined}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goods Receipt Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Record Goods Receipt</h3>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceipt} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product</label>
                <select
                  required
                  value={receiptForm.productId}
                  onChange={e => setReceiptForm({ ...receiptForm, productId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">Select a product...</option>
                  {products?.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse</label>
                <select
                  required
                  value={receiptForm.warehouseId}
                  onChange={e => setReceiptForm({ ...receiptForm, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">Select warehouse...</option>
                  {balances?.map(b => (
                    <option key={b.warehouseId?._id} value={b.warehouseId?._id}>
                      {b.warehouseId?.name} ({b.warehouseId?.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={receiptForm.quantity}
                    onChange={e => setReceiptForm({ ...receiptForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Cost (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={receiptForm.unitCostPKR}
                    onChange={e => setReceiptForm({ ...receiptForm, unitCostPKR: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={receiptForm.reason}
                  onChange={e => setReceiptForm({ ...receiptForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={receiptMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                >
                  {receiptMutation.isPending ? 'Recording...' : 'Stock In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
