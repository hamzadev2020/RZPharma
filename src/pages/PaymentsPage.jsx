import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { CreditCard, CheckCircle2, Plus, X, Wallet, AlertCircle, ArrowDownCircle } from 'lucide-react';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState('');

  const [form, setForm] = useState({
    vendorId: '',
    amountPKR: '',
    method: 'CASH',
    chequeNumber: '',
    bankName: '',
    referenceNumber: ''
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments-list'],
    queryFn: async () => {
      const res = await api.get('/payments');
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

  const { data: invoices } = useQuery({
    queryKey: ['invoices-list'],
    queryFn: async () => {
      const res = await api.get('/invoices');
      return res.data.data;
    }
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (payload) => {
      const key = `PAY-${Date.now()}`;
      return api.post('/payments', payload, {
        headers: { 'Idempotency-Key': key }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments-list']);
      queryClient.invalidateQueries(['invoices-list']);
      queryClient.invalidateQueries(['vendors']);
      setIsModalOpen(false);
      setNotification('Payment recorded! Invoices updated and remaining balance adjusted.');
      setTimeout(() => setNotification(''), 4000);
    }
  });

  const clearChequeMutation = useMutation({
    mutationFn: async (paymentId) => {
      const key = `CHQ-CLR-${Date.now()}`;
      return api.post(`/payments/${paymentId}/clear-cheque`, {}, {
        headers: { 'Idempotency-Key': key }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments-list']);
      queryClient.invalidateQueries(['invoices-list']);
      setNotification('Cheque cleared! Invoice outstanding balance reduced.');
      setTimeout(() => setNotification(''), 4000);
    }
  });

  const formatPKR = (paisa = 0) => {
    return `PKR ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  const handleRecord = (e) => {
    e.preventDefault();
    createPaymentMutation.mutate({
      vendorId: form.vendorId,
      amountPaisa: Math.round(Number(form.amountPKR) * 100),
      method: form.method,
      referenceNumber: form.referenceNumber,
      chequeDetails: form.method === 'CHEQUE' ? {
        chequeNumber: form.chequeNumber,
        bankName: form.bankName,
        chequeDate: new Date()
      } : null
    });
  };

  // Helper to compute selected customer outstanding balance
  const selectedCustomerInvoices = invoices?.filter(inv => {
    const vId = inv.vendorId?._id || inv.vendorId;
    return vId === form.vendorId && inv.documentStatus === 'ISSUED';
  }) || [];

  const customerTotalDuePaisa = selectedCustomerInvoices.reduce((sum, inv) => sum + (inv.outstandingPaisa || 0), 0);
  const enteredAmountPaisa = Math.round((Number(form.amountPKR) || 0) * 100);
  const remainingDuePaisa = Math.max(0, customerTotalDuePaisa - enteredAmountPaisa);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Collections & Payments</h1>
          <p className="text-sm text-slate-500">
            Payment receipts, partial payment balance tracking, cheque clearing, and invoice allocation
          </p>
        </div>
        <button
          onClick={() => {
            if (vendors?.length) {
              setForm({
                vendorId: vendors[0]._id,
                amountPKR: '',
                method: 'CASH',
                chequeNumber: '',
                bankName: '',
                referenceNumber: ''
              });
            }
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center space-x-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Collection</span>
        </button>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Receipt #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Method & Ref</th>
                <th className="px-6 py-4">Amount Collected</th>
                <th className="px-6 py-4">Allocated to Bills</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">Loading payments...</td>
                </tr>
              ) : payments?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">No payment records found</td>
                </tr>
              ) : (
                payments?.map(pay => (
                  <tr key={pay._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{pay.paymentNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {pay.vendorId?.name}
                      {pay.vendorId?.code && (
                        <span className="block text-xs font-mono text-indigo-600 font-normal">ID: {pay.vendorId.code}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-xs text-slate-900 block">{pay.method}</span>
                      {pay.chequeDetails?.chequeNumber && (
                        <p className="text-xs text-slate-500 font-mono">Chq: {pay.chequeDetails.chequeNumber} ({pay.chequeDetails.bankName})</p>
                      )}
                      {pay.referenceNumber && (
                        <p className="text-xs text-slate-400">{pay.referenceNumber}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{formatPKR(pay.amountPaisa)}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{formatPKR(pay.allocatedPaisa)}</span>
                      {pay.unallocatedPaisa > 0 && (
                        <span className="block text-[11px] text-blue-600 font-medium">
                          + {formatPKR(pay.unallocatedPaisa)} Advance
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {pay.status === 'CLEARED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          CLEARED
                        </span>
                      ) : pay.status === 'RECEIVED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          PENDING CHQ
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          {pay.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {pay.method === 'CHEQUE' && pay.chequeDetails?.clearingStatus === 'PENDING' && (
                        <button
                          onClick={() => clearChequeMutation.mutate(pay._id)}
                          disabled={clearChequeMutation.isPending}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-xs"
                        >
                          Clear Cheque
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

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Record Customer Payment</h3>
                <p className="text-xs text-slate-500">Collect full or partial cash/cheque and auto-settle invoices</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecord} className="mt-4 space-y-4">
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

              {/* Customer Outstanding Balance Card */}
              {form.vendorId && (
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-indigo-950">Customer Total Balance Due (Kul Baqaya):</span>
                    <span className="font-bold text-sm font-mono text-rose-700">{formatPKR(customerTotalDuePaisa)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Pending Invoices:</span>
                    <span>{selectedCustomerInvoices.length} unpaid bill(s)</span>
                  </div>

                  {enteredAmountPaisa > 0 && (
                    <div className="pt-2 border-t border-indigo-200/60 flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800">Remaining Balance After This Collection:</span>
                      <span className={`font-mono font-bold ${remainingDuePaisa === 0 ? 'text-emerald-700' : 'text-amber-800'}`}>
                        {remainingDuePaisa === 0 ? 'PKR 0.00 (Fully Settled!)' : formatPKR(remainingDuePaisa)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Amount (PKR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={form.amountPKR}
                    onChange={e => setForm({ ...form, amountPKR: e.target.value })}
                    className="w-full px-3 py-2 border border-emerald-300 bg-emerald-50/20 rounded-xl text-sm font-bold text-emerald-900"
                    placeholder="e.g. 50000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={form.method}
                    onChange={e => setForm({ ...form, method: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online Portal</option>
                  </select>
                </div>
              </div>

              {form.method === 'CHEQUE' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Cheque Number</label>
                    <input
                      type="text"
                      required
                      value={form.chequeNumber}
                      onChange={e => setForm({ ...form, chequeNumber: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                      placeholder="CHQ-889900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={form.bankName}
                      onChange={e => setForm({ ...form, bankName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                      placeholder="HBL / Meezan"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Note</label>
                <input
                  type="text"
                  value={form.referenceNumber}
                  onChange={e => setForm({ ...form, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  placeholder="e.g. Received partial cash by recovery officer"
                />
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
                  disabled={createPaymentMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 shadow-xs"
                >
                  {createPaymentMutation.isPending ? 'Recording Collection...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
