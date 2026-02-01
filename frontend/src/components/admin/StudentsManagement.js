import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Key } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function StudentsManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    roll_number: '',
    name: '',
    email: '',
    password: '',
    class_name: '',
    section: '',
    phone: '',
    parent_name: '',
    parent_phone: '',
    address: '',
    fee_amount: '',
  });
  const [passwordData, setPasswordData] = useState({ new_password: '' });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students');
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/students', formData);
      toast.success('Student added successfully');
      setShowAddModal(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add student');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/students/${selectedStudent.id}`, formData);
      toast.success('Student updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchStudents();
    } catch (error) {
      toast.error('Failed to update student');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to delete student');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/students/${selectedStudent.id}/reset-password`, {
        student_id: selectedStudent.id,
        new_password: passwordData.new_password,
      });
      toast.success('Password reset successfully');
      setShowPasswordModal(false);
      setPasswordData({ new_password: '' });
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setFormData({
      roll_number: student.roll_number,
      name: student.name,
      email: student.email,
      class_name: student.class_name,
      section: student.section,
      phone: student.phone,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      address: student.address,
      fee_amount: student.fee_amount,
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (student) => {
    setSelectedStudent(student);
    setShowPasswordModal(true);
  };

  const resetForm = () => {
    setFormData({
      roll_number: '',
      name: '',
      email: '',
      password: '',
      class_name: '',
      section: '',
      phone: '',
      parent_name: '',
      parent_phone: '',
      address: '',
      fee_amount: '',
    });
    setSelectedStudent(null);
  };

  if (loading) {
    return <div className="font-outfit">Loading...</div>;
  }

  return (
    <div data-testid="students-management">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-fredoka font-bold text-sunny-navy">Students Management</h1>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button
              className="bg-sunny-yellow text-sunny-navy font-bold rounded-full px-6 py-2 neo-brutal-shadow hover:bg-sunny-yellow"
              data-testid="add-student-button"
            >
              <Plus size={18} className="mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-student-modal">
            <DialogHeader>
              <DialogTitle className="text-2xl font-fredoka font-bold text-sunny-navy">Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Roll Number *</label>
                  <Input
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    required
                    data-testid="add-roll-number"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="add-name"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="add-email"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Password *</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="add-password"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Class *</label>
                  <Input
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    required
                    data-testid="add-class"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Section *</label>
                  <Input
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    required
                    data-testid="add-section"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Phone *</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    data-testid="add-phone"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Name *</label>
                  <Input
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    required
                    data-testid="add-parent-name"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Phone *</label>
                  <Input
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    required
                    data-testid="add-parent-phone"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Fee Amount *</label>
                  <Input
                    type="number"
                    value={formData.fee_amount}
                    onChange={(e) => setFormData({ ...formData, fee_amount: e.target.value })}
                    required
                    data-testid="add-fee-amount"
                  />
                </div>
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Address *</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  data-testid="add-address"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-sunny-yellow text-sunny-navy font-bold rounded-full py-2 hover:bg-sunny-yellow"
                data-testid="submit-add-student"
              >
                Add Student
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden" data-testid="students-table">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Roll No</th>
                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Name</th>
                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Email</th>
                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Class</th>
                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Fee Status</th>
                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t hover:bg-gray-50">
                  <td className="font-outfit text-gray-900 py-3 px-4">{student.roll_number}</td>
                  <td className="font-outfit text-gray-900 py-3 px-4">{student.name}</td>
                  <td className="font-outfit text-gray-600 py-3 px-4">{student.email}</td>
                  <td className="font-outfit text-gray-900 py-3 px-4">
                    {student.class_name}-{student.section}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-outfit ${
                        student.fee_status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {student.fee_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(student)}
                        className="text-sunny-blue hover:text-sunny-navy"
                        data-testid={`edit-student-${student.id}`}
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => openPasswordModal(student)}
                        className="text-sunny-orange hover:text-sunny-navy"
                        data-testid={`reset-password-${student.id}`}
                      >
                        <Key size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-500 hover:text-red-700"
                        data-testid={`delete-student-${student.id}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="edit-student-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-fredoka font-bold text-sunny-navy">Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Roll Number</label>
                <Input
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  data-testid="edit-roll-number"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="edit-name"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="edit-email"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Class</label>
                <Input
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  data-testid="edit-class"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Section</label>
                <Input
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  data-testid="edit-section"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="edit-phone"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Name</label>
                <Input
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  data-testid="edit-parent-name"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Phone</label>
                <Input
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  data-testid="edit-parent-phone"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Fee Amount</label>
                <Input
                  type="number"
                  value={formData.fee_amount}
                  onChange={(e) => setFormData({ ...formData, fee_amount: e.target.value })}
                  data-testid="edit-fee-amount"
                />
              </div>
            </div>
            <div>
              <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Address</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                data-testid="edit-address"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-sunny-yellow text-sunny-navy font-bold rounded-full py-2 hover:bg-sunny-yellow"
              data-testid="submit-edit-student"
            >
              Update Student
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent data-testid="password-reset-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-fredoka font-bold text-sunny-navy">Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
            <div>
              <label className="block font-outfit font-medium text-gray-700 mb-2">New Password</label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ new_password: e.target.value })}
                required
                data-testid="new-password-input"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-sunny-yellow text-sunny-navy font-bold rounded-full py-2 hover:bg-sunny-yellow"
              data-testid="submit-reset-password"
            >
              Reset Password
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}