import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Receipt, FileDown, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices-list'],
    queryFn: async () => {
      const res = await api.get('/invoices');
      return res.data.data;
    }
  });

  const issueMutation = useMutation({
    mutationFn: async (invoiceId) => {
      const key = `ISSUE-${Date.now()}`;
      return api.post(`/invoices/${invoiceId}/issue`, {}, {
        headers: { 'Idempotency-Key': key }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices-list']);
      setNotification('Invoice officially issued and posted to Vendor Accounts Receivable Ledger!');
      setTimeout(() => setNotification(''), 4000);
    }
  });

  const formatPKR = (paisa = 0) => {
    return `PKR ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  const handleDownloadPdf = async (invoiceId, invoiceNumber) => {
    try {
      setDownloadingId(invoiceId);
      const res = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Auto-trigger browser download to PC
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber || 'Invoice'}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      const token = localStorage.getItem('accessToken');
      if (token) {
        const baseUrl = import.meta.env.VITE_API_URL || '/api';
        window.open(`${baseUrl}/invoices/${invoiceId}/pdf?token=${encodeURIComponent(token)}`, '_blank');
      } else {
        alert('Could not download PDF. Please log in again.');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoices & Accounts Receivable</h1>
        <p className="text-sm text-slate-500">
          Official billing, partial collection balance tracking, 1% tax calculation, and PDF invoices
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
                <th className="px-6 py-4">Invoice #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Document Status</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4">Total Bill</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Remaining Balance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">Loading invoices...</td>
                </tr>
              ) : invoices?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">No invoices generated yet</td>
                </tr>
              ) : (
                invoices?.map(inv => (
                  <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 block">
                        {inv.vendorSnapshot?.name || inv.vendorId?.name || 'Customer'}
                      </span>
                      <span className="text-xs font-mono text-indigo-600 block">
                        ID: {inv.vendorSnapshot?.code || inv.vendorId?.code || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {inv.documentStatus === 'ISSUED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          ISSUED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          {inv.documentStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {inv.paymentStatus === 'PAID' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          PAID
                        </span>
                      ) : inv.paymentStatus === 'PARTIALLY_PAID' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          PARTIALLY PAID
                        </span>
                      ) : inv.isOverdue ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 flex items-center w-fit space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>OVERDUE</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          UNPAID
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{formatPKR(inv.grandTotalPaisa)}</td>
                    <td className="px-6 py-4 font-medium text-emerald-700">
                      {inv.paidPaisa > 0 ? formatPKR(inv.paidPaisa) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {inv.outstandingPaisa === 0 ? (
                        <span className="text-emerald-700 font-bold font-mono">PKR 0.00 (Cleared)</span>
                      ) : (
                        <span className="text-rose-600 font-bold font-mono">{formatPKR(inv.outstandingPaisa)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {inv.documentStatus === 'DRAFT' && (
                        <button
                          onClick={() => issueMutation.mutate(inv._id)}
                          disabled={issueMutation.isPending}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium shadow-xs"
                        >
                          Issue & Post
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPdf(inv._id, inv.invoiceNumber)}
                        disabled={downloadingId === inv._id}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center space-x-1 disabled:opacity-50"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        <span>{downloadingId === inv._id ? 'Opening...' : 'PDF'}</span>
                      </button>
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
