import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Warehouse, PackageCheck, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function StockPage() {
  const queryClient = useQueryClient();
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [receiptForm, setReceiptForm] = useState({
    productId: '',
    warehouseId: '',
    batchNumber: '',
    expiryDate: '',
    quantity: 50,
    unitCostPKR: 100,
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

  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-dropdown'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
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
      queryClient.invalidateQueries(['dashboard-summary']);
      setIsReceiptModalOpen(false);
      setErrorMsg('');
      setNotification('Goods Receipt recorded! Batch and stock balances updated.');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to record stock in');
      setTimeout(() => setErrorMsg(''), 6000);
    }
  });

  const handleReceipt = (e) => {
    e.preventDefault();
    setErrorMsg('');
    receiptMutation.mutate({
      productId: receiptForm.productId,
      warehouseId: receiptForm.warehouseId,
      batchNumber: receiptForm.batchNumber.trim().toUpperCase(),
      expiryDate: receiptForm.expiryDate,
      quantity: Number(receiptForm.quantity),
      unitCostPaisa: Math.round(Number(receiptForm.unitCostPKR) * 100),
      reason: receiptForm.reason
    });
  };

  const handleOpenReceipt = () => {
    setErrorMsg('');
    if (products?.length && warehouses?.length) {
      // Set default expiry 1 year ahead
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 2);
      const defaultDate = nextYear.toISOString().split('T')[0];

      setReceiptForm({
        productId: products[0]._id,
        warehouseId: warehouses[0]._id,
        batchNumber: `BAT-${Date.now().toString().slice(-4)}`,
        expiryDate: defaultDate,
        quantity: 50,
        unitCostPKR: (products[0].costPricePaisa || 10000) / 100,
        reason: 'Company Purchase Restock'
      });
    }
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warehouse Stock & Batches</h1>
          <p className="text-sm text-slate-500">
            Real-time batch-level inventory, FEFO tracking, and atomic stock reserves
          </p>
        </div>
        <button
          onClick={handleOpenReceipt}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center space-x-2 shadow-sm transition-all"
        >
          <PackageCheck className="w-4 h-4" />
          <span>Goods Receipt (Stock In / Batch Add)</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Balances Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Batch No.</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">On Hand</th>
                <th className="px-6 py-4">Reserved</th>
                <th className="px-6 py-4 text-emerald-700 font-bold">Available</th>
                <th className="px-6 py-4">In Transit</th>
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
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900 block">{b.productId?.name}</span>
                      <span className="text-xs font-mono text-slate-400">{b.productId?.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {b.batchId?.batchNumber || 'STANDARD'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">
                      {b.batchId?.expiryDate ? new Date(b.batchId.expiryDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{b.onHand}</td>
                    <td className="px-6 py-4 text-amber-600 font-medium">{b.reserved}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {b.available}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-blue-600 font-medium">{b.inTransit}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goods Receipt / Batch Add Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Record Stock & Add Batch</h3>
                <p className="text-xs text-slate-500">Purchasing entry with Batch No & Expiry</p>
              </div>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceipt} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product *</label>
                <select
                  required
                  value={receiptForm.productId}
                  onChange={e => {
                    const prod = products?.find(p => p._id === e.target.value);
                    setReceiptForm({
                      ...receiptForm,
                      productId: e.target.value,
                      unitCostPKR: prod ? (prod.costPricePaisa || 10000) / 100 : receiptForm.unitCostPKR
                    });
                  }}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse *</label>
                <select
                  required
                  value={receiptForm.warehouseId}
                  onChange={e => setReceiptForm({ ...receiptForm, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">Select warehouse...</option>
                  {warehouses?.map(w => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. J-293"
                    value={receiptForm.batchNumber}
                    onChange={e => setReceiptForm({ ...receiptForm, batchNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={receiptForm.expiryDate}
                    onChange={e => setReceiptForm({ ...receiptForm, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Received *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason / Invoice Ref</label>
                <input
                  type="text"
                  value={receiptForm.reason}
                  onChange={e => setReceiptForm({ ...receiptForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  placeholder="e.g. Manufacturer Invoice # 9876"
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {receiptMutation.isPending ? 'Recording...' : 'Stock In & Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
