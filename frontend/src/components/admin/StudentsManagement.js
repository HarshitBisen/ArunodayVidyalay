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
    enrollment_number:'',
    roll_number: '',
    name: '',
    email: '',
    password: '',
    class_name: '',
    section: '',
    phone: '',
    address: '',
    parent_name: '',
    parent_phone: '',
    bus_opted:'',
    pickup_location:'',
    distance_school:'',
    new_student: ''
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
  
    const payload = { ...formData };
  
    // Convert empty email to null
    if (!payload.email || payload.email.trim() === '') {
      payload.email = null;   // or delete payload.email;
    }
  
    // Convert empty fee_amount if needed
    if (!payload.fee_amount) {
      payload.fee_amount = 0;
    }

    if (!payload.distance_school || payload.distance_school === "") {
      payload.distance_school = null;   // or 0 depending on your logic
    } else {
      payload.distance_school = parseFloat(payload.distance_school);
    }
  
    try {
      await api.post('/admin/students', payload);
  
      toast.success('Student added successfully');
      setShowAddModal(false);
      resetForm();
      fetchStudents();
  
    } catch (error) {
      const detail = error.response?.data?.detail;
  
      if (Array.isArray(detail)) {
        const message = detail.map(err => err.msg).join(", ");
        toast.error(message);
      } else if (typeof detail === "string") {
        toast.error(detail);
      } else {
        toast.error("Failed to add student");
      }
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
      email: student.email,
      class_name: student.class_name,
      section: student.section,
      phone: student.phone,
      address: student.address,
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      bus_opted: student.bus_opted,
      pickup_location: student.pickup_location,
      distance_school: student.distance_school,
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (student) => {
    setSelectedStudent(student);
    setShowPasswordModal(true);
  };

  const resetForm = () => {
    setFormData({
      enrollment_number:'',
      roll_number: '',
      name: '',
      email: '',
      password: '',
      class_name: '',
      section: '',
      phone: '',
      address: '',
      parent_name: '',
      parent_phone: '',
      bus_opted:'',
      pickup_location:'',
      distance_school:'',
      new_student: ''
    });
    setSelectedStudent(null);
  };

  const openAddModal = () => {
    resetForm();       // clear old edit data
    setShowAddModal(true);
  };

  if (loading) {
    return <div className="font-outfit">Loading...</div>;
  }

  return (
    <div data-testid="students-management">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-fredoka font-bold text-sunny-navy">Students Management</h1>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <Button
          onClick={openAddModal}
          className="bg-sunny-yellow text-sunny-navy font-bold rounded-full px-6 py-2 neo-brutal-shadow hover:bg-sunny-yellow"
          data-testid="add-student-button"
        >
          <Plus size={18} className="mr-2" />
          Add Student
        </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-student-modal">
            <DialogHeader>
              <DialogTitle className="text-2xl font-fredoka font-bold text-sunny-navy">Add New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Enrollment Number *</label>
                    <Input
                      className="bg-white w-full"
                      value={formData.enrollment_number}
                      onChange={(e) =>
                        setFormData({ ...formData, enrollment_number: e.target.value })
                      }
                      required
                      data-testid="add-enrollment-number"
                    />
                  </div>

                  <div>
                    <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Class Roll Number</label>
                    <Input
                      className="bg-white w-full"
                      value={formData.roll_number}
                      onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                      data-testid="add-roll-number"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Name *</label>
                  <Input
                    className="bg-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="add-name"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Email </label>
                  <Input
                    className="bg-white"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="add-email"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Password *</label>
                  <Input
                    className="bg-white"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="add-password"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">
                    Class *
                  </label>

                  <select
                    className="bg-white w-full border rounded-md px-3 py-2 font-outfit"
                    value={formData.class_name}
                    onChange={(e) =>
                      setFormData({ ...formData, class_name: e.target.value })
                    }
                    required
                    data-testid="add-class"
                  >
                    <option value="">Select Class</option>
                    <option value="Nursery">Nursery</option>
                    <option value="LKG">LKG</option>
                    <option value="UKG">UKG</option>
                    <option value="1">1st</option>
                    <option value="2">2nd</option>
                    <option value="3">3rd</option>
                    <option value="4">4th</option>
                    <option value="5">5th</option>
                    <option value="6">6th</option>
                    <option value="7">7th</option>
                  </select>
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Section</label>
                  <Input
                    className="bg-white"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    data-testid="add-section"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Phone</label>
                  <Input
                    className="bg-white"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="add-phone"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Permanent Address *</label>
                  <Input
                    className="bg-white"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    data-testid="add-address"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Name *</label>
                  <Input
                    className="bg-white"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    required
                    data-testid="add-parent-name"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Phone *</label>
                  <Input
                    className="bg-white"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    required
                    data-testid="add-parent-phone"
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Bus Service Opted *</label>
                  <select
                    value={formData.bus_opted}
                    onChange={(e) => {
                      const value = e.target.value;

                      setFormData({
                        ...formData,
                        bus_opted: value,
                        pickup_location: value === "yes" ? formData.pickup_location : "",
                        distance_school: value === "yes" ? formData.distance_school : ""
                      });
                    }}
                    required
                    className="w-full border border-gray-300 rounded-md p-2 text-sm">
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">New Student *</label>
                  <select
                    value={formData.new_student}
                    onChange={(e) => setFormData({ ...formData, new_student: e.target.value })}
                    required
                    className="w-full border border-gray-300 rounded-md p-2 text-sm">
                    <option value="">Select</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Pickup Location</label>
                  <Input
                    className="bg-white"
                    value={formData.pickup_location}
                    onChange={(e) =>
                      setFormData({ ...formData, pickup_location: e.target.value })
                    }
                    disabled={formData.bus_opted !== "yes"}
                  />
                </div>
                <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Distance from School</label>
                  <Input
                    className="bg-white"
                    type="number"
                    value={formData.distance_school}
                    onChange={(e) =>
                      setFormData({ ...formData, distance_school: e.target.value })
                    }
                    disabled={formData.bus_opted !== "yes"}
                    required={formData.bus_opted === "yes"}
                  />
                </div>
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
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Class Roll Number</label>
                <Input
                  className="bg-white"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  data-testid="edit-roll-number"
                />
              </div>
              
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Email</label>
                <Input
                  className="bg-white"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="edit-email"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">
                  Class
                </label>

                <select
                  className="bg-white w-full border rounded-md px-3 py-2 font-outfit"
                  value={formData.class_name}
                  onChange={(e) =>
                    setFormData({ ...formData, class_name: e.target.value })
                  }
                  data-testid="edit-class"
                >
                  <option value="">Select Class</option>
                  <option value="Nursery">Nursery</option>
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="1">1st</option>
                  <option value="2">2nd</option>
                  <option value="3">3rd</option>
                  <option value="4">4th</option>
                  <option value="5">5th</option>
                  <option value="6">6th</option>
                  <option value="7">7th</option>
                </select>
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Section</label>
                <Input
                  className="bg-white"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  data-testid="edit-section"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Phone</label>
                <Input
                  className="bg-white"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  data-testid="edit-phone"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Permanent Address</label>
                <Input
                  className="bg-white"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  data-testid="edit-address"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Name</label>
                <Input
                  className="bg-white"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  data-testid="edit-parent-name"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Phone</label>
                <Input
                  className="bg-white"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  data-testid="edit-parent-phone"
                />
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Bus Service Opted *</label>
                <select
                  value={formData.bus_opted}
                  onChange={(e) => {
                    const value = e.target.value;

                    setFormData({
                      ...formData,
                      bus_opted: value,
                      pickup_location: value === "yes" ? formData.pickup_location : "",
                      distance_school: value === "yes" ? formData.distance_school : ""
                    });
                  }}
                  required
                  className="w-full border border-gray-300 rounded-md p-2 text-sm">
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Pickup Location</label>
                <Input
                  className="bg-white"
                  value={formData.pickup_location}
                  onChange={(e) =>
                    setFormData({ ...formData, pickup_location: e.target.value })
                  }
                  disabled={formData.bus_opted !== "yes"}
                />
              </div>
              <div>
                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Distance from School</label>
                  <Input
                    className="bg-white"
                    type="number"
                    value={formData.distance_school}
                    onChange={(e) =>
                      setFormData({ ...formData, distance_school: e.target.value })
                    }
                    disabled={formData.bus_opted !== "yes"}
                    required={formData.bus_opted === "yes"}
                  />
                </div>
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