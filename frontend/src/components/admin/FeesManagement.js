import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Key } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function FeesManagement() {

	    const [students, setStudents] = useState([]);
	    const [loading, setLoading] = useState(true);
	    const [showFeeModal, setShowFeeModal] = useState(false);
	    const [feeDetails, setFeeDetails] = useState(null);
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

	     useEffect(() => {
	        fetchStudents();
	      }, []);

	    const fetchStudents = async () => {
	        try {
	          const response = await api.get('/admin/students');
            const studentsWithPendingFees = await Promise.all(
              response.data.map(async (student) => {
                try {
                  const feeRes = await api.post('/fees/calculate', {
                    ...student,
                    frequency: 'monthly',
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
              })
            );
	          setStudents(studentsWithPendingFees);
	        } catch (error) {
	          toast.error('Failed to fetch students');
	        } finally {
          setLoading(false);
        }
      };

	      const openFeeModal = async (student) => {
	        try {
            if (student.fee_details) {
              setFeeDetails(student.fee_details);
              setShowFeeModal(true);
              return;
            }
	          const res = await api.post("/fees/calculate", {
	            ...student,
	            frequency: "monthly"
	          });
	          setFeeDetails(res.data);
	          setShowFeeModal(true);
	        } catch (error) {
	          toast.error("Failed to calculate fee");
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
		          // Ignore; default state is "no concession"
		        } finally {
		          setConcessionLoading(false);
		        }
		      };

	      const saveConcession = async () => {
	        if (!concessionStudent) return;
	        if (concessionLocked) {
	          toast.info("Concession is already applied for this year and cannot be changed");
	          return;
	        }
	        setConcessionSaving(true);
	        try {
	          if (concessionApplied === 'no') {
	            await api.delete(`/admin/students/${concessionStudent.id}/concession`);
	            toast.success("Concession removed");
	          } else {
	            await api.put(`/admin/students/${concessionStudent.id}/concession`, {
	              percent: Number(concessionPercent),
	              reason: concessionReason,
	            });
	            toast.success("Concession saved");
	          }
	          setShowConcessionModal(false);
	          setConcessionStudent(null);
	        } catch (error) {
	          toast.error(error.response?.data?.detail || "Failed to save concession");
	        } finally {
	          setConcessionSaving(false);
	        }
	      };

	    return (
	      <div>
	        <div className="mb-8">
	          <h1 className="text-4xl font-fredoka font-bold text-sunny-navy">
            Fees Management
          </h1>
        </div>
  
        <div
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          data-testid="fees-table"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">
                    Enrollment No
                  </th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">
                    Name
                  </th>
                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">
                    Class
                  </th >
	                  <th className="text-left font-outfit font-semibold text-gray-700 py-3 px-4">
	                    Fee Pending
	                  </th>
		                  <th className="text-center font-outfit font-semibold text-gray-700 py-3 px-4">
		                    Concession
	                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                                <tr key={student.id} className="border-t hover:bg-gray-50">
	                                  <td className="font-outfit text-gray-900 py-3 px-4">{student.enrollment_number}</td>
	                                  <td className="font-outfit text-gray-900 py-3 px-4">{student.name}</td>
	                                  <td className="font-outfit text-gray-600 py-3 px-4">{student.class_name}</td>
	                                  <td className="py-3 px-4">
	                                    <div className="flex items-center gap-3">
                                      <span className="font-outfit text-gray-900">
                                        ₹{Number(student.pending_fee ?? 0).toLocaleString()}
                                      </span>
	                                    <button
                                    onClick={() => openFeeModal(student)}
                                    className={`px-3 py-1 rounded ${
                                      Number(student.pending_fee ?? 0) > 0
                                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                    data-testid={`fee-pending-${student.id}`}
                                    >
                                    {Number(student.pending_fee ?? 0) > 0 ? 'View Fee' : 'Paid'}
                                    </button>
                                    </div>
                                  </td>
	                                  <td className="py-3 px-4">
	                                  <div className="flex justify-center">
	                                      <button
	                                        onClick={() => openEditModal(student)}
	                                        className="text-sunny-blue hover:text-sunny-navy"
	                                        data-testid={`edit-student-${student.id}`}>
	                                        <Edit size={18} />
	                                      </button>
	                                    </div>
	                                  </td>
                                  
                                </tr>
                              ))}
              </tbody>
	            </table>
	            <Dialog
	              open={showConcessionModal}
	              onOpenChange={(open) => {
	                setShowConcessionModal(open);
	                if (!open) setConcessionStudent(null);
	              }}
	            >
	              <DialogContent className="sm:max-w-md">
	                <DialogHeader>
	                  <DialogTitle>
	                    Concession{concessionStudent ? `: ${concessionStudent.name}` : ""}
	                  </DialogTitle>
	                </DialogHeader>

	                <div className="grid gap-4">
	                  <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
	                    <Label className="text-sm font-outfit font-semibold text-gray-700">
	                      Is concession applied?
	                    </Label>
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
	                        <Label className="text-sm font-outfit font-semibold text-gray-700">
	                          Concession percent
	                        </Label>
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
	                        <Label className="text-sm font-outfit font-semibold text-gray-700">
	                          Reason
	                        </Label>
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
	                  <Button
	                    variant="outline"
	                    onClick={() => setShowConcessionModal(false)}
	                    disabled={concessionSaving}
	                  >
	                    Cancel
	                  </Button>
	                  <Button
	                    onClick={saveConcession}
	                    disabled={concessionLocked || concessionLoading || concessionSaving}
	                  >
	                    {concessionLocked ? "Concession Applied" : (concessionSaving ? "Saving..." : "Save")}
	                  </Button>
	                </DialogFooter>
	              </DialogContent>
	            </Dialog>

		            {showFeeModal && feeDetails && (
		                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
		                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
		                      <div className="flex items-start justify-between gap-4 border-b bg-gradient-to-r from-sunny-blue/10 to-transparent px-6 py-4">
		                        <div>
		                          <h2 className="text-xl font-fredoka font-bold text-sunny-navy">
		                            Fee Details
		                          </h2>
		                          <p className="mt-1 text-sm font-outfit text-gray-600">
		                            Breakdown of pending fees
		                          </p>
		                        </div>
		                        <button
		                          onClick={() => setShowFeeModal(false)}
		                          className="rounded-full px-3 py-1 text-sm font-outfit font-semibold text-gray-700 hover:bg-gray-100"
		                        >
		                          Close
		                        </button>
		                      </div>

		                      <div className="px-6 py-5">
		                        <div className="space-y-3 text-sm">
		                          <div className="flex items-center justify-between font-outfit text-gray-700">
		                            <span>Admission Fee</span>
		                            <span className="font-semibold tabular-nums text-gray-900">
		                              ₹{feeDetails.admission_fee}
		                            </span>
		                          </div>
		                          <div className="flex items-center justify-between font-outfit text-gray-700">
		                            <span>Annual Fee</span>
		                            <span className="font-semibold tabular-nums text-gray-900">
		                              ₹{feeDetails.annual_fee}
		                            </span>
		                          </div>
		                          <div className="flex items-center justify-between font-outfit text-gray-700">
		                            <span>Tuition Fee</span>
		                            <span className="font-semibold tabular-nums text-gray-900">
		                              ₹{feeDetails.tuition_fee}
		                            </span>
		                          </div>
		                          <div className="flex items-center justify-between font-outfit text-gray-700">
		                            <span>Bus Fee</span>
		                            <span className="font-semibold tabular-nums text-gray-900">
		                              ₹{feeDetails.bus_fee}
		                            </span>
		                          </div>
                              {Number(feeDetails.late_fee ?? 0) > 0 && (
		                          <div className="flex items-center justify-between font-outfit text-gray-700">
		                            <span>Late Fee</span>
		                            <span className="font-semibold tabular-nums text-gray-900">
		                              ₹{feeDetails.late_fee}
		                            </span>
		                          </div>
                              )}
		                          <div className="flex items-center justify-between font-outfit text-gray-700">
		                            <span>Caution Money</span>
		                            <span className="font-semibold tabular-nums text-gray-900">
		                              ₹{feeDetails.caution_money}
		                            </span>
		                          </div>

			                          {"concession" in feeDetails && (
			                            <div>
			                              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 font-outfit text-emerald-900">
			                                <span className="font-semibold">Concession</span>
			                                <span className="font-bold tabular-nums">- ₹{feeDetails.concession}</span>
			                              </div>
			                              {feeDetails?.breakup?.meta?.concession?.applied_by && (
			                                <div className="mt-1 px-1 text-xs font-outfit text-emerald-900/80">
			                                  Applied by{' '}
			                                  {feeDetails.breakup.meta.concession.applied_by?.name ||
			                                    feeDetails.breakup.meta.concession.applied_by?.email ||
			                                    '—'}
			                                  {feeDetails?.breakup?.meta?.concession?.applied_at
			                                    ? ` on ${new Date(feeDetails.breakup.meta.concession.applied_at).toLocaleString()}`
			                                    : ''}
			                                </div>
			                              )}
			                            </div>
			                          )}
		                        </div>

		                        <div className="my-5 h-px bg-gray-100" />

		                        <div className="flex items-center justify-between rounded-xl bg-sunny-navy px-4 py-3 text-white">
		                          <div className="font-outfit">
		                            <div className="text-xs opacity-90">Total Pending</div>
		                            <div className="text-lg font-bold tabular-nums">
		                              ₹{feeDetails.total_fee}
		                            </div>
		                          </div>
		                          <Button
		                            onClick={() => setShowFeeModal(false)}
		                            className="bg-white/90 text-sunny-navy hover:bg-white"
		                          >
		                            Done
		                          </Button>
		                        </div>
		                      </div>
		                    </div>
		                </div>
		                )}
	          </div>
	        </div>
	      </div>
    );
  }
