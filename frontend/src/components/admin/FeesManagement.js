import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Edit, Search, ChevronDown, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const classOptions = [
  { value: 'Nursery', label: 'Nursery' },
  { value: 'JKG', label: 'JKG' },
  { value: 'UKG', label: 'UKG' },
  ...Array.from({ length: 7 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` })),
];

export default function FeesManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClasses, setSelectedClasses] = useState(['Nursery']);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [classSearchQuery, setClassSearchQuery] = useState('');
  const classDropdownRef = useRef(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [feeDetails, setFeeDetails] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [offlineReceipt, setOfflineReceipt] = useState('');
  const [offlineMonth, setOfflineMonth] = useState(new Date().toISOString().slice(0, 7));
  const [offlineNote, setOfflineNote] = useState('');
  const [processingOffline, setProcessingOffline] = useState(false);
  const [showConcessionModal, setShowConcessionModal] = useState(false);
  const [concessionStudent, setConcessionStudent] = useState(null);
  const [concessionApplied, setConcessionApplied] = useState('no');
  const [concessionPercent, setConcessionPercent] = useState('25');
  const [concessionReason, setConcessionReason] = useState('sibling');
  const [concessionLoading, setConcessionLoading] = useState(false);
  const [concessionSaving, setConcessionSaving] = useState(false);
  const [concessionLocked, setConcessionLocked] = useState(false);
  const [concessionAppliedBy, setConcessionAppliedBy] = useState(null);
  const [concessionAppliedAt, setConcessionAppliedAt] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedClasses.length > 0) params.class_name = selectedClasses.join(',');
      const response = await api.get('/admin/students', { params });
      const studentsWithPendingFees = await Promise.all(
        response.data.map(async (student) => {
          try {
            const feeRes = await api.post('/fees/calculate', {
              ...student,
              frequency: 'monthly',
              include_paid_summary: true,
            });
            return {
              ...student,
              pending_fee: Number(feeRes.data?.total_fee ?? 0),
              fee_details: feeRes.data,
            };
          } catch (error) {
            return {
              ...student,
              pending_fee: 0,
              fee_details: null,
            };
          }
        }),
      );
      setStudents(studentsWithPendingFees);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [selectedClasses]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const openFeeModal = async (student) => {
    try {
      setSelectedStudent(student);
      setOfflineReceipt('');
      setOfflineNote('');
      setOfflineMonth(new Date().toISOString().slice(0, 7));
      const freshStudentsRes = await api.get('/admin/students');
      const freshStudent = freshStudentsRes.data.find((item) => item.id === student.id) || student;
      const res = await api.post('/fees/calculate', {
        ...freshStudent,
        frequency: 'monthly',
        include_paid_summary: true,
      });
      setFeeDetails(res.data);
      setShowFeeModal(true);
    } catch (error) {
      toast.error('Failed to calculate fee');
    }
  };

  const submitOfflinePayment = async () => {
    if (!selectedStudent) return;
    setProcessingOffline(true);
    try {
      const payload = {
        receipt: offlineReceipt,
      };
      const res = await api.post(`/admin/students/${selectedStudent.id}/mark-paid`, payload);
      const adminMeta = res.data?.admin_marked_by;
      const by = adminMeta ? adminMeta.name || adminMeta.email || adminMeta.admin_id || '' : '';
      toast.success(res.data?.message ? `${res.data.message}${by ? ` by ${by}` : ''}` : 'Offline payment recorded');
      setShowFeeModal(false);
      setSelectedStudent(null);
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record offline payment');
    } finally {
      setProcessingOffline(false);
    }
  };

  const openEditModal = async (student) => {
    setConcessionStudent(student);
    setConcessionApplied('no');
    setConcessionPercent('25');
    setConcessionReason('sibling');
    setConcessionLocked(false);
    setConcessionAppliedBy(null);
    setConcessionAppliedAt(null);
    setShowConcessionModal(true);
    setConcessionLoading(true);
    try {
      const res = await api.get(`/admin/students/${student.id}/concession`);
      if (res.data?.applied) {
        setConcessionApplied('yes');
        setConcessionPercent(String(res.data.percent ?? 25));
        setConcessionReason(String(res.data.reason ?? 'sibling'));
        setConcessionLocked(Boolean(res.data.locked));
        setConcessionAppliedBy(res.data.applied_by ?? null);
        setConcessionAppliedAt(res.data.applied_at ?? null);
      }
    } catch (error) {
      // Ignore; default state is no concession
    } finally {
      setConcessionLoading(false);
    }
  };

  const saveConcession = async () => {
    if (!concessionStudent) return;
    if (concessionLocked) {
      toast.info('Concession is already applied for this year and cannot be changed');
      return;
    }
    setConcessionSaving(true);
    try {
      if (concessionApplied === 'no') {
        await api.delete(`/admin/students/${concessionStudent.id}/concession`);
        toast.success('Concession removed');
      } else {
        await api.put(`/admin/students/${concessionStudent.id}/concession`, {
          percent: Number(concessionPercent),
          reason: concessionReason,
        });
        toast.success('Concession saved');
      }
      setShowConcessionModal(false);
      setConcessionStudent(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save concession');
    } finally {
      setConcessionSaving(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    if (!searchQuery || searchQuery.trim() === '') return true;
    const q = searchQuery.trim().toLowerCase();
    const name = (student.name || '').toLowerCase();
    const enroll = (student.enrollment_number || '').toLowerCase();
    const roll = (student.roll_number || '').toLowerCase();
    return name.includes(q) || enroll.includes(q) || roll.includes(q);
  });

  const displayFeeDetails = feeDetails?.total_fee === 0 && feeDetails?.paid_summary ? feeDetails.paid_summary : feeDetails;
  const isPaidSummary = Boolean(feeDetails?.total_fee === 0 && feeDetails?.paid_summary);
  const displayTotal = isPaidSummary ? Number(displayFeeDetails?.total_paid ?? 0) : Number(displayFeeDetails?.total_fee ?? 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-fredoka font-bold text-sunny-navy">Fees Management</h1>
      </div>

      <div className="bg-gradient-to-r from-sunny-cream/40 via-white to-sunny-blue/5 rounded-2xl shadow-lg border border-sunny-border p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="w-full md:flex-1 min-w-0">
            <div className="relative overflow-hidden rounded-xl">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={18} />
              </div>
              <Input
                placeholder="Search students by name or enrollment"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl border border-sunny-border w-full h-11 md:h-12 shadow-sm bg-white/95 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sunny-blue/40"
                data-testid="fee-student-search"
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

          <div className="w-full md:w-80 md:flex-shrink-0">
            <div className="relative" ref={classDropdownRef}>
              <button
                type="button"
                onClick={() => setClassDropdownOpen((v) => !v)}
                className="w-full flex items-start gap-2 rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm hover:shadow-md transition transform hover:-translate-y-0.5 overflow-hidden"
                aria-expanded={classDropdownOpen}
                data-testid="fee-class-dropdown-toggle"
              >
                <div className="flex-1 text-sm text-gray-700">
                  {selectedClasses.length === 0 ? (
                    <span className="text-gray-500">Classes</span>
                  ) : (
                    <div className="flex flex-wrap items-start gap-2 max-h-32 overflow-auto">
                      {selectedClasses.map((val) => {
                        const opt = classOptions.find((o) => o.value === val);
                        return (
                          <span key={val} className="inline-flex items-center gap-1 bg-sunny-cream/70 text-sunny-navy rounded-full px-2 py-0.5 text-xs shadow-sm transition transform hover:scale-105">
                            {opt ? opt.label : val}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClasses((prev) => prev.filter((c) => c !== val));
                              }}
                              className="ml-1 p-0.5 text-sunny-navy hover:text-sunny-navy/80"
                              aria-label={`Remove ${val}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        );
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
                    data-testid="fee-class-search"
                  />
                  <div className="ml-2 flex gap-2">
                    <button type="button" onClick={() => setSelectedClasses(classOptions.map((o) => o.value))} className="text-sm text-sky-600 hover:underline">
                      Select All
                    </button>
                    <button type="button" onClick={() => setSelectedClasses([])} className="text-sm text-gray-400 hover:underline">
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-56 overflow-auto divide-y">
                  {classOptions
                    .filter((o) => o.label.toLowerCase().includes(classSearchQuery.toLowerCase()))
                    .map((opt) => (
                      <label key={opt.value} className="flex items-center justify-between gap-2 py-2 px-2 hover:bg-gray-50 rounded-md cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedClasses.includes(opt.value)}
                            onChange={() => {
                              if (selectedClasses.includes(opt.value)) setSelectedClasses((prev) => prev.filter((v) => v !== opt.value));
                              else setSelectedClasses((prev) => [...prev, opt.value]);
                            }}
                            className="h-4 w-4 accent-sky-600"
                          />
                          <span className="text-sm text-gray-700">{opt.label}</span>
                        </div>
                        {selectedClasses.includes(opt.value) && <Check size={16} className="text-sky-600" />}
                      </label>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Enrollment No</th>
              <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Name</th>
              <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Class</th>
              <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">Fee Pending</th>
              <th className="text-center font-outfit font-semibold text-gray-700 py-3 px-4">Concession</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} className="border-t hover:bg-gray-50">
                <td className="font-outfit text-gray-900 py-3 px-4">{student.enrollment_number}</td>
                <td className="font-outfit text-gray-900 py-3 px-4">{student.name}</td>
                <td className="font-outfit text-gray-600 py-3 px-4">{student.class_name}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <span className="font-outfit text-gray-900">₹{Number(student.pending_fee ?? 0).toLocaleString()}</span>
                    <button
                      onClick={() => openFeeModal(student)}
                      className={`px-3 py-1 rounded ${Number(student.pending_fee ?? 0) > 0 ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      data-testid={`fee-pending-${student.id}`}
                    >
                      {Number(student.pending_fee ?? 0) > 0 ? 'View Fee' : 'Paid'}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-center">
                    <button onClick={() => openEditModal(student)} className="text-sunny-blue hover:text-sunny-navy" data-testid={`edit-student-${student.id}`}>
                      <Edit size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={showConcessionModal}
        onOpenChange={(open) => {
          setShowConcessionModal(open);
          if (!open) setConcessionStudent(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Concession{concessionStudent ? `: ${concessionStudent.name}` : ''}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <Label className="text-sm font-outfit font-semibold text-gray-700">Is concession applied?</Label>
              <div className="mt-3 flex items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2 font-outfit text-gray-700">
                  <input
                    type="radio"
                    name="concessionApplied"
                    value="yes"
                    checked={concessionApplied === 'yes'}
                    onChange={() => setConcessionApplied('yes')}
                    disabled={concessionLocked || concessionLoading || concessionSaving}
                    className="h-4 w-4 accent-sunny-blue"
                  />
                  Yes
                </label>
                <label className="flex cursor-pointer items-center gap-2 font-outfit text-gray-700">
                  <input
                    type="radio"
                    name="concessionApplied"
                    value="no"
                    checked={concessionApplied === 'no'}
                    onChange={() => setConcessionApplied('no')}
                    disabled={concessionLocked || concessionLoading || concessionSaving}
                    className="h-4 w-4 accent-sunny-blue"
                  />
                  No
                </label>
              </div>
            </div>

            {concessionApplied === 'yes' && (
              <div className="grid gap-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div className="grid gap-2">
                  <Label className="text-sm font-outfit font-semibold text-gray-700">Concession percent</Label>
                  <select
                    value={concessionPercent}
                    onChange={(e) => setConcessionPercent(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sunny-blue"
                    disabled={concessionLocked || concessionLoading || concessionSaving}
                  >
                    <option value="25">25%</option>
                    <option value="50">50%</option>
                    <option value="75">75%</option>
                    <option value="100">100%</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-outfit font-semibold text-gray-700">Reason</Label>
                  <select
                    value={concessionReason}
                    onChange={(e) => setConcessionReason(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-sunny-blue"
                    disabled={concessionLocked || concessionLoading || concessionSaving}
                  >
                    <option value="sibling">Sibling</option>
                    <option value="staff">Staff</option>
                    <option value="government sponsored">Government sponsored</option>
                  </select>
                </div>
              </div>
            )}

            {concessionLocked && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-outfit text-amber-800">
                <div className="font-semibold">Concession is already applied for this year.</div>
                {(concessionAppliedBy?.name || concessionAppliedBy?.email || concessionAppliedAt) && (
                  <div className="mt-1 text-xs opacity-90">
                    {concessionAppliedBy?.name || concessionAppliedBy?.email ? (
                      <span>Applied by {concessionAppliedBy?.name || concessionAppliedBy?.email}</span>
                    ) : null}
                    {concessionAppliedAt ? (
                      <span>
                        {(concessionAppliedBy?.name || concessionAppliedBy?.email) ? ' on ' : 'Applied on '}
                        {new Date(concessionAppliedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowConcessionModal(false)} disabled={concessionSaving}>
              Cancel
            </Button>
            <Button onClick={saveConcession} disabled={concessionLocked || concessionLoading || concessionSaving}>
              {concessionLocked ? 'Concession Applied' : concessionSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showFeeModal && feeDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b bg-gradient-to-r from-sunny-blue/10 to-transparent px-6 py-4">
              <div>
                <h2 className="text-xl font-fredoka font-bold text-sunny-navy">Fee Details</h2>
                <p className="mt-1 text-sm font-outfit text-gray-600">
                  {isPaidSummary ? 'Cumulative fees paid this academic year' : 'Breakdown of pending fees'}
                </p>
              </div>
              <button
                onClick={() => setShowFeeModal(false)}
                className="ml-auto bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg px-4 py-2 text-sm font-outfit font-semibold"
              >
                ✕ Close
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between font-outfit text-gray-700">
                  <span>Admission Fee</span>
                  <span className="font-semibold tabular-nums text-gray-900">₹{Number(displayFeeDetails?.admission_fee ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-outfit text-gray-700">
                  <span>Annual Fee</span>
                  <span className="font-semibold tabular-nums text-gray-900">₹{Number(displayFeeDetails?.annual_fee ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-outfit text-gray-700">
                  <span>Tuition Fee</span>
                  <span className="font-semibold tabular-nums text-gray-900">₹{Number(displayFeeDetails?.tuition_fee ?? 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between font-outfit text-gray-700">
                  <span>Bus Fee</span>
                  <span className="font-semibold tabular-nums text-gray-900">₹{Number(displayFeeDetails?.bus_fee ?? 0).toLocaleString()}</span>
                </div>
                {Number(displayFeeDetails?.late_fee ?? 0) > 0 && (
                  <div className="flex items-center justify-between font-outfit text-gray-700">
                    <span>Late Fee</span>
                    <span className="font-semibold tabular-nums text-gray-900">₹{Number(displayFeeDetails?.late_fee ?? 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-outfit text-gray-700">
                  <span>Caution Money</span>
                  <span className="font-semibold tabular-nums text-gray-900">₹{Number(displayFeeDetails?.caution_money ?? 0).toLocaleString()}</span>
                </div>

                {'concession' in (displayFeeDetails || {}) && (
                  <div>
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 font-outfit text-emerald-900">
                      <span className="font-semibold">Concession</span>
                      <span className="font-bold tabular-nums">- ₹{Number(displayFeeDetails?.concession ?? 0).toLocaleString()}</span>
                    </div>
                    {displayFeeDetails?.breakup?.meta?.concession?.applied_by && (
                      <div className="mt-1 px-1 text-xs font-outfit text-emerald-900/80">
                        Applied by{' '}
                        {displayFeeDetails.breakup.meta.concession.applied_by?.name ||
                          displayFeeDetails.breakup.meta.concession.applied_by?.email ||
                          '—'}
                        {displayFeeDetails?.breakup?.meta?.concession?.applied_at
                          ? ` on ${new Date(displayFeeDetails.breakup.meta.concession.applied_at).toLocaleString()}`
                          : ''}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="my-5 h-px bg-gray-100" />

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-sunny-navy px-4 py-3 text-white">
                  <div className="font-outfit">
                    <div className="text-xs opacity-90">{isPaidSummary ? 'Total Paid' : 'Total Pending'}</div>
                    <div className="text-lg font-bold tabular-nums">₹{displayTotal.toLocaleString()}</div>
                  </div>
                </div>

                {Number(feeDetails.total_fee) > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                    <h3 className="font-fredoka font-semibold text-sunny-navy">Mark as Cash Payment</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2 col-span-2">
                        <Label className="text-sm font-outfit font-semibold">Receipt Number *</Label>
                        <Input value={offlineReceipt} onChange={(e) => setOfflineReceipt(e.target.value)} placeholder="Enter receipt number" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-sm font-outfit font-semibold">Month (YYYY-MM)</Label>
                        <Input value={offlineMonth} onChange={(e) => setOfflineMonth(e.target.value)} placeholder={new Date().toISOString().slice(0, 7)} />
                      </div>
                      <div className="grid gap-2 col-span-2">
                        <Label className="text-sm font-outfit font-semibold">Note (optional)</Label>
                        <Input value={offlineNote} onChange={(e) => setOfflineNote(e.target.value)} placeholder="Cash receipt details" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={submitOfflinePayment} disabled={processingOffline || !offlineReceipt} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                        {processingOffline ? 'Recording...' : 'Record Payment'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
