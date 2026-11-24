import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Users, Search, Plus, X, Building2, Phone, CheckCircle2, AlertCircle, Edit, Trash2 } from 'lucide-react';

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [form, setForm] = useState({
    code: '',
    name: '',
    phone: '',
    contactPerson: '',
    city: '',
    paymentTermsDays: 30,
    creditLimitPKR: 100000
  });

  const [editForm, setEditForm] = useState({
    id: '',
    code: '',
    name: '',
    phone: '',
    contactPerson: '',
    city: '',
    paymentTermsDays: 30,
    creditLimitPKR: 100000
  });

  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors-list', search],
    queryFn: async () => {
      const res = await api.get(`/vendors?search=${encodeURIComponent(search)}`);
      return res.data.data;
    }
  });

  const { data: nextCodeData } = useQuery({
    queryKey: ['vendors-next-code'],
    queryFn: async () => {
      const res = await api.get('/vendors/next-code');
      return res.data.data?.nextCode;
    },
    enabled: isModalOpen
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/vendors', {
        code: payload.code ? payload.code.trim() : '',
        name: payload.name.trim(),
        phone: payload.phone ? payload.phone.trim() : '',
        contactPerson: payload.contactPerson ? payload.contactPerson.trim() : '',
        address: { city: payload.city ? payload.city.trim() : '' },
        paymentTermsDays: Number(payload.paymentTermsDays),
        creditLimitPaisa: Math.round(Number(payload.creditLimitPKR || 0) * 100)
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['vendors-list']);
      queryClient.invalidateQueries(['vendors-next-code']);
      setIsModalOpen(false);
      setErrorMessage('');
      setForm({
        code: '',
        name: '',
        phone: '',
        contactPerson: '',
        city: '',
        paymentTermsDays: 30,
        creditLimitPKR: 100000
      });
      setNotification(`Customer registered successfully with ID: ${res.data.data.code}`);
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || 'Failed to add customer';
      setErrorMessage(`❌ Error: ${msg}`);
      setTimeout(() => setErrorMessage(''), 6000);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (payload) => {
      return api.put(`/vendors/${payload.id}`, {
        name: payload.name.trim(),
        phone: payload.phone ? payload.phone.trim() : '',
        contactPerson: payload.contactPerson ? payload.contactPerson.trim() : '',
        address: { city: payload.city ? payload.city.trim() : '' },
        paymentTermsDays: Number(payload.paymentTermsDays),
        creditLimitPaisa: Math.round(Number(payload.creditLimitPKR || 0) * 100)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors-list']);
      setIsEditModalOpen(false);
      setErrorMessage('');
      setNotification('Customer details updated successfully!');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || 'Failed to update customer';
      setErrorMessage(`❌ Error: ${msg}`);
      setTimeout(() => setErrorMessage(''), 6000);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (vendorId) => {
      return api.delete(`/vendors/${vendorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors-list']);
      queryClient.invalidateQueries(['vendors-next-code']);
      setErrorMessage('');
      setNotification('Customer successfully deleted!');
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || 'Failed to delete customer';
      setErrorMessage(`❌ Error: ${msg}`);
      setTimeout(() => setErrorMessage(''), 6000);
    }
  });

  const formatPKR = (paisa = 0) => {
    return `PKR ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  const handleOpenEdit = (v) => {
    setEditForm({
      id: v._id,
      code: v.code,
      name: v.name,
      phone: v.phone || '',
      contactPerson: v.contactPerson || '',
      city: v.address?.city || '',
      paymentTermsDays: v.paymentTermsDays || 30,
      creditLimitPKR: (v.creditLimitPaisa || 0) / 100
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (v) => {
    if (window.confirm(`Are you sure you want to delete customer "${v.name}" (ID: ${v.code})?`)) {
      deleteMutation.mutate(v._id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers & Debtors Ledger</h1>
          <p className="text-sm text-slate-500">
            Registered wholesale retail stores, credit limits, and Customer IDs (Starting from 700)
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMessage('');
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
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

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by customer name or ID..."
          className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Customer ID</th>
                <th className="px-6 py-4">Store / Business Name</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">City / Area</th>
                <th className="px-6 py-4">Payment Terms</th>
                <th className="px-6 py-4">Credit Limit</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading customers...</td>
                </tr>
              ) : vendors?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No customers registered yet</td>
                </tr>
              ) : (
                vendors?.map(v => (
                  <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-indigo-700 bg-indigo-50/40">
                      {v.code}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{v.name}</td>
                    <td className="px-6 py-4">{v.contactPerson || '—'}</td>
                    <td className="px-6 py-4 text-xs font-mono">{v.phone || '—'}</td>
                    <td className="px-6 py-4">{v.address?.city || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {v.paymentTermsDays} Days
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatPKR(v.creditLimitPaisa)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                        title="Edit Customer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(v)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add New Customer</h3>
                <p className="text-xs text-slate-500">Auto-numbered sequence starting from 700</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                createMutation.mutate(form);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer ID (Auto-Generated)
                </label>
                <input
                  type="text"
                  disabled
                  value={nextCodeData ? `${nextCodeData} (Auto)` : 'Auto (e.g. 701)'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono font-bold text-indigo-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Store / Medical Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saleem Medical Store"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Saleem"
                  value={form.contactPerson}
                  onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="0336-7388274"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City / Area
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Donali Haripur"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.paymentTermsDays}
                    onChange={e => setForm({ ...form, paymentTermsDays: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Credit Limit (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.creditLimitPKR}
                    onChange={e => setForm({ ...form, creditLimitPKR: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Customer</h3>
                <p className="text-xs text-slate-500">Update details for Customer ID: {editForm.code}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                updateMutation.mutate(editForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer ID
                </label>
                <input
                  type="text"
                  disabled
                  value={editForm.code}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Store / Medical Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={editForm.contactPerson}
                  onChange={e => setEditForm({ ...editForm, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    City / Area
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Terms (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.paymentTermsDays}
                    onChange={e => setEditForm({ ...editForm, paymentTermsDays: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Credit Limit (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.creditLimitPKR}
                    onChange={e => setEditForm({ ...editForm, creditLimitPKR: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
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
