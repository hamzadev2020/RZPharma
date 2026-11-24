import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Warehouse, Plus, MapPin, Package, CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function WarehousesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    code: '',
    name: '',
    address: ''
  });

  const isWarehouseStaff = user?.role === 'WAREHOUSE_STAFF';

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: async () => {
      const res = await api.get('/warehouses');
      return res.data.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/warehouses', payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['warehouses-list']);
      queryClient.invalidateQueries(['warehouses-dropdown']);
      setIsModalOpen(false);
      setForm({ code: '', name: '', address: '' });
      setNotification(`Warehouse "${res.data.data.name}" successfully created!`);
      setTimeout(() => setNotification(''), 4000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to create warehouse');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Warehouses & Depots</h1>
          <p className="text-sm text-slate-500">
            Physical distribution centers, fulfillment hubs, and multi-location inventory
          </p>
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
            <span>Add Warehouse</span>
          </button>
        )}
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Loading warehouses...</div>
        ) : warehouses?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">No warehouses configured yet</div>
        ) : (
          warehouses?.map((wh) => (
            <div
              key={wh._id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                    {wh.code}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mt-3">{wh.name}</h3>
                <div className="flex items-start space-x-1.5 text-xs text-slate-500 mt-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-slate-400" />
                  <span className="line-clamp-2">{wh.address || 'Address not specified'}</span>
                </div>
              </div>

              {/* Stock summary mini-table */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Total SKUs</span>
                  <p className="font-bold text-slate-800 text-sm">{wh.skuCount ?? 0}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">On Hand</span>
                  <p className="font-bold text-slate-800 text-sm">{wh.totalOnHand ?? 0}</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl">
                  <span className="text-[10px] uppercase font-semibold text-emerald-600">Available</span>
                  <p className="font-bold text-emerald-700 text-sm">{wh.totalAvailable ?? 0}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Warehouse Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-900">Add New Warehouse</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warehouse Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. WH-LHR-01"
                />
                <p className="text-[11px] text-slate-400 mt-1">Unique short identifier (e.g. WH-KHI-MAIN, WH-ISB-01)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warehouse Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Lahore Regional Depot"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physical Location / Address
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Plot 12, Industrial Estate, Multan Road, Lahore"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
