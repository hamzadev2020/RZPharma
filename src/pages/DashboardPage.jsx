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
  Plus,
  Coins,
  PackageX,
  Flame,
  Boxes
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
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            RZ Pharma Distribution ERP • Real-time Business Analytics
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

      {/* Row 1: Primary Business Metrics (Profit, Sales, Stock, Losses) */}
      {!isWarehouseStaff && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Gross Profit */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Profit (Munafa)</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-3">
              {formatPKR(data?.financial?.totalProfitPaisa || 0)}
            </p>
            <span className="inline-flex items-center text-xs text-slate-400 mt-1">Revenue − Cost of Goods</span>
          </div>

          {/* Card 2: Total Items Sold */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Items Sold (Bikri)</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              {data?.financial?.totalUnitsSold || 0} <span className="text-sm font-medium text-slate-500">units</span>
            </p>
            <span className="inline-flex items-center text-xs text-indigo-600 mt-1">
              Sales: {formatPKR(data?.financial?.totalRevenuePaisa || 0)}
            </span>
          </div>

          {/* Card 3: Total Stock In Godam */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stock In Warehouses</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              {data?.totalStockRemaining || 0} <span className="text-sm font-medium text-slate-500">available</span>
            </p>
            <span className="inline-flex items-center text-xs text-slate-400 mt-1">Across all depots & batches</span>
          </div>

          {/* Card 4: Losses & Returns */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Loss / Damaged Returns</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <PackageX className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-3">
              {formatPKR(data?.financial?.totalLossPaisa || 0)}
            </p>
            <span className="inline-flex items-center text-xs text-rose-500 mt-1">Damaged/Returned stock</span>
          </div>
        </div>
      )}

      {/* Row 2: Product Insights & Cashflow (Top Seller, Low Stock, Receivables, Collections) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Top Selling Medicine */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top Selling Medicine</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-3 truncate">
            {data?.financial?.topSellingProduct?.name || 'SAYXONE 1G INJECTION'}
          </p>
          <span className="inline-flex items-center text-xs text-amber-700 font-medium mt-1">
            {data?.financial?.topSellingProduct ? `${data.financial.topSellingProduct.qtySold} units sold` : 'High demand product'}
          </span>
        </div>

        {/* Lowest Stock Alert */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Stock Reorder Alert</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-3 truncate">
            {data?.lowestStockProduct?.name || 'All stock sufficient'}
          </p>
          <span className="inline-flex items-center text-xs text-orange-600 font-medium mt-1">
            {data?.lowestStockProduct ? `${data.lowestStockProduct.available} units remaining` : 'No immediate shortage'}
          </span>
        </div>

        {/* Total Receivables */}
        {!isWarehouseStaff && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Receivables (Baqaya)</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-3 truncate">
              {formatPKR(data?.financial?.totalOutstandingPaisa || 0)}
            </p>
            <span className="inline-flex items-center text-xs text-slate-400 mt-1">Customers unpaid balance</span>
          </div>
        )}

        {/* Total Collected */}
        {!isWarehouseStaff && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Collected (Vasooli)</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-3 truncate">
              {formatPKR(data?.financial?.totalCollectedPaisa || 0)}
            </p>
            <span className="inline-flex items-center text-xs text-teal-600 mt-1">Cleared in bank / cash</span>
          </div>
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
              Inventory & Batches
            </h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Multi-warehouse stock balances, Batch numbers, and Company restock entries.
          </p>
        </Link>

        <Link
          to="/orders"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Distribution Orders
            </h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Create store orders, allocate warehouse stock, and dispatch delivery challans.
          </p>
        </Link>

        <Link
          to="/invoices"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              RZ Pharma Invoices
            </h3>
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Official monthly invoices with Batch No, 1% auto tax, and legal warranty PDFKit.
          </p>
        </Link>
      </div>
    </div>
  );
}
