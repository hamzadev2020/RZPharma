import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Building2,
  Truck,
  FileCheck2,
  Receipt,
  CreditCard,
  RotateCcw,
  Users,
  BarChart3,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isWarehouseStaff = user?.role === 'WAREHOUSE_STAFF';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, show: true },
    { name: 'Warehouses', path: '/warehouses', icon: Building2, show: true },
    { name: 'Products', path: '/products', icon: Package, show: true },
    { name: 'Stock & Batches', path: '/stock', icon: Warehouse, show: true },
    { name: 'Distribution Orders', path: '/orders', icon: Truck, show: true },
    { name: 'Delivery Challans', path: '/challans', icon: FileCheck2, show: true },
    { name: 'Returns & Damages', path: '/returns', icon: RotateCcw, show: true },
    { name: 'Invoices', path: '/invoices', icon: Receipt, show: !isWarehouseStaff },
    { name: 'Payments', path: '/payments', icon: CreditCard, show: !isWarehouseStaff },
    { name: 'Customers & Ledger', path: '/vendors', icon: Users, show: !isWarehouseStaff },
    { name: 'Reports & Aging', path: '/reports', icon: BarChart3, show: !isWarehouseStaff }
  ].filter(item => item.show);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col shadow-xl">
        <div className="p-5 flex items-center space-x-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-md">
            D
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide">DMS Portal</h1>
            <p className="text-xs text-slate-400">Distribution ERP</p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-semibold text-sm">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-900/80 text-indigo-300 border border-indigo-700/50">
              <ShieldCheck className="w-3 h-3 mr-1" />
              {user?.role}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              MongoDB Replica Set: Connected
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-slate-400">Asia/Karachi (PKR Paisa)</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
