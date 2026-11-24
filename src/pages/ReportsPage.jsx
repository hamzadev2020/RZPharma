import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { BarChart3, AlertOctagon, Warehouse, Clock } from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('aging');

  const { data: agingData, isLoading: agingLoading } = useQuery({
    queryKey: ['report-aging'],
    queryFn: async () => {
      const res = await api.get('/reports/aging');
      return res.data.data;
    },
    enabled: activeTab === 'aging'
  });

  const { data: notReceivedData, isLoading: notReceivedLoading } = useQuery({
    queryKey: ['report-not-received'],
    queryFn: async () => {
      const res = await api.get('/reports/not-received?fromDate=2026-01-01&toDate=2026-12-31');
      return res.data.data;
    },
    enabled: activeTab === 'notReceived'
  });

  const { data: valuationData, isLoading: valuationLoading } = useQuery({
    queryKey: ['report-valuation'],
    queryFn: async () => {
      const res = await api.get('/reports/valuation');
      return res.data.data;
    },
    enabled: activeTab === 'valuation'
  });

  const formatPKR = (paisa = 0) => {
    return `PKR ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Distribution & Financial Reports</h1>
        <p className="text-sm text-slate-500">
          Receivables aging buckets, zero-delivery customer analysis, and inventory valuation
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('aging')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'aging'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Receivables Aging (30/60/90+ Days)</span>
        </button>

        <button
          onClick={() => setActiveTab('notReceived')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'notReceived'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>BR19: Not-Received Vendors</span>
        </button>

        <button
          onClick={() => setActiveTab('valuation')}
          className={`pb-3 border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'valuation'
              ? 'border-indigo-600 text-indigo-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Stock Valuation (WAC)</span>
        </button>
      </div>

      {/* Tab 1: Aging */}
      {activeTab === 'aging' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Accounts Receivable Aging Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Current (Not Due)</th>
                  <th className="px-6 py-4">1–30 Days</th>
                  <th className="px-6 py-4">31–60 Days</th>
                  <th className="px-6 py-4">61–90 Days</th>
                  <th className="px-6 py-4 text-rose-600">91+ Days</th>
                  <th className="px-6 py-4 font-bold text-slate-900">Total Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agingLoading ? (
                  <tr><td colSpan={7} className="text-center py-8">Loading aging data...</td></tr>
                ) : agingData?.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400">No overdue receivables!</td></tr>
                ) : (
                  agingData?.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="px-6 py-4 font-semibold text-slate-900">{v.vendorName} ({v.vendorCode})</td>
                      <td className="px-6 py-4 text-emerald-700">{formatPKR(v.currentPaisa)}</td>
                      <td className="px-6 py-4">{formatPKR(v.days1to30Paisa)}</td>
                      <td className="px-6 py-4 text-amber-600">{formatPKR(v.days31to60Paisa)}</td>
                      <td className="px-6 py-4 text-orange-600">{formatPKR(v.days61to90Paisa)}</td>
                      <td className="px-6 py-4 font-bold text-rose-600">{formatPKR(v.days91PlusPaisa)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatPKR(v.totalOutstandingPaisa)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Not-Received */}
      {activeTab === 'notReceived' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Active Customers</span>
              <p className="text-2xl font-bold text-slate-900 mt-1">{notReceivedData?.summary?.totalActiveVendors || 0}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Ordered but 0 Delivered</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{notReceivedData?.summary?.orderedZeroDeliveredCount || 0}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 uppercase font-semibold">Never Ordered In Period</span>
              <p className="text-2xl font-bold text-slate-700 mt-1">{notReceivedData?.summary?.neverOrderedCount || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">Vendors With Zero Received Goods</h3>
            </div>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Customer Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Segmentation Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notReceivedLoading ? (
                  <tr><td colSpan={4} className="text-center py-8">Loading report...</td></tr>
                ) : (
                  [...(notReceivedData?.orderedZeroDelivered || []), ...(notReceivedData?.neverOrdered || [])].map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-mono font-medium">{v.code}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{v.name}</td>
                      <td className="px-6 py-4 text-xs font-mono">{v.phone || '—'}</td>
                      <td className="px-6 py-4">
                        {v.status === 'ORDERED_BUT_ZERO_DELIVERED' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            Ordered but Undelivered
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            Never Ordered
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Valuation */}
      {activeTab === 'valuation' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Weighted Average Cost (WAC) Valuation</h3>
            <span className="font-bold text-slate-900">
              Total Stock Value: {formatPKR(valuationData?.totalValuationPaisa)}
            </span>
          </div>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Warehouse</th>
                <th className="px-6 py-4">Product SKU</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">On Hand Qty</th>
                <th className="px-6 py-4">Unit Cost (WAC)</th>
                <th className="px-6 py-4 font-bold text-slate-900">Total Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {valuationLoading ? (
                <tr><td colSpan={6} className="text-center py-8">Loading valuation...</td></tr>
              ) : (
                valuationData?.lines?.map((line, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium">{line.warehouseCode}</td>
                    <td className="px-6 py-4 font-mono text-xs">{line.productSku}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{line.productName}</td>
                    <td className="px-6 py-4">{line.onHand}</td>
                    <td className="px-6 py-4">{formatPKR(line.unitCostPaisa)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{formatPKR(line.valuationPaisa)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
