import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Key, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const getCurrentAcademicYear = () => {
  const now = new Date();
  // Academic year: April -> March. JS months are 0-indexed, so April is 3.
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const endYear = startYear + 1;
  return `${startYear}-${String(endYear).slice(-2)}`;
};

const getAcademicYearOptions = (count = 3) => {
  const now = new Date();
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const years = [];
  for (let i = 0; i < count; i += 1) {
    const start = startYear + i;
    const end = start + 1;
    years.push(`${start}-${String(end).slice(-2)}`);
  }
  return years;
};

export default function StudentsManagement() {
  const academicYearOptions = getAcademicYearOptions(3);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
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
	    new_student: '',
	    academic_year: getCurrentAcademicYear(),
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
    delete payload.enrollment_number;
  
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
      academic_year: student.academic_year || getCurrentAcademicYear(),
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (student) => {
    setSelectedStudent(student);
    setPasswordData({ new_password: '' });
    setShowNewPassword(false);
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
      address: '',
      parent_name: '',
      parent_phone: '',
      bus_opted:'',
      pickup_location:'',
      distance_school:'',
      new_student: '',
      academic_year: getCurrentAcademicYear(),
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
	            <form onSubmit={handleAdd} className="mt-4 space-y-6">
	              <div className="rounded-2xl border border-sunny-border bg-gradient-to-br from-sunny-cream/70 via-white to-sunny-blue/5 p-4 shadow-sm">
	                <div className="mb-4 flex items-baseline justify-between gap-4">
	                  <h3 className="font-fredoka text-lg font-bold text-sunny-navy">Student Details</h3>
	                  <p className="font-outfit text-xs text-gray-600">Fields marked * are required</p>
	                </div>
		                <div className="grid md:grid-cols-2 gap-4">
		                  <div>
		                    <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Enrollment Number</label>
		                    <Input
		                      className="w-full bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
		                      value="Auto generated"
		                      disabled
		                      data-testid="add-enrollment-number"
		                    />
                        <p className="mt-1 font-outfit text-xs text-gray-500">Generated automatically in `AV001` format.</p>
		                  </div>

		                  <div>
		                    <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Class Roll Number</label>
		                    <Input
		                      className="w-full bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
		                      value={formData.roll_number}
		                      onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
		                      data-testid="add-roll-number"
		                    />
		                  </div>
                <div>
	                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Name *</label>
	                  <Input
	                    className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    data-testid="add-name"
                  />
                </div>
                <div>
	                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Email </label>
	                  <Input
	                    className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="add-email"
                  />
                </div>
	                <div>
		                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Password *</label>
		                  <div className="relative">
			                  <Input
			                    className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40 pr-12"
			                    type={showStudentPassword ? 'text' : 'password'}
		                      value={formData.password}
		                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
		                      required
		                      data-testid="add-password"
		                    />
		                    <button
		                      type="button"
		                      onClick={() => setShowStudentPassword((v) => !v)}
		                      className="absolute inset-y-0 right-2 flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
		                      aria-label={showStudentPassword ? 'Hide password' : 'Show password'}
		                      data-testid="add-password-toggle"
		                    >
		                      {showStudentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
		                    </button>
		                  </div>
	                </div>
	                <div>
	                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">
	                    Class *
	                  </label>

	                  <select
	                    className="w-full rounded-md border border-sunny-border bg-white px-3 py-2 font-outfit focus:outline-none focus:ring-2 focus:ring-sunny-blue/40"
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
	                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">
	                    Academic Year *
	                  </label>
		                  <select
		                    className="w-full rounded-md border border-sunny-border bg-white px-3 py-2 font-outfit focus:outline-none focus:ring-2 focus:ring-sunny-blue/40"
		                    value={formData.academic_year}
		                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
		                    required
		                    data-testid="add-academic-year"
		                  >
	                    {academicYearOptions.map((yr) => (
	                      <option key={yr} value={yr}>
	                        {yr}
	                      </option>
	                    ))}
	                  </select>
	                </div>
	                <div>
	                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Section</label>
	                  <Input
	                    className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    data-testid="add-section"
                  />
                </div>
                <div>
	                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Phone</label>
	                  <Input
	                    className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="add-phone"
                  />
                </div>
                <div>
	                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Permanent Address *</label>
	                  <Input
	                    className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    data-testid="add-address"
                  />
                </div>
                <div>
	                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Name *</label>
	                  <Input
	                    className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    required
                    data-testid="add-parent-name"
                  />
                </div>
                <div>
	                  <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Phone *</label>
	                  <Input
	                    className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    required
                    data-testid="add-parent-phone"
                  />
                </div>
		                <div className="rounded-xl border border-sunny-border bg-white p-3">
		                  <label className="block font-outfit font-semibold text-sunny-navy mb-2 text-sm">
		                    New Student *
		                  </label>
	                  <div className="flex items-center gap-6">
	                    <label className="flex cursor-pointer items-center gap-2 font-outfit text-gray-700">
	                      <input
	                        type="radio"
	                        name="new_student"
	                        value="yes"
	                        checked={formData.new_student === "yes"}
	                        onChange={() => setFormData({ ...formData, new_student: "yes" })}
	                        required
	                        className="h-4 w-4 accent-sunny-blue"
	                      />
	                      Yes
	                    </label>
	                    <label className="flex cursor-pointer items-center gap-2 font-outfit text-gray-700">
	                      <input
	                        type="radio"
	                        name="new_student"
	                        value="no"
	                        checked={formData.new_student === "no"}
	                        onChange={() => setFormData({ ...formData, new_student: "no" })}
	                        className="h-4 w-4 accent-sunny-blue"
	                      />
	                      No
	                    </label>
		                  </div>
		                </div>

		                <div className="rounded-xl border border-sunny-border bg-white p-3 md:col-span-2">
		                  <label className="block font-outfit font-semibold text-sunny-navy mb-2 text-sm">
		                    Bus Service Opted *
		                  </label>
		                  <div className="flex flex-wrap items-center gap-6">
		                    <label className="flex cursor-pointer items-center gap-2 font-outfit text-gray-700">
		                      <input
		                        type="radio"
		                        name="bus_opted"
		                        value="yes"
		                        checked={formData.bus_opted === "yes"}
		                        onChange={() =>
		                          setFormData({
		                            ...formData,
		                            bus_opted: "yes",
		                          })
		                        }
		                        required
		                        className="h-4 w-4 accent-sunny-blue"
		                      />
		                      Yes
		                    </label>
		                    <label className="flex cursor-pointer items-center gap-2 font-outfit text-gray-700">
		                      <input
		                        type="radio"
		                        name="bus_opted"
		                        value="no"
		                        checked={formData.bus_opted === "no"}
		                        onChange={() =>
		                          setFormData({
		                            ...formData,
		                            bus_opted: "no",
		                            pickup_location: "",
		                            distance_school: "",
		                          })
		                        }
		                        className="h-4 w-4 accent-sunny-blue"
		                      />
		                      No
		                    </label>
		                  </div>

		                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
		                    <div>
		                      <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">
		                        Pickup Location
		                      </label>
			                      <Input
			                        className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
			                        value={formData.pickup_location}
			                        onChange={(e) =>
			                          setFormData({ ...formData, pickup_location: e.target.value })
			                        }
			                        disabled={formData.bus_opted !== "yes"}
			                        required={formData.bus_opted === "yes"}
			                      />
		                    </div>
		                    <div>
		                      <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">
		                        Distance from School
		                      </label>
		                      <Input
		                        className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
		                        type="number"
		                        min="0"
		                        value={formData.distance_school}
		                        onChange={(e) =>
		                          setFormData({ ...formData, distance_school: e.target.value })
		                        }
		                        disabled={formData.bus_opted !== "yes"}
		                        required={formData.bus_opted === "yes"}
		                      />
		                    </div>
		                  </div>
		                </div>
		                
		                </div>
		              </div>

	              <div className="sticky bottom-0 -mx-6 border-t bg-white/90 px-6 py-4 backdrop-blur">
	                <Button
	                  type="submit"
	                  className="w-full bg-sunny-yellow text-sunny-navy font-bold rounded-full py-2 hover:bg-sunny-yellow"
	                  data-testid="submit-add-student"
	                >
	                  Add Student
	                </Button>
	              </div>
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
	                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Enrollment No</th>
	                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Name</th>
	                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Email</th>
	                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Class</th>
	                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Academic Year</th>
	                <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Actions</th>
	              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-t hover:bg-gray-50">
                  <td className="font-outfit text-gray-900 py-3 px-4">{student.enrollment_number}</td>
                  <td className="font-outfit text-gray-900 py-3 px-4">{student.name}</td>
                  <td className="font-outfit text-gray-600 py-3 px-4">{student.email}</td>
	                  <td className="font-outfit text-gray-900 py-3 px-4">
	                    {student.class_name}-{student.section}
	                  </td>
	                  <td className="font-outfit text-gray-600 py-3 px-4">{student.academic_year || '-'}</td>
	                  
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
	          <form onSubmit={handleEdit} className="mt-4 space-y-6">
	            <div className="rounded-2xl border border-sunny-border bg-gradient-to-br from-sunny-cream/70 via-white to-sunny-blue/5 p-4 shadow-sm">
	              <div className="mb-4 flex items-baseline justify-between gap-4">
	                <h3 className="font-fredoka text-lg font-bold text-sunny-navy">Student Details</h3>
	                <p className="font-outfit text-xs text-gray-600">Update fields as needed</p>
	              </div>
	              <div className="grid md:grid-cols-2 gap-4">
	              <div>
	                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Class Roll Number</label>
	                <Input
	                  className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                  value={formData.roll_number}
	                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
	                  data-testid="edit-roll-number"
	                />
	              </div>
              
	              <div>
	                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Email</label>
	                <Input
	                  className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
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
	                  className="w-full rounded-md border border-sunny-border bg-white px-3 py-2 font-outfit focus:outline-none focus:ring-2 focus:ring-sunny-blue/40"
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
		                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">
		                  Academic Year *
		                </label>
		                <select
		                  className="w-full rounded-md border border-sunny-border bg-white px-3 py-2 font-outfit focus:outline-none focus:ring-2 focus:ring-sunny-blue/40"
		                  value={formData.academic_year}
		                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
		                  required
		                  data-testid="edit-academic-year"
		                >
	                  {academicYearOptions.map((yr) => (
	                    <option key={yr} value={yr}>
	                      {yr}
	                    </option>
	                  ))}
	                </select>
	              </div>
		              <div>
		                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Section</label>
		                <Input
	                  className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                  value={formData.section}
	                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
	                  data-testid="edit-section"
	                />
	              </div>
	              <div>
	                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Phone</label>
	                <Input
	                  className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                  value={formData.phone}
	                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
	                  data-testid="edit-phone"
	                />
	              </div>
	              <div>
	                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Permanent Address</label>
	                <Input
	                  className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                  value={formData.address}
	                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
	                  data-testid="edit-address"
	                />
	              </div>
	              <div>
	                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Name</label>
	                <Input
	                  className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                  value={formData.parent_name}
	                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
	                  data-testid="edit-parent-name"
	                />
	              </div>
	              <div>
	                <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">Parent Phone</label>
	                <Input
	                  className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
	                  value={formData.parent_phone}
	                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
	                  data-testid="edit-parent-phone"
	                />
	              </div>

		              <div className="rounded-xl border border-sunny-border bg-white p-3 md:col-span-2">
		                <label className="block font-outfit font-semibold text-sunny-navy mb-2 text-sm">
		                  Bus Service Opted *
		                </label>
		                <div className="flex flex-wrap items-center gap-6">
		                  <label className="flex cursor-pointer items-center gap-2 font-outfit text-gray-700">
		                    <input
		                      type="radio"
		                      name="edit_bus_opted"
		                      value="yes"
		                      checked={formData.bus_opted === "yes"}
		                      onChange={() =>
		                        setFormData({
		                          ...formData,
		                          bus_opted: "yes",
		                        })
		                      }
		                      required
		                      className="h-4 w-4 accent-sunny-blue"
		                    />
		                    Yes
		                  </label>
		                  <label className="flex cursor-pointer items-center gap-2 font-outfit text-gray-700">
		                    <input
		                      type="radio"
		                      name="edit_bus_opted"
		                      value="no"
		                      checked={formData.bus_opted === "no"}
		                      onChange={() =>
		                        setFormData({
		                          ...formData,
		                          bus_opted: "no",
		                          pickup_location: "",
		                          distance_school: "",
		                        })
		                      }
		                      className="h-4 w-4 accent-sunny-blue"
		                    />
		                    No
		                  </label>
		                </div>

		                <div className="mt-4 grid gap-3 sm:grid-cols-2">
		                  <div>
		                    <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">
		                      Pickup Location
		                    </label>
			                    <Input
			                      className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
			                      value={formData.pickup_location}
			                      onChange={(e) =>
			                        setFormData({ ...formData, pickup_location: e.target.value })
			                      }
			                      disabled={formData.bus_opted !== "yes"}
			                      required={formData.bus_opted === "yes"}
			                    />
		                  </div>
		                  <div>
		                    <label className="block font-outfit font-medium text-gray-700 mb-1 text-sm">
		                      Distance from School
		                    </label>
		                    <Input
		                      className="bg-white border-sunny-border shadow-sm focus-visible:ring-sunny-blue/40"
		                      type="number"
		                      min="0"
		                      value={formData.distance_school}
		                      onChange={(e) =>
		                        setFormData({ ...formData, distance_school: e.target.value })
		                      }
		                      disabled={formData.bus_opted !== "yes"}
		                      required={formData.bus_opted === "yes"}
		                    />
		                  </div>
		                </div>
		              </div>
	            </div>
	          </div>

	          <div className="sticky bottom-0 -mx-6 border-t bg-white/90 px-6 py-4 backdrop-blur">
	            <Button
	              type="submit"
	              className="w-full bg-sunny-yellow text-sunny-navy font-bold rounded-full py-2 hover:bg-sunny-yellow"
	              data-testid="submit-edit-student"
	            >
	              Update Student
	            </Button>
	          </div>
	          </form>
	        </DialogContent>
	      </Dialog>

      {/* Password Reset Modal */}
      <Dialog
        open={showPasswordModal}
        onOpenChange={(open) => {
          setShowPasswordModal(open);
          if (!open) {
            setPasswordData({ new_password: '' });
            setShowNewPassword(false);
          }
        }}
      >
        <DialogContent data-testid="password-reset-modal">
          <DialogHeader>
            <DialogTitle className="text-2xl font-fredoka font-bold text-sunny-navy">Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
            <div>
              <label className="block font-outfit font-medium text-gray-700 mb-2">New Password</label>
              <div className="relative">
                <Input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ new_password: e.target.value })}
                  required
                  className="pr-10"
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
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
