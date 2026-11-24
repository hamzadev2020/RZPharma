import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  Receipt,
  Wallet,
  ArrowUpRight,
  Truck,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary');
      return res.data.data;
    },
    refetchInterval: 30000 // Refetch every 30s
  });

  const formatPKR = (paisa = 0) => {
    return `PKR ${(paisa / 100).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading Dashboard Metrics...</div>;
  }

  const isWarehouseStaff = user?.role === 'WAREHOUSE_STAFF';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Real-time Distribution & Inventory Control Center
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 sm:space-x-3 w-full sm:w-auto">
          <Link
            to="/orders"
            className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center space-x-2 shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </Link>
          <Link
            to="/stock"
            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center space-x-2 border border-slate-700 transition-all"
          >
            <PackageCheck className="w-4 h-4" />
            <span>Stock In</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Orders Today</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{data?.todayOrdersCount ?? 0}</p>
          <span className="inline-flex items-center text-xs text-slate-400 mt-1">Active allocation pipeline</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Dispatch</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{data?.pendingDispatchCount ?? 0}</p>
          <span className="inline-flex items-center text-xs text-amber-600 mt-1">Requires Delivery Challan</span>
        </div>

        {!isWarehouseStaff && (
          <>
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Receivables</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">
                {formatPKR(data?.financial?.totalOutstandingPaisa)}
              </p>
              <span className="inline-flex items-center text-xs text-slate-400 mt-1">Vendor balances due</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Collected</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-3">
                {formatPKR(data?.financial?.totalCollectedPaisa)}
              </p>
              <span className="inline-flex items-center text-xs text-emerald-600 mt-1">Payments received & cleared</span>
            </div>
          </>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          to="/stock"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Inventory & Warehouses
            </h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Multi-warehouse stock balances, FEFO batch tracking, and atomic transfers.
          </p>
        </Link>

        <Link
          to="/orders"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Order Fulfillment
            </h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            One order per vendor, conditional reservations, and dispatch challans.
          </p>
        </Link>

        {!isWarehouseStaff && (
          <Link
            to="/reports"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Financial Reports & Aging
              </h3>
              <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Receivables 30/60/90+ day aging, zero-delivery vendor segmentation, and stock valuation.
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
