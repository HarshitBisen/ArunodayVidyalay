import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { UserCircle, Lock, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/utils/api';
import { login as authLogin } from '@/utils/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', formData);
      const { user_type, user } = response.data;
      authLogin(null, user_type, user);
      toast.success(`Welcome ${user.name}!`);
      
      if (user_type === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-sunny-cream flex items-center justify-center p-4" data-testid="login-page">
      <div className="grain-texture absolute inset-0"></div>
      
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 relative z-10">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex flex-col justify-center p-12 bg-white rounded-3xl border-2 border-sunny-navy feature-card-shadow"
        >
          <Link to="/" className="flex items-center space-x-3 mb-8">
            <div className="w-16 h-16 bg-sunny-yellow rounded-full flex items-center justify-center neo-brutal-shadow">
              <GraduationCap className="w-9 h-9 text-sunny-navy" />
            </div>
            <span className="text-3xl font-fredoka font-bold text-sunny-navy">Arunoday Vidyalay</span>
          </Link>
          <h2 className="text-4xl font-fredoka font-bold text-sunny-navy mb-4">
            Welcome to<br />Student Portal
          </h2>
          <p className="font-outfit text-gray-600 text-lg mb-8">
            Access your academic information, pay fees, and manage your profile all in one place.
          </p>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-sunny-yellow rounded-full"></div>
              <p className="font-outfit text-gray-600">View your profile and academic details</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-sunny-blue rounded-full"></div>
              <p className="font-outfit text-gray-600">Pay fees online securely</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-sunny-orange rounded-full"></div>
              <p className="font-outfit text-gray-600">Update your password anytime</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl p-8 md:p-12 border-2 border-sunny-navy feature-card-shadow"
          data-testid="login-form-container"
        >
          <h1 className="text-4xl font-fredoka font-bold text-sunny-navy mb-2">Login</h1>
          <p className="font-outfit text-gray-600 mb-8">Admin or Student Portal</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div data-testid="email-field">
              <label className="block font-outfit font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your.email@example.com"
                  className="w-full border-2 border-sunny-border rounded-lg pl-10 pr-4 py-3 focus:border-sunny-orange focus:ring-0 outline-none"
                  data-testid="login-email-input"
                />
              </div>
            </div>

            <div data-testid="password-field">
              <label className="block font-outfit font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full border-2 border-sunny-border rounded-lg pl-10 pr-4 py-3 focus:border-sunny-orange focus:ring-0 outline-none"
                  data-testid="login-password-input"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-sunny-yellow text-sunny-navy font-bold rounded-full px-8 py-3 neo-brutal-shadow hover:bg-sunny-yellow text-lg"
              data-testid="login-submit-button"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="space-y-2 text-sm font-outfit">
              <p className="text-gray-600">
              </p>
              <p className="text-gray-600 text-xs mt-2">
                Students can login with credentials provided by admin
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="font-outfit text-sunny-blue hover:text-sunny-navy">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}