import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/utils/api';

export default function ChangePassword() {
  const [formData, setFormData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (formData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/student/change-password', {
        old_password: formData.old_password,
        new_password: formData.new_password,
      });
      toast.success('Password changed successfully');
      setFormData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  return (
    <div data-testid="change-password">
      <h1 className="text-4xl font-fredoka font-bold text-sunny-navy mb-8">Change Password</h1>

      <div className="bg-white rounded-3xl p-8 border-2 border-sunny-navy feature-card-shadow max-w-2xl">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-sunny-yellow rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-sunny-navy" />
          </div>
          <div>
            <h2 className="text-2xl font-fredoka font-bold text-sunny-navy">Update Your Password</h2>
            <p className="font-outfit text-gray-600">Keep your account secure</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div data-testid="old-password-field">
            <label className="block font-outfit font-medium text-gray-700 mb-2">Current Password</label>
            <div className="relative">
              <Input
                type={showPasswords.old ? 'text' : 'password'}
                value={formData.old_password}
                onChange={(e) => setFormData({ ...formData, old_password: e.target.value })}
                required
                className="w-full border-2 border-sunny-border rounded-lg px-4 py-3 pr-12 focus:border-sunny-orange focus:ring-0 outline-none"
                data-testid="old-password-input"
              />
              <button
                type="button"
                onClick={() => togglePassword('old')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.old ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div data-testid="new-password-field">
            <label className="block font-outfit font-medium text-gray-700 mb-2">New Password</label>
            <div className="relative">
              <Input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                required
                className="w-full border-2 border-sunny-border rounded-lg px-4 py-3 pr-12 focus:border-sunny-orange focus:ring-0 outline-none"
                data-testid="new-password-input"
              />
              <button
                type="button"
                onClick={() => togglePassword('new')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="font-outfit text-sm text-gray-500 mt-1">Must be at least 6 characters</p>
          </div>

          <div data-testid="confirm-password-field">
            <label className="block font-outfit font-medium text-gray-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                required
                className="w-full border-2 border-sunny-border rounded-lg px-4 py-3 pr-12 focus:border-sunny-orange focus:ring-0 outline-none"
                data-testid="confirm-password-input"
              />
              <button
                type="button"
                onClick={() => togglePassword('confirm')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-sunny-yellow text-sunny-navy font-bold rounded-full px-8 py-3 neo-brutal-shadow hover:bg-sunny-yellow text-lg"
            data-testid="change-password-button"
          >
            {loading ? 'Updating...' : 'Change Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}