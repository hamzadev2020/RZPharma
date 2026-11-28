import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Truck, CheckCircle2, Clock, XCircle, Plus, X, AlertCircle, Edit, Trash2, Tag, Percent } from 'lucide-react';

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    vendorId: '',
    warehouseId: '',
    productId: '',
    quantity: 10,
    unitPricePKR: '',
    discountPercent: 0,
    discountFlatPKR: 0
  });

  const [editForm, setEditForm] = useState({
    id: '',
    orderNumber: '',
    vendorId: '',
    warehouseId: '',
    productId: '',
    quantity: 10,
    unitPricePKR: '',
    discountPercent: 0,
    discountFlatPKR: 0
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
      const unitPricePaisa = payload.unitPricePKR !== '' ? Math.round(Number(payload.unitPricePKR) * 100) : undefined;
      const discountPercent = Number(payload.discountPercent) || 0;
      const discountFlatPaisa = payload.discountFlatPKR ? Math.round(Number(payload.discountFlatPKR) * 100) : 0;

      return api.post('/orders', {
        vendorId: payload.vendorId,
        warehouseId: payload.warehouseId,
        items: [{
          productId: payload.productId,
          quantity: Number(payload.quantity),
          unitPricePaisa,
          discountPercent,
          discountFlatPaisa
        }]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['distribution-orders']);
      setIsModalOpen(false);
      setErrorMessage('');
      setNotification('Order created in DRAFT status with customized rate & discount!');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || 'Failed to create order';
      setErrorMessage(`❌ Order Creation Failed: ${msg}`);
      setTimeout(() => setErrorMessage(''), 7000);
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
      setErrorMessage('');
      setNotification('Stock reserved atomically! Order is ALLOCATED.');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || 'Stock allocation failed due to insufficient stock';
      setErrorMessage(`❌ Stock Allocation Failed: ${msg}. Please add stock in "Stock & Batches" for this warehouse first.`);
      setTimeout(() => setErrorMessage(''), 7000);
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
      setErrorMessage('');
      setNotification('Order dispatched! Delivery Challan & Draft Invoice generated.');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || 'Dispatch failed';
      setErrorMessage(`❌ Dispatch Failed: ${msg}`);
      setTimeout(() => setErrorMessage(''), 7000);
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (payload) => {
      const unitPricePaisa = payload.unitPricePKR !== '' ? Math.round(Number(payload.unitPricePKR) * 100) : undefined;
      const discountPercent = Number(payload.discountPercent) || 0;
      const discountFlatPaisa = payload.discountFlatPKR ? Math.round(Number(payload.discountFlatPKR) * 100) : 0;

      return api.put(`/orders/${payload.id}`, {
        quantity: Number(payload.quantity),
        productId: payload.productId,
        warehouseId: payload.warehouseId,
        vendorId: payload.vendorId,
        unitPricePaisa,
        discountPercent,
        discountFlatPaisa
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['distribution-orders']);
      setIsEditModalOpen(false);
      setErrorMessage('');
      setNotification('Order updated successfully with new rate/discount!');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || 'Update failed';
      setErrorMessage(`❌ Error: ${msg}`);
      setTimeout(() => setErrorMessage(''), 6000);
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId) => {
      return api.delete(`/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['distribution-orders']);
      setErrorMessage('');
      setNotification('Order deleted successfully!');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || 'Delete failed';
      setErrorMessage(`❌ Error: ${msg}`);
      setTimeout(() => setErrorMessage(''), 6000);
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

  // Helper calculation for live preview
  const calculatePreview = (f) => {
    const selectedProd = products?.find(p => p._id === f.productId);
    const standardTPPaisa = selectedProd?.salePricePaisa || 0;
    const standardTP = standardTPPaisa / 100;

    const rate = f.unitPricePKR !== '' ? Number(f.unitPricePKR) : standardTP;
    const qty = Number(f.quantity) || 0;
    const lineGross = rate * qty;

    const discPercent = Number(f.discountPercent) || 0;
    const discFromPercent = (lineGross * discPercent) / 100;
    const discFlat = Number(f.discountFlatPKR) || 0;
    const totalDiscount = discFromPercent + discFlat;

    const lineNet = Math.max(0, lineGross - totalDiscount);
    const tax = lineNet * 0.01;
    const grandTotal = lineNet + tax;

    return {
      standardTP,
      rate,
      qty,
      lineGross,
      discPercent,
      totalDiscount,
      lineNet,
      tax,
      grandTotal
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Distribution Orders</h1>
          <p className="text-sm text-slate-500">Order placement, custom rate & discount overrides, stock reservations</p>
        </div>
        <button
          onClick={() => {
            if (vendors?.length && warehouses?.length && products?.length) {
              const defaultProd = products[0];
              const defaultPricePKR = defaultProd?.salePricePaisa ? (defaultProd.salePricePaisa / 100).toFixed(2) : '';
              setForm({
                vendorId: vendors[0]._id,
                warehouseId: warehouses[0]._id,
                productId: defaultProd._id,
                quantity: 10,
                unitPricePKR: defaultPricePKR,
                discountPercent: 0,
                discountFlatPKR: 0
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

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Medicine & Qty</th>
                <th className="px-6 py-4">Selling Rate / Discount</th>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading orders...</td>
                </tr>
              ) : orders?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No orders placed yet</td>
                </tr>
              ) : (
                orders?.map(order => {
                  const firstItem = order.items?.[0];
                  const itemProd = firstItem?.productId;
                  const unitRatePKR = firstItem?.unitPricePaisa ? (firstItem.unitPricePaisa / 100).toFixed(2) : '—';
                  const disc = firstItem?.discountPercent ? (firstItem.discountPercent > 100 ? firstItem.discountPercent / 100 : firstItem.discountPercent) : 0;

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {order.vendorId?.name}
                        {order.vendorId?.code && (
                          <span className="block text-xs font-mono text-indigo-600 font-normal">ID: {order.vendorId.code}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 block">
                          {itemProd?.name || 'Medicine Item'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Qty: {firstItem?.quantity || 0} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-medium text-slate-900">
                          PKR {unitRatePKR} / unit
                        </div>
                        {disc > 0 ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {disc}% off
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Standard Net</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{order.warehouseId?.name}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{formatPKR(order.grandTotalPaisa)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {order.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => allocateMutation.mutate(order._id)}
                              disabled={allocateMutation.isPending}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium"
                            >
                              Allocate Stock
                            </button>
                            <button
                              onClick={() => {
                                const pId = firstItem?.productId?._id || firstItem?.productId || '';
                                const prod = products?.find(p => p._id === pId);
                                const ratePKR = firstItem?.unitPricePaisa !== undefined
                                  ? (firstItem.unitPricePaisa / 100).toFixed(2)
                                  : (prod?.salePricePaisa ? (prod.salePricePaisa / 100).toFixed(2) : '');
                                const discPercent = firstItem?.discountPercent 
                                  ? (firstItem.discountPercent > 100 ? firstItem.discountPercent / 100 : firstItem.discountPercent) 
                                  : 0;
                                const discFlatPKR = firstItem?.discountFlatPaisa ? (firstItem.discountFlatPaisa / 100).toFixed(2) : 0;

                                setEditForm({
                                  id: order._id,
                                  orderNumber: order.orderNumber,
                                  vendorId: order.vendorId?._id || '',
                                  warehouseId: order.warehouseId?._id || '',
                                  productId: pId,
                                  quantity: firstItem?.quantity || 1,
                                  unitPricePKR: ratePKR,
                                  discountPercent: discPercent,
                                  discountFlatPKR: discFlatPKR
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 inline-flex items-center"
                              title="Edit Order"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) {
                                  deleteOrderMutation.mutate(order._id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 inline-flex items-center"
                              title="Delete Order"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal with Custom Rate & Discount */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Create Distribution Order</h3>
                <p className="text-xs text-slate-500">Enter custom selling rate or discount for bulk buyers</p>
              </div>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Medical Store</label>
                <select
                  required
                  value={form.vendorId}
                  onChange={e => setForm({ ...form, vendorId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">Select customer...</option>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine / Product</label>
                <select
                  required
                  value={form.productId}
                  onChange={e => {
                    const pId = e.target.value;
                    const prod = products?.find(p => p._id === pId);
                    const defaultRate = prod?.salePricePaisa ? (prod.salePricePaisa / 100).toFixed(2) : '';
                    setForm({ ...form, productId: pId, unitPricePKR: defaultRate });
                  }}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">Select product...</option>
                  {products?.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) — Standard TP: PKR {(p.salePricePaisa / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Selling Rate (PKR)</span>
                    <span className="text-[10px] text-indigo-600 font-normal">Editable</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.unitPricePKR}
                    onChange={e => setForm({ ...form, unitPricePKR: e.target.value })}
                    className="w-full px-3 py-2 border border-indigo-300 bg-indigo-50/30 rounded-xl text-sm font-semibold text-slate-900"
                    placeholder="e.g. 29.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={form.discountPercent}
                      onChange={e => setForm({ ...form, discountPercent: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm pr-7"
                      placeholder="0"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Flat Discount (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.discountFlatPKR}
                    onChange={e => setForm({ ...form, discountFlatPKR: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Dynamic Live Price Breakdown */}
              {(() => {
                const prev = calculatePreview(form);
                return (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="font-semibold text-slate-800 pb-1 border-b border-slate-200 flex justify-between">
                      <span>Order Price Calculation:</span>
                      <span className="text-slate-500 font-normal">Trade Price: PKR {prev.standardTP.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Agreed Rate x Qty:</span>
                      <span className="font-mono">PKR {prev.rate.toFixed(2)} x {prev.qty} = PKR {prev.lineGross.toFixed(2)}</span>
                    </div>
                    {prev.totalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount Applied:</span>
                        <span className="font-semibold font-mono">- PKR {prev.totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-700">
                      <span>Net Subtotal:</span>
                      <span className="font-semibold font-mono">PKR {prev.lineNet.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-indigo-700">
                      <span>Tax (1% Auto-Calculated):</span>
                      <span className="font-semibold font-mono">PKR {prev.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-sm">
                      <span>Total Invoice Amount:</span>
                      <span className="text-emerald-700 font-mono">PKR {prev.grandTotal.toFixed(2)}</span>
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
                  {createMutation.isPending ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Edit Order</h3>
                <p className="text-xs text-slate-500">Order: {editForm.orderNumber}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateOrderMutation.mutate(editForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Medical Store</label>
                <select
                  required
                  value={editForm.vendorId}
                  onChange={e => setEditForm({ ...editForm, vendorId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
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
                  value={editForm.warehouseId}
                  onChange={e => setEditForm({ ...editForm, warehouseId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  {warehouses?.map(w => (
                    <option key={w?._id} value={w?._id}>
                      {w?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine / Product</label>
                <select
                  required
                  value={editForm.productId}
                  onChange={e => {
                    const pId = e.target.value;
                    const prod = products?.find(p => p._id === pId);
                    const defaultRate = prod?.salePricePaisa ? (prod.salePricePaisa / 100).toFixed(2) : '';
                    setEditForm({ ...editForm, productId: pId, unitPricePKR: defaultRate });
                  }}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  {products?.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) — Standard TP: PKR {(p.salePricePaisa / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Order Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.quantity}
                    onChange={e => setEditForm({ ...editForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Rate (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editForm.unitPricePKR}
                    onChange={e => setEditForm({ ...editForm, unitPricePKR: e.target.value })}
                    className="w-full px-3 py-2 border border-indigo-300 bg-indigo-50/30 rounded-xl text-sm font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={editForm.discountPercent}
                      onChange={e => setEditForm({ ...editForm, discountPercent: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm pr-7"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Flat Discount (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.discountFlatPKR}
                    onChange={e => setEditForm({ ...editForm, discountFlatPKR: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Dynamic Live Price Breakdown for Edit */}
              {(() => {
                const prev = calculatePreview(editForm);
                return (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="font-semibold text-slate-800 pb-1 border-b border-slate-200 flex justify-between">
                      <span>Updated Price Preview:</span>
                      <span className="text-slate-500 font-normal">Trade Price: PKR {prev.standardTP.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Rate x Qty:</span>
                      <span className="font-mono">PKR {prev.rate.toFixed(2)} x {prev.qty} = PKR {prev.lineGross.toFixed(2)}</span>
                    </div>
                    {prev.totalDiscount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount Applied:</span>
                        <span className="font-semibold font-mono">- PKR {prev.totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-700">
                      <span>Net Subtotal:</span>
                      <span className="font-semibold font-mono">PKR {prev.lineNet.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-indigo-700">
                      <span>Tax (1% Auto):</span>
                      <span className="font-semibold font-mono">PKR {prev.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-sm">
                      <span>Total Amount:</span>
                      <span className="text-emerald-700 font-mono">PKR {prev.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateOrderMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
                >
                  {updateOrderMutation.isPending ? 'Updating...' : 'Save Order Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
