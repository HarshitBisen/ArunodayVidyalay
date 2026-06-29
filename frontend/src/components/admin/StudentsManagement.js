import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash2, Key, Eye, EyeOff, Search, ChevronDown, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Loader from '@/components/ui/loader';

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
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedClasses, setSelectedClasses] = useState(['Nursery']);
	const [classDropdownOpen, setClassDropdownOpen] = useState(false);
	const [classSearchQuery, setClassSearchQuery] = useState('');
	const classDropdownRef = useRef(null);
	const [searchFocused, setSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
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

	const fetchStudents = useCallback(async () => {
		setLoading(true);
		try {
			const params = {};
			if (selectedClasses && selectedClasses.length > 0) {
				params.class_name = selectedClasses.join(',');
			}

			const response = await api.get('/admin/students', { params });
			setStudents(response.data);
		} catch (error) {
			toast.error('Failed to fetch students');
		} finally {
			setLoading(false);
		}
	}, [selectedClasses]);

	useEffect(() => {
		fetchStudents();
	}, [fetchStudents]);

	// close class dropdown on outside click
	useEffect(() => {
		const onClick = (e) => {
			if (!classDropdownRef.current) return;
			if (!classDropdownRef.current.contains(e.target)) {
				setClassDropdownOpen(false);
			}
		};
		document.addEventListener('click', onClick);
		return () => document.removeEventListener('click', onClick);
	}, [classDropdownRef]);

	

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
    if (!window.confirm('Are you sure you want to make this student inactive?')) return;
    try {
      await api.delete(`/admin/students/${id}`);
      toast.success('Student deactivated successfully');
      fetchStudents();
    } catch (error) {
      toast.error('Failed to deactivate student');
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

	useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedClasses]);

	if (loading) {
		return <Loader message="Loading students" />;
	}

	const classOptions = [
		{ value: 'Nursery', label: 'Nursery' },
		{ value: 'JKG', label: 'JKG' },
		{ value: 'SKG', label: 'SKG' },
		...Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` })),
	];

	const filteredStudents = students.filter((student) => {
		// class multi-select filter
		if (selectedClasses.length > 0) {
			const sClass = (student.class_name || '').toString();
			if (!selectedClasses.includes(sClass)) return false;
		}

		// search filter (name, enrollment_number, roll_number)
		if (searchQuery && searchQuery.trim() !== '') {
			const q = searchQuery.trim().toLowerCase();
			const name = (student.name || '').toLowerCase();
			const enroll = (student.enrollment_number || '').toLowerCase();
			const roll = (student.roll_number || '').toLowerCase();
			if (!name.includes(q) && !enroll.includes(q) && !roll.includes(q)) return false;
		}

		return true;
	});

  const pagedStudents = filteredStudents.slice((currentPage - 1) * 10, currentPage * 10);
  const totalPages = Math.ceil(filteredStudents.length / 10);

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
						<div className="relative overflow-hidden rounded-xl">
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


			{/* Filter Card */}
			<div className="bg-gradient-to-r from-sunny-cream/40 via-white to-sunny-blue/5 rounded-2xl shadow-lg border border-sunny-border p-4 mb-4">
				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					{/* Search */}
					<div className="w-full md:flex-1 min-w-0">
						<div className="relative overflow-hidden rounded-xl">
							<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
								<Search size={18} />
							</div>
							<Input
								placeholder="Search students by name or enrollment"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onFocus={() => setSearchFocused(true)}
								onBlur={() => setSearchFocused(false)}
								className={`pl-10 rounded-xl border border-sunny-border w-full h-11 md:h-12 shadow-sm transition transform origin-left ${searchFocused ? 'scale-105 shadow-lg' : ''} bg-white/95 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sunny-blue/40`}
								data-testid="student-search"
							/>
							{searchQuery && (
								<button
									type="button"
									onClick={() => setSearchQuery('')}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-1"
									aria-label="Clear search"
								>
									<X size={14} />
								</button>
							)}
						</div>
					</div>

					{/* Class multi-select */}
					<div className="w-full md:w-80 md:flex-shrink-0">
						<div className="relative" ref={classDropdownRef}>
							<button
								type="button"
								onClick={() => setClassDropdownOpen((v) => !v)}
								className="w-full flex items-start gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 overflow-hidden"
								aria-expanded={classDropdownOpen}
								data-testid="class-dropdown-toggle"
							>
								<div className="flex-1 text-sm text-gray-700">
									{selectedClasses.length === 0 ? (
										<span className="text-gray-500">Classes</span>
									) : (
										<div className="flex flex-wrap items-start gap-2 max-h-32 overflow-auto">
											{selectedClasses.map((val) => {
												const opt = classOptions.find((o) => o.value === val);
												return (
													<span key={val} className="inline-flex items-center gap-1 bg-sunny-cream/70 text-sunny-navy rounded-full px-2 py-0.5 text-xs shadow-sm transition transform hover:scale-105 chip-pop">
														{opt ? opt.label : val}
														<button
															onClick={(e) => { e.stopPropagation(); setSelectedClasses((prev) => prev.filter((c) => c !== val)); }}
															className="ml-1 p-0.5 text-sunny-navy hover:text-sunny-navy/80"
															aria-label={`Remove ${val}`}
														>
															<X size={12} />
														</button>
													</span>
												)
											})}
										</div>
									)}
								</div>
								<ChevronDown size={18} className="text-gray-400 mt-1" />
							</button>

							<div
								className={`absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl z-50 border p-3 ${classDropdownOpen ? 'slide-fade-in' : ''}`}
								style={{
									opacity: classDropdownOpen ? 1 : 0,
									transform: classDropdownOpen ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
									transition: 'opacity 220ms cubic-bezier(.2,.9,.2,1), transform 220ms cubic-bezier(.2,.9,.2,1)',
									pointerEvents: classDropdownOpen ? 'auto' : 'none',
									boxShadow: classDropdownOpen ? '0 18px 40px rgba(2,6,23,0.12)' : undefined,
								}}
							>
								<div className="flex items-center gap-2 mb-3">
									<Input
										placeholder="Search classes"
										value={classSearchQuery}
										onChange={(e) => setClassSearchQuery(e.target.value)}
										className="rounded-md"
										data-testid="class-search"
									/>
									<div className="ml-2 flex gap-2">
										<button type="button" onClick={() => setSelectedClasses(classOptions.map(o => o.value))} className="text-sm text-sky-600 hover:underline">Select All</button>
										<button type="button" onClick={() => setSelectedClasses([])} className="text-sm text-gray-400 hover:underline">Clear</button>
									</div>
								</div>
								<div className="max-h-56 overflow-auto divide-y">
									{classOptions.filter(o => o.label.toLowerCase().includes(classSearchQuery.toLowerCase())).map((opt) => (
										<label key={opt.value} className="flex items-center justify-between gap-2 py-2 px-2 hover:bg-gray-50 rounded-md cursor-pointer">
											<div className="flex items-center gap-3">
												<input
													type="checkbox"
													checked={selectedClasses.includes(opt.value)}
													onChange={() => {
														if (selectedClasses.includes(opt.value)) setSelectedClasses(prev => prev.filter(v => v !== opt.value));
														else setSelectedClasses(prev => [...prev, opt.value]);
													}}
													className="h-4 w-4 accent-sky-600"
												/>
												<span className="text-sm text-gray-700">{opt.label}</span>
											</div>
											{selectedClasses.includes(opt.value) && (
												<Check size={16} className="text-sky-600" />
											)}
										</label>
									))}
								</div>
							</div>
						</div>
					</div>
				</div>
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
			  {pagedStudents.map((student) => (
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 mt-2">
          <span className="text-sm font-outfit text-gray-600">
            Showing {(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, filteredStudents.length)} of {filteredStudents.length}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-lg border text-sm font-outfit disabled:opacity-40 hover:bg-gray-50">Previous</button>
            <span className="text-sm font-outfit text-gray-700">{currentPage} / {totalPages}</span>
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 rounded-lg border text-sm font-outfit disabled:opacity-40 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}

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
