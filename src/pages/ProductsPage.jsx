import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Package, Search, Plus, X, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProductsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    sku: '',
    name: '',
    baseUnit: 'piece',
    cartonSize: 10,
    salePricePKR: '',
    costPricePKR: '',
    taxRatePercent: 1,
    reorderLevel: 20
  });

  const [editForm, setEditForm] = useState({
    id: '',
    sku: '',
    name: '',
    baseUnit: 'piece',
    cartonSize: 10,
    salePricePKR: '',
    costPricePKR: '',
    taxRatePercent: 1,
    reorderLevel: 20
  });

  const isWarehouseStaff = user?.role === 'WAREHOUSE_STAFF';

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await api.get(`/products?search=${encodeURIComponent(search)}`);
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['products-dropdown']);
      setIsModalOpen(false);
      setForm({
        sku: '',
        name: '',
        baseUnit: 'piece',
        cartonSize: 10,
        salePricePKR: '',
        costPricePKR: '',
        taxRatePercent: 1,
        reorderLevel: 20
      });
      setNotification('Product created successfully!');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to create product');
      setTimeout(() => setErrorMsg(''), 6000);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      return api.put(`/products/${payload.id}`, {
        name: payload.name.trim(),
        baseUnit: payload.baseUnit.trim(),
        cartonSize: Number(payload.cartonSize),
        salePricePaisa: Math.round(Number(payload.salePricePKR) * 100),
        costPricePaisa: Math.round(Number(payload.costPricePKR) * 100),
        taxRatePercent: Math.round(Number(payload.taxRatePercent) * 100),
        reorderLevel: Number(payload.reorderLevel)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['products-dropdown']);
      setIsEditModalOpen(false);
      setNotification('Product updated successfully!');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update product');
      setTimeout(() => setErrorMsg(''), 6000);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      return api.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['products-dropdown']);
      setNotification('Product deleted successfully!');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to delete product');
      setTimeout(() => setErrorMsg(''), 6000);
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    setErrorMsg('');
    createMutation.mutate({
      sku: form.sku.toUpperCase(),
      name: form.name,
      baseUnit: form.baseUnit,
      cartonSize: Number(form.cartonSize),
      salePricePaisa: Math.round(Number(form.salePricePKR) * 100),
      costPricePaisa: Math.round(Number(form.costPricePKR) * 100),
      taxRatePercent: Math.round(Number(form.taxRatePercent) * 100),
      reorderLevel: Number(form.reorderLevel)
    });
  };

  const handleOpenEdit = (p) => {
    setErrorMsg('');
    setEditForm({
      id: p._id,
      sku: p.sku,
      name: p.name,
      baseUnit: p.baseUnit || 'piece',
      cartonSize: p.cartonSize || 10,
      salePricePKR: (p.salePricePaisa || 0) / 100,
      costPricePKR: (p.costPricePaisa || 0) / 100,
      taxRatePercent: (p.taxRatePercent || 100) / 100,
      reorderLevel: p.reorderLevel || 20
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (p) => {
    if (window.confirm(`Are you sure you want to delete product "${p.name}" (${p.sku})?`)) {
      setErrorMsg('');
      deleteMutation.mutate(p._id);
    }
  };

  const formatPKR = (paisa = 0) => {
    return `PKR ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products & Catalog</h1>
          <p className="text-sm text-slate-500">Master product records, trade prices (TP), and unit measures</p>
        </div>
        {!isWarehouseStaff && (
          <button
            onClick={() => {
              setErrorMsg('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center space-x-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        )}
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by SKU or name..."
          className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Pack Size</th>
                {!isWarehouseStaff && <th className="px-6 py-4">Trade Price (TP)</th>}
                {!isWarehouseStaff && <th className="px-6 py-4">Cost Price</th>}
                <th className="px-6 py-4">Tax %</th>
                {!isWarehouseStaff && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading products...</td>
                </tr>
              ) : data?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No products found</td>
                </tr>
              ) : (
                data?.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-900">{p.sku}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                    <td className="px-6 py-4 uppercase text-xs">{p.baseUnit}</td>
                    <td className="px-6 py-4">{p.cartonSize} pcs/pk</td>
                    {!isWarehouseStaff && (
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {p.salePricePaisa !== undefined ? formatPKR(p.salePricePaisa) : '—'}
                      </td>
                    )}
                    {!isWarehouseStaff && (
                      <td className="px-6 py-4 text-slate-500">
                        {p.costPricePaisa !== undefined ? formatPKR(p.costPricePaisa) : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4">{((p.taxRatePercent || 0) / 100).toFixed(1)}%</td>
                    {!isWarehouseStaff && (
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Create New Product</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="e.g. SAYX-1G"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Base Unit *</label>
                  <input
                    type="text"
                    required
                    value={form.baseUnit}
                    onChange={e => setForm({ ...form, baseUnit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="piece"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  placeholder="e.g. SAYXONE 1G INJECTION"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Price (TP PKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.salePricePKR}
                    onChange={e => setForm({ ...form, salePricePKR: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="120.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.costPricePKR}
                    onChange={e => setForm({ ...form, costPricePKR: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="100.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.taxRatePercent}
                    onChange={e => setForm({ ...form, taxRatePercent: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Carton / Pack Size</label>
                  <input
                    type="number"
                    value={form.cartonSize}
                    onChange={e => setForm({ ...form, cartonSize: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                    placeholder="10"
                  />
                </div>
              </div>

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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Edit Product</h3>
                <p className="text-xs text-slate-500">SKU: {editForm.sku}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate(editForm);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Price (TP PKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editForm.salePricePKR}
                    onChange={e => setEditForm({ ...editForm, salePricePKR: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Price (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.costPricePKR}
                    onChange={e => setEditForm({ ...editForm, costPricePKR: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.taxRatePercent}
                    onChange={e => setEditForm({ ...editForm, taxRatePercent: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Carton / Pack Size</label>
                  <input
                    type="number"
                    value={editForm.cartonSize}
                    onChange={e => setEditForm({ ...editForm, cartonSize: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

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
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
