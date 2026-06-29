import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Plus, Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { getUser } from '@/utils/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Loader from '@/components/ui/loader';

export default function AdminsView() {
  const user = getUser();
  const canManageAdmins = Boolean(user?.is_super_admin);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await api.get('/admin/admins');
      setAdmins(res.data || []);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const resetForm = () => setFormData({ name: '', email: '', password: '' });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canManageAdmins) {
      toast.error('Only super admin can add admins');
      return;
    }
    if (!formData.email?.trim() || !formData.name?.trim() || !formData.password) {
      toast.error('Name, email and password are required');
      return;
    }

    setSaving(true);
    try {
      await api.post('/admin/admins', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      toast.success('Admin created');
      setShowAddModal(false);
      resetForm();
      setLoading(true);
      fetchAdmins();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="admins-view">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-fredoka font-bold text-sunny-navy">Admins</h1>
          <p className="font-outfit text-gray-600 mt-1">Manage admin accounts</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-sunny-yellow text-sunny-navy font-bold rounded-full px-6 py-3 neo-brutal-shadow hover:bg-sunny-yellow disabled:opacity-60"
          data-testid="add-admin-button"
          disabled={!canManageAdmins}
          title={!canManageAdmins ? 'Only super admin can add admins' : 'Add admin'}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Admin
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-sunny-border" data-testid="admins-table">
        {loading ? (
          <Loader compact message="Loading admins" />
        ) : admins.length === 0 ? (
          <div className="p-10 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="font-outfit text-gray-600">No admins found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Name</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Email</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Created</th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-t hover:bg-gray-50" data-testid={`admin-row-${admin.id}`}>
                    <td className="font-outfit text-gray-900 py-3 px-4">{admin.name || 'N/A'}</td>
                    <td className="font-outfit text-gray-700 py-3 px-4">{admin.email}</td>
                    <td className="font-outfit text-gray-600 py-3 px-4">
                      {admin.created_at ? new Date(admin.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="bg-white border-sunny-border text-sunny-navy hover:bg-sunny-cream/60 hover:text-sunny-navy disabled:opacity-60"
                        disabled={!canManageAdmins}
                        title={!canManageAdmins ? 'Only super admin can reset admin passwords' : 'Reset password'}
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setNewPassword('');
                          setShowNewPassword(false);
                          setShowResetModal(true);
                        }}
                        data-testid={`admin-reset-${admin.id}`}
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Reset Password
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg" data-testid="add-admin-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-fredoka font-bold text-sunny-navy">Add Admin</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Name *</label>
              <Input
                className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="admin-name"
              />
            </div>
            <div>
              <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Email *</label>
              <Input
                className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="admin-email"
              />
            </div>
            <div>
              <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Password *</label>
              <Input
                className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                data-testid="admin-password"
              />
              <p className="mt-1 text-xs font-outfit text-gray-500">Minimum 6 characters</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-sunny-border text-sunny-navy hover:bg-sunny-cream/60 hover:text-sunny-navy"
                onClick={() => setShowAddModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-sunny-navy text-white hover:bg-sunny-navy/90"
                disabled={saving}
                data-testid="admin-save"
              >
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showResetModal}
        onOpenChange={(open) => {
          setShowResetModal(open);
          if (!open) {
            setSelectedAdmin(null);
            setNewPassword('');
            setShowNewPassword(false);
          }
        }}
      >
        <DialogContent className="max-w-lg" data-testid="reset-admin-password-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-fredoka font-bold text-sunny-navy">Reset Admin Password</DialogTitle>
          </DialogHeader>

          <div className="rounded-xl border border-sunny-border bg-sunny-cream/40 p-4">
            <div className="font-outfit text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Admin:</span>{' '}
              {selectedAdmin?.name || 'N/A'} {selectedAdmin?.email ? `(${selectedAdmin.email})` : ''}
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!canManageAdmins) {
                toast.error('Only super admin can reset admin passwords');
                return;
              }
              if (!selectedAdmin?.id) return;
              if (!newPassword || newPassword.length < 6) {
                toast.error('Password must be at least 6 characters');
                return;
              }

              setResetting(true);
              try {
                await api.post(`/admin/admins/${selectedAdmin.id}/reset-password`, { new_password: newPassword });
                toast.success('Password updated');
                setShowResetModal(false);
              } catch (error) {
                toast.error(error.response?.data?.detail || 'Failed to update password');
              } finally {
                setResetting(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">New Password *</label>
              <div className="relative">
                <Input
                  className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40 pr-12"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  data-testid="admin-new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center justify-center text-sunny-navy/70 hover:text-sunny-navy"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  data-testid="admin-toggle-password"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs font-outfit text-gray-500">Minimum 6 characters</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-sunny-border text-sunny-navy hover:bg-sunny-cream/60 hover:text-sunny-navy"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-sunny-navy text-white hover:bg-sunny-navy/90"
                disabled={resetting}
                data-testid="admin-reset-save"
              >
                {resetting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
