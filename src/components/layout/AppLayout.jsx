import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
    <div className="flex h-screen bg-slate-100 overflow-hidden relative">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Drawer on mobile, fixed on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl text-white shadow-md">
              D
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight tracking-wide">DMS Portal</h1>
              <p className="text-[11px] text-slate-400">RZ Pharma Distribution</p>
            </div>
          </div>
          {/* Close button on mobile drawer */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 mx-3 my-2 rounded-xl bg-slate-800/70 border border-slate-700/50 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-900/80 text-indigo-300 border border-indigo-700/50">
              <ShieldCheck className="w-3 h-3 mr-1 flex-shrink-0" />
              <span className="truncate">{user?.role}</span>
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shadow-xs z-10 flex-shrink-0">
          <div className="flex items-center space-x-3">
            {/* Hamburger Button (Mobile Only) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 hidden sm:inline">
                MongoDB Replica Set: Connected
              </span>
              <span className="text-xs font-bold text-slate-800 sm:hidden">
                DMS Portal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-400 hidden sm:inline">Asia/Karachi (PKR)</span>
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
