import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { User, Lock, CreditCard, LogOut, GraduationCap, Home } from 'lucide-react';
import { toast } from 'sonner';
import { getUser, logout } from '@/utils/auth';
import StudentProfile from '@/components/student/StudentProfile';
import ChangePassword from '@/components/student/ChangePassword';
import FeePayment from '@/components/student/FeePayment';
import StudentOverview from '@/components/student/StudentOverview';

export default function StudentDashboard() {
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
    <div className="min-h-screen bg-sunny-cream" data-testid="student-dashboard">
      {/* Header */}
      <header className="bg-white border-b-2 border-sunny-navy" data-testid="student-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-sunny-yellow rounded-full flex items-center justify-center neo-brutal-shadow">
                <GraduationCap className="w-7 h-7 text-sunny-navy" />
              </div>
              <div>
                <span className="text-2xl font-fredoka font-bold text-sunny-navy">Student Portal</span>
                {user && (
                  <p className="font-outfit text-sm text-gray-600" data-testid="student-welcome">
                    Welcome, {user.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-sunny-navy text-white font-bold rounded-full px-6 py-2 hover:bg-opacity-90 transition-colors"
              data-testid="student-logout-button"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200" data-testid="student-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link
              to="/student"
              className="flex items-center space-x-2 py-4 border-b-2 border-transparent hover:border-sunny-yellow font-outfit text-gray-700 hover:text-sunny-navy"
              data-testid="student-nav-overview"
            >
              <Home size={18} />
              <span>Overview</span>
            </Link>
            <Link
              to="/student/profile"
              className="flex items-center space-x-2 py-4 border-b-2 border-transparent hover:border-sunny-yellow font-outfit text-gray-700 hover:text-sunny-navy"
              data-testid="student-nav-profile"
            >
              <User size={18} />
              <span>Profile</span>
            </Link>
            <Link
              to="/student/pay-fee"
              className="flex items-center space-x-2 py-4 border-b-2 border-transparent hover:border-sunny-yellow font-outfit text-gray-700 hover:text-sunny-navy"
              data-testid="student-nav-fees"
            >
              <CreditCard size={18} />
              <span>Pay Fees</span>
            </Link>
            <Link
              to="/student/change-password"
              className="flex items-center space-x-2 py-4 border-b-2 border-transparent hover:border-sunny-yellow font-outfit text-gray-700 hover:text-sunny-navy"
              data-testid="student-nav-password"
            >
              <Lock size={18} />
              <span>Change Password</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="student-content">
        <Routes>
          <Route index element={<StudentOverview />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="pay-fee" element={<FeePayment />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Routes>
      </div>
    </div>
  );
}