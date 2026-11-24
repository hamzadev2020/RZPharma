import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Truck, CheckCircle2, Clock, XCircle, Plus, X } from 'lucide-react';

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const [form, setForm] = useState({
    vendorId: '',
    warehouseId: '',
    productId: '',
    quantity: 10
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['distribution-orders'],
    queryFn: async () => {
      const res = await api.get('/orders');
      return res.data.data;
    }
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors-dropdown'],
    queryFn: async () => {
      const res = await api.get('/vendors');
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
      const res = await api.get('/stock/balances');
      return res.data.data?.map(b => b.warehouseId).filter((v, i, a) => a.findIndex(t => t?._id === v?._id) === i);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/orders', {
        vendorId: payload.vendorId,
        warehouseId: payload.warehouseId,
        items: [{ productId: payload.productId, quantity: Number(payload.quantity) }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['distribution-orders']);
      setIsModalOpen(false);
      setNotification('Order created in DRAFT status!');
      setTimeout(() => setNotification(''), 4000);
    }
  });

  const allocateMutation = useMutation({
    mutationFn: async (orderId) => {
      const key = `ALLOC-${Date.now()}`;
      return api.post(`/orders/${orderId}/allocate`, {}, {
        headers: { 'Idempotency-Key': key }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['distribution-orders']);
      queryClient.invalidateQueries(['stock-balances']);
      setNotification('Stock reserved atomically! Order is ALLOCATED.');
      setTimeout(() => setNotification(''), 4000);
    }
  });

  const dispatchMutation = useMutation({
    mutationFn: async (orderId) => {
      const key = `DISP-${Date.now()}`;
      return api.post('/dispatch/dispatch', {
        orderId,
        transporterName: 'Express Logistics',
        vehicleNumber: 'KHI-7766'
      }, {
        headers: { 'Idempotency-Key': key }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['distribution-orders']);
      queryClient.invalidateQueries(['stock-balances']);
      setNotification('Order dispatched! Delivery Challan & Draft Invoice generated.');
      setTimeout(() => setNotification(''), 4000);
    }
  });

  const formatPKR = (paisa = 0) => {
    return `PKR ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">DRAFT</span>;
      case 'ALLOCATED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">ALLOCATED</span>;
      case 'DISPATCHED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">DISPATCHED</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">DELIVERED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Distribution Orders</h1>
          <p className="text-sm text-slate-500">Order placement, conditional stock reservations, and dispatch</p>
        </div>
        <button
          onClick={() => {
            if (vendors?.length && warehouses?.length && products?.length) {
              setForm({
                vendorId: vendors[0]._id,
                warehouseId: warehouses[0]._id,
                productId: products[0]._id,
                quantity: 10
              });
            }
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center space-x-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Order</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer / Vendor</th>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Loading orders...</td>
                </tr>
              ) : orders?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">No orders placed yet</td>
                </tr>
              ) : (
                orders?.map(order => (
                  <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{order.vendorId?.name}</td>
                    <td className="px-6 py-4">{order.warehouseId?.name}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{formatPKR(order.grandTotalPaisa)}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {order.status === 'DRAFT' && (
                        <button
                          onClick={() => allocateMutation.mutate(order._id)}
                          disabled={allocateMutation.isPending}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium"
                        >
                          Allocate Stock
                        </button>
                      )}
                      {order.status === 'ALLOCATED' && (
                        <button
                          onClick={() => dispatchMutation.mutate(order._id)}
                          disabled={dispatchMutation.isPending}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium"
                        >
                          Dispatch Challan
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

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Create Distribution Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(form);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Vendor</label>
                <select
                  required
                  value={form.vendorId}
                  onChange={e => setForm({ ...form, vendorId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">Select vendor...</option>
                  {vendors?.map(v => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fulfillment Warehouse</label>
                <select
                  required
                  value={form.warehouseId}
                  onChange={e => setForm({ ...form, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">Select warehouse...</option>
                  {warehouses?.map(w => (
                    <option key={w?._id} value={w?._id}>
                      {w?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product</label>
                <select
                  required
                  value={form.productId}
                  onChange={e => setForm({ ...form, productId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">Select product...</option>
                  {products?.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Order Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              {/* Price & 1% Tax Preview */}
              {(() => {
                const selectedProd = products?.find(p => p._id === form.productId);
                if (!selectedProd) return null;
                const tpPaisa = selectedProd.salePricePaisa || 0;
                const qty = Number(form.quantity) || 0;
                const subtotal = tpPaisa * qty;
                const taxPaisa = Math.round(subtotal * 0.01);
                const grandTotal = subtotal + taxPaisa;
                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Unit Price (TP):</span>
                      <span className="font-semibold">{formatPKR(tpPaisa)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatPKR(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-indigo-700">
                      <span>Tax (1% Auto-Calculated):</span>
                      <span className="font-semibold">{formatPKR(taxPaisa)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
                      <span>Estimated Total:</span>
                      <span className="text-emerald-700">{formatPKR(grandTotal)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                >
                  {createMutation.isPending ? 'Placing...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
