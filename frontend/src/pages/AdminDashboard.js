import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Users, LogOut, GraduationCap, UserPlus, CreditCard, Home } from 'lucide-react';
import { toast } from 'sonner';
import { getUser, logout } from '@/utils/auth';
import StudentsManagement from '@/components/admin/StudentsManagement';
import PaymentsView from '@/components/admin/PaymentsView';
import AdminOverview from '@/components/admin/AdminOverview';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-sunny-navy text-white" data-testid="admin-sidebar">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-sunny-yellow rounded-full flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-sunny-navy" />
            </div>
            <span className="text-xl font-fredoka font-bold">Admin Panel</span>
          </div>

          {user && (
            <div className="mb-8 p-4 bg-white bg-opacity-10 rounded-xl" data-testid="admin-user-info">
              <p className="font-outfit text-sm text-gray-300">Logged in as</p>
              <p className="font-outfit font-semibold">{user.name}</p>
              <p className="font-outfit text-xs text-gray-400">{user.email}</p>
            </div>
          )}

          <nav className="space-y-2" data-testid="admin-nav">
            <Link
              to="/admin"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
              data-testid="admin-nav-overview"
            >
              <Home size={20} />
              <span className="font-outfit">Overview</span>
            </Link>
            <Link
              to="/admin/students"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
              data-testid="admin-nav-students"
            >
              <Users size={20} />
              <span className="font-outfit">Students</span>
            </Link>
            <Link
              to="/admin/payments"
              className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
              data-testid="admin-nav-payments"
            >
              <CreditCard size={20} />
              <span className="font-outfit">Payments</span>
            </Link>
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors w-full mt-8"
            data-testid="admin-logout-button"
          >
            <LogOut size={20} />
            <span className="font-outfit">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64 p-8" data-testid="admin-content">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="students" element={<StudentsManagement />} />
          <Route path="payments" element={<PaymentsView />} />
        </Routes>
      </div>
    </div>
  );
}